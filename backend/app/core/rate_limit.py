import asyncio
import time
import ipaddress
from typing import Optional, Tuple
from fastapi import Request
from loguru import logger

from app.core.database import redis_client
from app.shared.exceptions import RateLimitException


def _normalize_ip_candidate(raw: str) -> str:
    """
    Chuẩn hóa chuỗi IP ứng viên, loại bỏ port nếu có:
    - IPv4 có port: '192.168.1.1:8080' -> '192.168.1.1'
    - IPv6 trong ngoặc vuông có hoặc không có port: '[2001:db8::1]:8080' -> '2001:db8::1'
    - IPv6 chuẩn không có ngoặc vuông: '2001:db8::1' -> '2001:db8::1'
    """
    cleaned = raw.strip()
    if cleaned.startswith("[") and "]" in cleaned:
        cleaned = cleaned[1:cleaned.index("]")]
    elif cleaned.count(":") == 1:
        # Dạng IPv4:port
        cleaned = cleaned.split(":")[0]
    return cleaned


def extract_client_ip(request: Request) -> str:
    """
    Trích xuất IP của client an toàn với cơ chế Anti-IP Spoofing.
    Ưu tiên theo thứ tự: CF-Connecting-IP -> X-Real-IP -> X-Forwarded-For (client đầu tiên) -> direct socket host.
    Validate định dạng thông qua thư viện chuẩn ipaddress sau khi chuẩn hóa loại bỏ port.
    """
    headers = request.headers
    candidates: list[Optional[str]] = []

    # 1. Cloudflare header
    cf_ip = headers.get("CF-Connecting-IP")
    if cf_ip:
        candidates.append(cf_ip)

    # 2. Nginx/Reverse Proxy standard header
    x_real_ip = headers.get("X-Real-IP")
    if x_real_ip:
        candidates.append(x_real_ip)

    # 3. Standard proxy chain (lấy client đầu tiên bên trái)
    xff = headers.get("X-Forwarded-For")
    if xff:
        first_ip = xff.split(",")[0].strip()
        candidates.append(first_ip)

    # 4. Socket client host
    if request.client and request.client.host:
        candidates.append(request.client.host.strip())

    for raw_candidate in candidates:
        if not raw_candidate:
            continue
        ip_str = _normalize_ip_candidate(raw_candidate)
        try:
            parsed = ipaddress.ip_address(ip_str)
            return str(parsed)
        except ValueError:
            logger.warning(f"⚠️ Phát hiện IP client không hợp lệ bị từ chối: '{raw_candidate}' (chuẩn hóa: '{ip_str}')")
            continue

    return "127.0.0.1"


class InMemoryRateLimiter:
    """Bộ giới hạn tốc độ lưu trữ trên RAM dùng làm cơ chế dự phòng an toàn (Fallback) khi Redis gặp sự cố."""

    def __init__(self) -> None:
        self._storage: dict[str, Tuple[int, float]] = {}
        self._lock = asyncio.Lock()

    def _cleanup_expired(self, now: float) -> None:
        """Dọn dẹp các key đã hết hạn để giải phóng bộ nhớ RAM."""
        expired_keys = [k for k, (_, exp) in self._storage.items() if now >= exp]
        for k in expired_keys:
            self._storage.pop(k, None)

    async def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int, int]:
        async with self._lock:
            now = time.time()
            # Dọn dẹp chủ động khi số lượng key vượt 1000
            if len(self._storage) > 1000:
                self._cleanup_expired(now)

            if key in self._storage:
                count, expire_at = self._storage[key]
                if now >= expire_at:
                    self._storage[key] = (1, now + window_seconds)
                    return False, 1, window_seconds
                else:
                    new_count = count + 1
                    self._storage[key] = (new_count, expire_at)
                    retry_after = max(1, int(expire_at - now))
                    return new_count > max_requests, new_count, retry_after
            else:
                self._storage[key] = (1, now + window_seconds)
                return False, 1, window_seconds

    async def reset(self, key: str) -> None:
        async with self._lock:
            self._storage.pop(key, None)


class DualKeyRateLimiter:
    """
    Hệ thống Rate Limiter Kép:
    Ưu tiên thao tác qua Redis phân tán. Nếu Redis timeout hoặc gặp sự cố kết nối,
    tự động chuyển mượt mà sang InMemoryRateLimiter để hệ thống luôn vận hành ổn định 100%.
    """

    def __init__(self) -> None:
        self._in_memory = InMemoryRateLimiter()

    async def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> Tuple[bool, int, int]:
        try:
            async def _check_redis() -> Tuple[bool, int, int]:
                count = await redis_client.incr(key)
                ttl = await redis_client.ttl(key)
                # Phòng vệ chống rò rỉ key (TTL Leak): nếu key mới hoặc ttl bị mất (ttl < 0), luôn đặt lại expire
                if count == 1 or ttl < 0:
                    await redis_client.expire(key, window_seconds)
                    ttl = window_seconds
                retry_after = max(1, ttl if ttl > 0 else window_seconds)
                return count > max_requests, count, retry_after

            return await asyncio.wait_for(_check_redis(), timeout=1.5)
        except Exception as e:
            logger.warning(f"⚠️ Redis rate limit gặp sự cố ({e}). Tự động fallback sang InMemoryRateLimiter.")
            return await self._in_memory.is_rate_limited(key, max_requests, window_seconds)

    async def reset(self, key: str) -> None:
        try:
            await redis_client.delete(key)
        except Exception as e:
            logger.warning(f"⚠️ Không thể xóa key {key} trên Redis: {e}")
        await self._in_memory.reset(key)


rate_limiter = DualKeyRateLimiter()


def rate_limit_ip(max_requests: int, window_seconds: int = 60, prefix: str = "rl"):
    """
    FastAPI Dependency Factory để áp dụng rate limit dựa trên IP client.
    """
    async def _dependency(request: Request) -> None:
        client_ip = extract_client_ip(request)
        key = f"{prefix}:ip:{client_ip}"
        is_limited, count, retry_after = await rate_limiter.is_rate_limited(key, max_requests, window_seconds)
        if is_limited:
            raise RateLimitException(
                detail=f"Quá giới hạn yêu cầu ({max_requests} lần/{window_seconds}s). Vui lòng thử lại sau {retry_after} giây.",
                retry_after=retry_after
            )

    return _dependency
