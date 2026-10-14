"""Async Client tương tác trực tiếp với máy chủ CVAT (https://cvat.itup.io.vn).

Tích hợp trực tiếp, tinh gọn và an toàn:
1. Đăng nhập bằng Username & Password để lấy Token cá nhân và CVAT User ID.
2. Xác thực và tra cứu hồ sơ bằng Personal Access Token (PAT).
3. Phân công công việc (Assign Job) cho Annotator.
4. Sinh URL mở trực tiếp Job/Task trên CVAT.
5. Xác thực chữ ký số HMAC-SHA256 cho Webhook.
"""

import hmac
import hashlib
import time
from typing import Optional, Dict, Any
import httpx
from loguru import logger
from app.core.config import settings


class CVATClient:
    """Async Client giao tiếp trực tiếp REST API với máy chủ CVAT."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        admin_token: Optional[str] = None,
        webhook_secret: Optional[str] = None,
        timeout: float = 10.0
    ):
        self.base_url = (base_url or settings.CVAT_BASE_URL).rstrip("/")
        self.admin_token = admin_token if admin_token is not None else settings.CVAT_ADMIN_TOKEN
        self.webhook_secret = webhook_secret or settings.CVAT_WEBHOOK_SECRET
        self.timeout = timeout

    async def login_with_credentials(
        self,
        username: str,
        password: str
    ) -> Dict[str, Any]:
        """Đăng nhập bằng tài khoản và mật khẩu trực tiếp trên máy chủ CVAT.
        
        Quy trình:
        1. Gửi POST /api/auth/login với {username, password} và header vnd.cvat+json.
        2. Nhận token key -> Dùng token tra cứu GET /api/users/self để lấy CVAT User ID và Profile.
        3. Mật khẩu không bao giờ được lưu trữ vào DB hoặc file log.
        """
        username = username.strip()
        if not username or not password:
            raise ValueError("Tài khoản và mật khẩu CVAT không được để trống")

        login_url = f"{self.base_url}/api/auth/login"
        payload = {
            "username": username,
            "password": password
        }

        headers = {
            "Accept": "application/vnd.cvat+json, application/json, */*",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.post(login_url, json=payload, headers=headers)

                if response.status_code in (200, 201):
                    data = response.json()
                    token_key = data.get("key")
                    if not token_key:
                        raise ValueError("Máy chủ CVAT không trả về token xác thực hợp lệ")

                    # Lấy thông tin chi tiết user
                    profile = await self.verify_user_token(token_key)
                    return {
                        "token": token_key,
                        "user_id": profile["id"],
                        "username": profile["username"],
                        "email": profile.get("email", ""),
                        "raw": profile.get("raw", {})
                    }
                elif response.status_code in (400, 401):
                    resp_json = {}
                    try:
                        resp_json = response.json()
                    except Exception:
                        pass
                    
                    err_msg = "Tài khoản hoặc mật khẩu trên máy chủ CVAT (https://cvat.itup.io.vn) không chính xác."
                    logger.warning(f"⚠️ Đăng nhập CVAT thất bại cho user '{username}': {resp_json}")
                    raise ValueError(err_msg)
                else:
                    logger.error(f"❌ CVAT login HTTP {response.status_code}: {response.text}")
                    raise ValueError(f"Máy chủ CVAT phản hồi lỗi (Mã HTTP {response.status_code})")

        except httpx.RequestError as exc:
            logger.error(f"❌ Lỗi kết nối máy chủ CVAT tại {login_url}: {exc}")
            raise ValueError(f"Không thể kết nối tới máy chủ CVAT tại {self.base_url}. Vui lòng kiểm tra đường truyền mạng.")

    def _format_auth_header(self, token: str) -> str:
        """Định dạng Authorization header: Giữ nguyên nếu đã có prefix, ngược lại tự động suy luận."""
        clean = token.strip()
        if clean.lower().startswith("bearer ") or clean.lower().startswith("token "):
            return clean
        # Token chứa dấu chấm (.) là định dạng Personal Access Token (PAT) của CVAT -> Bắt buộc dùng Bearer
        if "." in clean:
            return f"Bearer {clean}"
        return f"Token {clean}"

    async def verify_user_token(self, token: str) -> Dict[str, Any]:
        """Kiểm tra token cá nhân của người dùng trên CVAT host thông qua GET /api/users/self.
        
        Hỗ trợ cả Personal Access Token (PAT dùng Bearer) và Basic/Knox Token (dùng Token).
        """
        raw_token = token.strip()
        if not raw_token:
            raise ValueError("Token CVAT không được để trống")

        url = f"{self.base_url}/api/users/self"
        base_headers = {
            "Accept": "application/vnd.cvat+json, application/json, */*"
        }

        # Nếu token đã ghi rõ tiền tố (Bearer hoặc Token), ưu tiên dùng trực tiếp
        if raw_token.lower().startswith("bearer ") or raw_token.lower().startswith("token "):
            candidate_headers = [raw_token]
        elif "." in raw_token:
            # PAT token có dấu chấm (KeyID.Secret) -> Thử Bearer trước, sau đó fallback Token
            candidate_headers = [f"Bearer {raw_token}", f"Token {raw_token}"]
        else:
            # Token chuỗi liên tục (API Knox token) -> Thử Token trước, sau đó fallback Bearer
            candidate_headers = [f"Token {raw_token}", f"Bearer {raw_token}"]

        last_status_code = None
        last_error_text = ""

        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                for auth_header in candidate_headers:
                    req_headers = {**base_headers, "Authorization": auth_header}
                    response = await client.get(url, headers=req_headers)
                    last_status_code = response.status_code

                    if response.status_code == 200:
                        data = response.json()
                        user_id = data.get("id")
                        username = data.get("username", "")
                        if user_id is None:
                            raise ValueError("Dữ liệu phản hồi từ CVAT không chứa ID người dùng")

                        # Trích xuất đầy đủ thông tin chi tiết của tài khoản CVAT
                        prefix = "Bearer" if auth_header.startswith("Bearer") else "Token"
                        stored_token = f"{prefix} {raw_token}" if not (raw_token.startswith("Bearer ") or raw_token.startswith("Token ")) else raw_token

                        return {
                            "id": int(user_id),
                            "username": str(username),
                            "email": data.get("email", ""),
                            "first_name": data.get("first_name", ""),
                            "last_name": data.get("last_name", ""),
                            "groups": data.get("groups", []),
                            "is_staff": bool(data.get("is_staff", False)),
                            "is_superuser": bool(data.get("is_superuser", False)),
                            "is_active": bool(data.get("is_active", True)),
                            "date_joined": data.get("date_joined"),
                            "last_login": data.get("last_login"),
                            "auth_header": prefix,
                            "token_with_prefix": stored_token,
                            "raw": data
                        }
                    elif response.status_code in (401, 403):
                        last_error_text = response.text
                        continue  # Thử tiếp ứng viên header tiếp theo
                    else:
                        raise ValueError(f"Máy chủ CVAT phản hồi lỗi: HTTP {response.status_code} ({response.text})")

                # Nếu cả 2 header đều không hợp lệ
                logger.warning(f"⚠️ Xác thực CVAT token thất bại (HTTP {last_status_code}): {last_error_text}")
                raise ValueError(f"CVAT Token không hợp lệ hoặc đã hết hạn (Mã lỗi {last_status_code or 401})")

        except httpx.RequestError as exc:
            logger.warning(f"⚠️ Không thể kết nối tới CVAT server tại {url}: {exc}")
            raise ValueError(f"Không thể kết nối tới máy chủ CVAT tại {self.base_url} ({exc.__class__.__name__})")

    async def assign_job(
        self,
        cvat_job_id: int,
        assignee_id: int,
        auth_token: Optional[str] = None
    ) -> Dict[str, Any]:
        """Tự động gán assignee trên CVAT cho một job cụ thể qua PATCH /api/jobs/{id}."""
        token = (auth_token or self.admin_token or "").strip()
        url = f"{self.base_url}/api/jobs/{cvat_job_id}"
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/vnd.cvat+json, application/json, */*"
        }
        if token:
            headers["Authorization"] = self._format_auth_header(token)

        payload = {"assignee": assignee_id}

        try:
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                response = await client.patch(url, headers=headers, json=payload)
                if response.status_code in (200, 204):
                    logger.info(f"✅ Đã gán Job CVAT #{cvat_job_id} cho User #{assignee_id}")
                    return response.json() if response.content else {"success": True}
                else:
                    logger.warning(f"⚠️ CVAT assign_job trả về HTTP {response.status_code}: {response.text}")
                    return {"success": False, "status_code": response.status_code, "error": response.text}
        except httpx.RequestError as exc:
            logger.warning(f"⚠️ Lỗi kết nối khi gán Job CVAT #{cvat_job_id}: {exc}")
            return {"success": False, "error": str(exc)}

    async def test_connection(self) -> Dict[str, Any]:
        """Kiểm tra tình trạng sống (Health Check) và độ trễ tới máy chủ CVAT."""
        url = f"{self.base_url}/api/schema/"
        start_time = time.perf_counter()

        try:
            async with httpx.AsyncClient(timeout=8.0, follow_redirects=True) as client:
                response = await client.get(url)
                latency = round((time.perf_counter() - start_time) * 1000, 2)
                if response.status_code in (200, 301, 302, 401, 403):
                    return {
                        "status": "healthy",
                        "latency_ms": latency,
                        "message": f"Kết nối máy chủ CVAT thành công ({latency}ms - HTTP {response.status_code})"
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "latency_ms": latency,
                        "message": f"Máy chủ CVAT phản hồi HTTP {response.status_code}"
                    }
        except Exception as exc:
            return {
                "status": "unhealthy",
                "latency_ms": -1,
                "message": f"Không thể kết nối máy chủ CVAT: {str(exc)}"
            }

    def generate_job_url(self, cvat_job_id: int) -> str:
        """Sinh đường dẫn trực tiếp mở Job trên giao diện web của CVAT."""
        return f"{self.base_url}/tasks/jobs/{cvat_job_id}"

    def verify_webhook_signature(
        self,
        payload_bytes: bytes,
        signature_header: Optional[str],
        secret: Optional[str] = None
    ) -> bool:
        """Xác thực chữ ký HMAC-SHA256 của Webhook gửi từ CVAT."""
        if not signature_header:
            return False

        secret_key = (secret or self.webhook_secret or "").strip()
        if not secret_key:
            return False

        expected_sig = signature_header.strip()
        if expected_sig.lower().startswith("sha256="):
            expected_sig = expected_sig[7:].strip()

        mac = hmac.new(secret_key.encode("utf-8"), msg=payload_bytes, digestmod=hashlib.sha256)
        computed_sig = mac.hexdigest()

        return hmac.compare_digest(computed_sig.lower(), expected_sig.lower())


cvat_client = CVATClient()
