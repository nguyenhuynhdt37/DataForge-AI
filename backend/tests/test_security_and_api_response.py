import pytest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.main import app
from app.core.rate_limit import extract_client_ip, InMemoryRateLimiter, DualKeyRateLimiter
from app.shared.exceptions import RateLimitException
from app.modules.auth.models import User
from app.modules.auth.service import AuthService
from app.modules.auth.schemas import LoginRequest

client = TestClient(app)

# ============================================================
# 1. Kiểm thử Quyết định 2: Endpoint /projects bắt buộc đăng nhập (401)
# ============================================================

def test_get_projects_unauthorized():
    """GET /api/v1/projects khi chưa đăng nhập phải trả về HTTP 401 theo chuẩn ApiResponse."""
    res = client.get("/api/v1/projects")
    assert res.status_code == 401
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "UNAUTHORIZED"
    assert "detail" in data
    assert "timestamp" in data


def test_post_projects_unauthorized():
    """POST /api/v1/projects khi chưa đăng nhập phải trả về HTTP 401 theo chuẩn ApiResponse."""
    res = client.post("/api/v1/projects", json={"name": "Test Project"})
    assert res.status_code == 401
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "UNAUTHORIZED"
    assert "detail" in data
    assert "timestamp" in data


# ============================================================
# 2. Kiểm thử Quyết định 4: Chuẩn hóa 422 RequestValidationError
# ============================================================

def test_validation_error_format_422():
    """Gửi payload thiếu hoặc sai định dạng phải trả về 422 chuẩn ApiResponse với mảng detail và message tiếng Việt."""
    res = client.post("/api/v1/auth/login", json={})
    assert res.status_code == 422
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "VALIDATION_ERROR"
    assert isinstance(data["detail"], list)  # Đảm bảo giữ cấu trúc mảng pydantic cho frontend apiClient.ts
    assert len(data["detail"]) > 0
    assert "Dữ liệu không hợp lệ" in data["message"]


# ============================================================
# 3. Kiểm thử Anti-IP Spoofing & IP Extraction
# ============================================================

def test_extract_client_ip_cf_connecting_ip():
    scope = {
        "type": "http",
        "headers": [(b"cf-connecting-ip", b"203.0.113.195")],
        "client": ("10.0.0.1", 1234)
    }
    req = Request(scope)
    assert extract_client_ip(req) == "203.0.113.195"


def test_extract_client_ip_x_forwarded_for():
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"198.51.100.42, 10.0.0.2")],
        "client": ("10.0.0.1", 1234)
    }
    req = Request(scope)
    assert extract_client_ip(req) == "198.51.100.42"


def test_extract_client_ip_spoofed_or_invalid():
    scope = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"invalid_ip_string, 127.0.0.1")],
        "client": ("127.0.0.1", 1234)
    }
    req = Request(scope)
    # Phải bỏ qua chuỗi invalid và fallback về socket client hợp lệ
    assert extract_client_ip(req) == "127.0.0.1"


# ============================================================
# 4. Kiểm thử InMemoryRateLimiter & DualKey Fallback
# ============================================================

@pytest.mark.asyncio
async def test_in_memory_rate_limiter():
    limiter = InMemoryRateLimiter()
    key = "test_user_key"
    max_req = 3
    window = 10

    # Lần 1, 2, 3: chưa bị limit
    for _ in range(max_req):
        is_lim, count, retry_after = await limiter.is_rate_limited(key, max_req, window)
        assert is_lim is False

    # Lần 4: bị limit
    is_lim, count, retry_after = await limiter.is_rate_limited(key, max_req, window)
    assert is_lim is True
    assert count == 4
    assert retry_after > 0

    # Reset
    await limiter.reset(key)
    is_lim, count, _ = await limiter.is_rate_limited(key, max_req, window)
    assert is_lim is False
    assert count == 1


@pytest.mark.asyncio
async def test_dual_key_fallback_on_redis_error():
    limiter = DualKeyRateLimiter()
    with patch("app.core.rate_limit.redis_client.incr", side_effect=Exception("Redis connection refused")):
        is_lim, count, retry_after = await limiter.is_rate_limited("fallback_test", 2, 5)
        assert is_lim is False
        assert count == 1

        is_lim, count, retry_after = await limiter.is_rate_limited("fallback_test", 2, 5)
        assert is_lim is False
        assert count == 2

        # Lần 3 bị limit qua InMemory
        is_lim, count, retry_after = await limiter.is_rate_limited("fallback_test", 2, 5)
        assert is_lim is True
        assert count == 3


# ============================================================
# 5. Kiểm thử Global Handler cho RateLimitException (429)
# ============================================================

def test_rate_limit_exception_response():
    """Kiểm tra phản hồi khi RateLimitException được ném ra."""
    @app.get("/test-rate-limit-endpoint")
    async def sample_limited_endpoint():
        raise RateLimitException(detail="Bạn thao tác quá nhanh", retry_after=45)

    res = client.get("/test-rate-limit-endpoint")
    assert res.status_code == 429
    assert res.headers.get("retry-after") == "45"
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "RATE_LIMIT_EXCEEDED"
    assert data["message"] == "Bạn thao tác quá nhanh"
    assert data["detail"] == "Bạn thao tác quá nhanh"


# ============================================================
# 6. Kiểm thử Quyết định 1: Brute-Force Password Escalation to 2FA OTP
# ============================================================

@pytest.mark.asyncio
async def test_brute_force_password_escalation_to_2fa():
    """
    Khi người dùng nhập sai mật khẩu 5 lần:
    - Lần 1..4: Ném HTTPException(401)
    - Lần 5: Kích hoạt 2FA OTP escalation, trả về (user, requires_otp=True), không ném 401.
    """
    # Mock user trong DB
    fake_user = User(
        id=uuid.uuid4(),
        email="target_user@greensm.vn",
        hashed_password="some_argon2_hash",
        full_name="Nguyễn Văn Mục Tiêu",
        is_active=True
    )

    mock_db = AsyncMock()
    mock_scalar = MagicMock()
    mock_scalar.scalar_one_or_none.return_value = fake_user
    mock_db.execute.return_value = mock_scalar

    # Mock Redis và email_service
    fake_redis_store = {}
    async def mock_incr(key):
        fake_redis_store[key] = fake_redis_store.get(key, 0) + 1
        return fake_redis_store[key]

    async def mock_get(key):
        return fake_redis_store.get(key)

    async def mock_setex(key, ttl, val):
        fake_redis_store[key] = val
        return True

    async def mock_delete(key):
        fake_redis_store.pop(key, None)
        return True

    async def mock_sadd(key, val):
        if key not in fake_redis_store or not isinstance(fake_redis_store[key], set):
            fake_redis_store[key] = set()
        fake_redis_store[key].add(val)
        return 1

    async def mock_scard(key):
        s = fake_redis_store.get(key, set())
        return len(s) if isinstance(s, set) else 0

    async def mock_expire(key, ttl):
        return True

    req = LoginRequest(email="target_user@greensm.vn", password="wrong_password_123")

    with patch("app.modules.auth.service.redis_client.get", side_effect=mock_get), \
         patch("app.modules.auth.service.redis_client.setex", side_effect=mock_setex), \
         patch("app.modules.auth.service.redis_client.incr", side_effect=mock_incr), \
         patch("app.modules.auth.service.redis_client.sadd", side_effect=mock_sadd), \
         patch("app.modules.auth.service.redis_client.scard", side_effect=mock_scard), \
         patch("app.modules.auth.service.redis_client.expire", side_effect=mock_expire), \
         patch("app.modules.auth.service.redis_client.delete", side_effect=mock_delete), \
         patch("app.modules.auth.service.verify_password", return_value=False), \
         patch("app.core.email.email_service.send_otp_email", new_callable=AsyncMock) as mock_send_email:

        # Lần 1..4 từ 4 IP khác nhau -> đều raise 401
        for i in range(1, 5):
            with pytest.raises(Exception) as exc_info:
                await AuthService.check_credentials(mock_db, req, ip=f"192.168.1.{i}", ua="Rotating-Scanner")
            assert "Email hoặc mật khẩu không chính xác" in str(exc_info.value.detail)

        # Lần 5 từ IP thứ 5 -> CHUYỂN SANG 2FA ESCALATION! (không raise 401 nữa)
        user, requires_otp = await AuthService.check_credentials(mock_db, req, ip="192.168.1.5", ua="Rotating-Scanner")
        assert user.email == "target_user@greensm.vn"
        assert requires_otp is True

        # Đảm bảo mã OTP đã được lưu vào Redis
        otp_key = f"otp:{fake_user.id}"
        assert otp_key in fake_redis_store
        assert len(fake_redis_store[otp_key]) == 6

        # Đảm bảo cờ 2FA escalation đã được bật
        force_otp_key = f"auth:force_otp:{fake_user.id}"
        assert fake_redis_store.get(force_otp_key) == "1"


# ============================================================
# 7. Kiểm thử Quyết định 3: Chống Brute-force OTP 6 số
# ============================================================

@pytest.mark.asyncio
async def test_otp_brute_force_counter():
    """Kiểm tra logic giới hạn sai OTP 5 lần sẽ hủy mã OTP."""
    from app.core.database import get_db

    fake_user_id = str(uuid.uuid4())
    otp_key = f"otp:{fake_user_id}"
    otp_fail_key = f"otp_fail:{fake_user_id}"

    fake_redis = {
        otp_key: "123456",
        otp_fail_key: 0
    }

    async def mock_get(key):
        return fake_redis.get(key)

    async def mock_incr(key):
        fake_redis[key] = fake_redis.get(key, 0) + 1
        return fake_redis[key]

    async def mock_delete(key):
        fake_redis.pop(key, None)
        return True

    async def mock_expire(key, ttl):
        return True

    fake_user = User(id=uuid.UUID(fake_user_id), email="user@greensm.vn", is_active=True)

    async def override_get_db():
        mock_session = AsyncMock()
        mock_scalar = MagicMock()
        mock_scalar.scalar_one_or_none.return_value = fake_user
        mock_session.execute.return_value = mock_scalar
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with patch("app.modules.auth.router.redis_client.get", side_effect=mock_get), \
             patch("app.modules.auth.router.redis_client.incr", side_effect=mock_incr), \
             patch("app.modules.auth.router.redis_client.delete", side_effect=mock_delete), \
             patch("app.modules.auth.router.redis_client.expire", side_effect=mock_expire):

            # Thử 4 lần sai OTP: trả về 400 kèm số lần thử còn lại
            for attempt in range(1, 5):
                res = client.post("/api/v1/auth/verify-otp", json={"email": "user@greensm.vn", "otp": "999999"})
                assert res.status_code == 400
                remaining = 5 - attempt
                assert f"Bạn còn {remaining} lần thử" in res.json()["message"]

            # Lần thứ 5 sai OTP: HỦY NGAY OTP trong Redis và trả về cảnh báo hủy mã
            res5 = client.post("/api/v1/auth/verify-otp", json={"email": "user@greensm.vn", "otp": "999999"})
            assert res5.status_code == 400
            assert "Mã OTP hiện tại đã bị hủy" in res5.json()["message"]
            # Xác nhận key otp đã bị xóa khỏi Redis
            assert otp_key not in fake_redis
    finally:
        app.dependency_overrides.clear()


# ============================================================
# 8. Kiểm thử Quyết định 3: Cooldown 60s cho /resend-otp
# ============================================================

@pytest.mark.asyncio
async def test_resend_otp_cooldown_60s():
    """Kiểm tra logic /resend-otp: giới hạn tối thiểu 60s giữa 2 lần gửi lại OTP."""
    from app.core.database import get_db

    fake_user_id = str(uuid.uuid4())
    fake_user = User(id=uuid.UUID(fake_user_id), email="cooldown_user@greensm.vn", is_active=True)

    fake_redis = {}

    async def mock_ttl(key):
        if "otp_cooldown:" in key and key in fake_redis:
            return 45  # Đang còn 45 giây cooldown
        return -2

    async def mock_setex(key, ttl, val):
        fake_redis[key] = val
        return True

    async def mock_delete(key):
        fake_redis.pop(key, None)
        return True

    async def override_get_db():
        mock_session = AsyncMock()
        mock_scalar = MagicMock()
        mock_scalar.scalar_one_or_none.return_value = fake_user
        mock_session.execute.return_value = mock_scalar
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        # Khi key cooldown đang tồn tại (ttl > 0)
        with patch("app.modules.auth.router.redis_client.ttl", side_effect=mock_ttl):
            fake_redis["otp_cooldown:cooldown_user@greensm.vn"] = "1"
            res = client.post(
                "/api/v1/auth/resend-otp", 
                json={"email": "cooldown_user@greensm.vn"},
                headers={"CF-Connecting-IP": "198.51.100.77"}
            )
            assert res.status_code == 429
            # Bắt buộc có header Retry-After theo chuẩn HTTP 429
            assert res.headers.get("retry-after") == "45"
            data = res.json()
            assert data["success"] is False
            assert data["error_code"] == "RATE_LIMIT_EXCEEDED"
            assert "Vui lòng đợi 45 giây" in data["message"]

        # Khi key cooldown đã hết (ttl <= 0)
        fake_redis.clear()
        async def mock_ttl_zero(key):
            return -2

        with patch("app.modules.auth.router.redis_client.ttl", side_effect=mock_ttl_zero), \
             patch("app.modules.auth.router.redis_client.setex", side_effect=mock_setex), \
             patch("app.modules.auth.router.redis_client.delete", side_effect=mock_delete), \
             patch("app.modules.auth.service.AuthService.resend_otp", new_callable=AsyncMock) as mock_resend:
            res_ok = client.post(
                "/api/v1/auth/resend-otp", 
                json={"email": "cooldown_user@greensm.vn"},
                headers={"CF-Connecting-IP": "198.51.100.78"}
            )
            assert res_ok.status_code == 200
            data_ok = res_ok.json()
            assert data_ok["success"] is True
            assert "Đã tạo và gửi lại mã OTP mới" in data_ok["message"]
            assert "otp_cooldown:cooldown_user@greensm.vn" in fake_redis
    finally:
        app.dependency_overrides.clear()


# ============================================================
# 9. Kiểm thử Edge Case: Anti-IP Spoofing với IPv6 và Port phức tạp
# ============================================================

def test_extract_client_ip_with_ports_and_ipv6():
    """Kiểm tra trích xuất IP chính xác khi header chứa port hoặc IPv6 trong ngoặc vuông."""
    # 1. IPv6 có port: [2001:db8::1]:8080
    scope1 = {
        "type": "http",
        "headers": [(b"x-forwarded-for", b"[2001:db8::1]:8080, 10.0.0.1")],
        "client": ("127.0.0.1", 1234)
    }
    assert extract_client_ip(Request(scope1)) == "2001:db8::1"

    # 2. IPv4 có port: 198.51.100.42:9000
    scope2 = {
        "type": "http",
        "headers": [(b"cf-connecting-ip", b"198.51.100.42:9000")],
        "client": ("127.0.0.1", 1234)
    }
    assert extract_client_ip(Request(scope2)) == "198.51.100.42"

    # 3. IPv6 chuẩn không có ngoặc vuông: 2001:db8::2
    scope3 = {
        "type": "http",
        "headers": [(b"x-real-ip", b"2001:db8::2")],
        "client": ("127.0.0.1", 1234)
    }
    assert extract_client_ip(Request(scope3)) == "2001:db8::2"


# ============================================================
# 10. Kiểm thử Trim khoảng trắng mã OTP trong verify-otp
# ============================================================

@pytest.mark.asyncio
async def test_verify_otp_whitespace_trimming():
    """Kiểm tra verify-otp vẫn xử lý thành công khi người dùng nhập thừa khoảng trắng."""
    from app.core.database import get_db

    fake_user_id = str(uuid.uuid4())
    fake_user = User(
        id=uuid.UUID(fake_user_id), 
        email="trim_user@greensm.vn", 
        full_name="Nguyễn Văn Trim",
        is_active=True
    )

    fake_redis = {f"otp:{fake_user_id}": "654321"}

    async def override_get_db():
        mock_session = AsyncMock()
        mock_scalar = MagicMock()
        mock_scalar.scalar_one_or_none.return_value = fake_user
        mock_session.execute.return_value = mock_scalar
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db

    async def mock_async_get(k):
        return fake_redis.get(k)

    try:
        with patch("app.modules.auth.router.redis_client.get", side_effect=mock_async_get), \
             patch("app.modules.auth.router.redis_client.delete", new_callable=AsyncMock), \
             patch("app.modules.auth.service.AuthService.finalize_login", return_value=("fake_acc", "fake_ref", 3600)):
            # Nhập OTP kèm space trước và sau
            res = client.post("/api/v1/auth/verify-otp", json={"email": "trim_user@greensm.vn", "otp": "  654321  "})
            assert res.status_code == 200
            data = res.json()
            assert data["success"] is True
            assert data["data"]["access_token"] == "fake_acc"
    finally:
        app.dependency_overrides.clear()


# ============================================================
# 11. Kiểm thử phòng vệ TTL Leak trong DualKeyRateLimiter
# ============================================================

@pytest.mark.asyncio
async def test_rate_limit_permanent_leak_protection():
    """Kiểm tra khi ttl < 0 (key bị mất ttl), limiter phải tự động bù đắp expire(window)."""
    limiter = DualKeyRateLimiter()

    with patch("app.core.rate_limit.redis_client.incr", new_callable=AsyncMock, return_value=5), \
         patch("app.core.rate_limit.redis_client.ttl", new_callable=AsyncMock, return_value=-1), \
         patch("app.core.rate_limit.redis_client.expire", new_callable=AsyncMock) as mock_expire:
        
        is_limited, count, retry_after = await limiter.is_rate_limited("key_no_ttl", max_requests=10, window_seconds=60)
        assert is_limited is False
        assert count == 5
        assert retry_after == 60
        # Đảm bảo lệnh expire đã được gọi bù đắp để tránh leak vĩnh viễn
        mock_expire.assert_awaited_once_with("key_no_ttl", 60)


# ============================================================
# 12. Kiểm thử Generic Exception Handler (500) không lộ chi tiết nội bộ (CWE-209)
# ============================================================

def test_500_generic_exception_does_not_leak_internals():
    """Kiểm tra endpoint bị unhandled exception 500 không rò rỉ nội bộ exception string."""
    # Khởi tạo client riêng không raise server exceptions để test HTTP 500 JSON response
    safe_client = TestClient(app, raise_server_exceptions=False)

    @app.get("/test-internal-crash-cwe209")
    async def crashing_endpoint():
        raise RuntimeError("CRITICAL_SECRET_DB_PASSWORD_123456_LEAK")

    res = safe_client.get("/test-internal-crash-cwe209")
    assert res.status_code == 500
    data = res.json()
    assert data["success"] is False
    assert data["error_code"] == "INTERNAL_SERVER_ERROR"
    # Chuỗi nhạy cảm CRITICAL_SECRET_DB_PASSWORD_123456_LEAK tuyệt đối không được xuất hiện trong JSON response
    assert "CRITICAL_SECRET_DB_PASSWORD_123456_LEAK" not in data["detail"]
    assert "CRITICAL_SECRET_DB_PASSWORD_123456_LEAK" not in data["message"]

