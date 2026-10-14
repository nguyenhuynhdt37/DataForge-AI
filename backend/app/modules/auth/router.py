import uuid
from typing import Optional
from fastapi import (
    APIRouter, 
    Depends, 
    HTTPException, 
    Request, 
    Response, 
    WebSocket, 
    WebSocketDisconnect, 
    Cookie, 
    UploadFile, 
    File,
    Query
)
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.database import get_db, redis_client
from app.core.websocket import ws_manager
from app.core.rate_limit import extract_client_ip, rate_limit_ip
from app.shared.schemas import ApiResponse
from app.shared.exceptions import RateLimitException
from loguru import logger
from app.modules.auth.schemas import (
    RegisterRequest, 
    LoginRequest, 
    VerifyOtpRequest, 
    ResendOtpRequest,
    TokenData, 
    UserProfile,
    UpdateProfileRequest,
    ChangePasswordRequest,
    SessionResponse,
    UserListItem,
    UserPaginationResponse,
    RefreshTokenRequest,
    CvatTokenUpdateRequest,
    CvatTokenResponse,
    CvatCredentialsLoginRequest,
    FirstLoginStatusResponse,
    CvatDetailedProfileResponse,
    CvatTokenCheckResponse,
    CvatTokenPingResponse
)
from app.core.cvat_client import cvat_client
from app.core.config import settings
from app.modules.auth.service import AuthService
from app.modules.auth.dependencies import get_current_user, get_current_admin
from app.modules.auth.models import User

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

def _build_user_profile(user: User) -> UserProfile:
    groups_list = []
    if user.cvat_groups:
        groups_list = [g.strip() for g in user.cvat_groups.split(",") if g.strip()]

    return UserProfile(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name or "",
        avatar_url=user.avatar_url,
        title=user.title,
        total_annotated=user.total_annotated if user.total_annotated is not None else 0,
        accuracy_rate=user.accuracy_rate if user.accuracy_rate is not None else 0.0,
        is_admin=bool(user.is_admin),
        is_active=bool(user.is_active) if user.is_active is not None else True,
        cvat_user_id=user.cvat_user_id,
        cvat_username=user.cvat_username,
        cvat_email=user.cvat_email,
        cvat_first_name=user.cvat_first_name,
        cvat_last_name=user.cvat_last_name,
        cvat_groups=groups_list,
        cvat_is_staff=bool(user.cvat_is_staff),
        is_first_login=bool(user.is_first_login) if user.is_first_login is not None else True,
        last_login_at=user.last_login_at
    )

# ============================================================
# 1. Xác thực & Đăng nhập (Authentication)
# ============================================================

@router.post("/register", response_model=ApiResponse[UserProfile], dependencies=[Depends(rate_limit_ip(max_requests=5, window_seconds=60, prefix="rl:register"))])
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.register_user(db, req)
    return ApiResponse(
        message="Đăng ký tài khoản thành công",
        data=_build_user_profile(user)
    )

@router.post("/login", response_model=ApiResponse[TokenData], dependencies=[Depends(rate_limit_ip(max_requests=30, window_seconds=60, prefix="rl:login"))])
async def login(
    req: LoginRequest, 
    request: Request, 
    db: AsyncSession = Depends(get_db)
):
    ip = extract_client_ip(request)
    ua = request.headers.get("User-Agent", "Unknown")

    user, force_otp = await AuthService.check_credentials(db, req, ip, ua)
    
    # 1. Nếu tài khoản bị phát hiện brute force -> bắt buộc xác thực 2FA OTP
    if force_otp:
        return ApiResponse(
            message="Phát hiện nhiều lần đăng nhập không hợp lệ từ các IP khác nhau. Hệ thống đã kích hoạt xác thực 2FA và gửi mã OTP về email của bạn.",
            data=TokenData(
                access_token="", 
                refresh_token=None, 
                requires_otp=True, 
                message="Yêu cầu xác thực 2FA bằng mã OTP gửi về email"
            )
        )

    # 2. Kiểm tra bất thường thiết bị/IP
    requires_otp = await AuthService.verify_device_anomaly(db, user, ip, ua)
    if requires_otp:
        return ApiResponse(
            message="Phát hiện thiết bị mới. Hệ thống đã gửi mã OTP xác thực về email của bạn.",
            data=TokenData(
                access_token="", 
                refresh_token=None, 
                requires_otp=True, 
                message="Yêu cầu nhập mã OTP"
            )
        )

    access_token, refresh_token, max_age = await AuthService.finalize_login(db, user, ip, ua)
    return ApiResponse(
        message="Đăng nhập thành công",
        data=TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=max_age,
            requires_otp=False,
            user=_build_user_profile(user)
        )
    )

@router.post("/verify-otp", response_model=ApiResponse[TokenData], dependencies=[Depends(rate_limit_ip(max_requests=20, window_seconds=60, prefix="rl:verify_otp"))])
async def verify_otp(
    req: VerifyOtpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")

    otp_key = f"otp:{user.id}"
    otp_fail_key = f"otp_fail:{user.id}"

    try:
        cached_otp = await redis_client.get(otp_key)
    except Exception as e:
        logger.warning(f"⚠️ Redis get otp lỗi: {e}")
        cached_otp = None

    if not cached_otp:
        raise HTTPException(
            status_code=400, 
            detail="Mã OTP không tồn tại hoặc đã hết hạn (5 phút). Vui lòng yêu cầu gửi lại mã mới."
        )

    # Kiểm tra mã OTP: Chống brute-force 6 số, tối đa 5 lần thử sai (hỗ trợ trim khoảng trắng thừa)
    submitted_otp = req.otp.strip() if req.otp else ""
    if cached_otp != submitted_otp:
        fail_count = 1
        try:
            fail_count = await redis_client.incr(otp_fail_key)
            await redis_client.expire(otp_fail_key, 300)
        except Exception as e:
            logger.warning(f"⚠️ Redis incr otp_fail lỗi: {e}")

        if fail_count >= 5:
            # Hủy ngay mã OTP trong Redis và bộ đếm
            try:
                await redis_client.delete(otp_key)
                await redis_client.delete(otp_fail_key)
            except Exception as e:
                logger.warning(f"⚠️ Redis delete otp lỗi: {e}")
            raise HTTPException(
                status_code=400,
                detail="Bạn đã nhập sai mã OTP quá 5 lần. Mã OTP hiện tại đã bị hủy để đảm bảo an toàn. Vui lòng nhấn gửi lại mã mới."
            )

        remaining = max(0, 5 - fail_count)
        raise HTTPException(
            status_code=400,
            detail=f"Mã OTP không chính xác. Bạn còn {remaining} lần thử."
        )

    # Khi mã OTP hợp lệ: Xóa mã OTP và toàn bộ cờ brute force
    try:
        await redis_client.delete(otp_key)
        await redis_client.delete(otp_fail_key)
        await redis_client.delete(f"auth:force_otp:{user.id}")
        await redis_client.delete(f"auth:failed_count:{user.email}")
        await redis_client.delete(f"auth:failed_ips:{user.email}")
    except Exception as e:
        logger.warning(f"⚠️ Redis xóa cờ sau verify otp lỗi: {e}")

    ip = req.ip_address or extract_client_ip(request)
    ua = req.user_agent or request.headers.get("User-Agent", "Unknown")

    access_token, refresh_token, max_age = await AuthService.finalize_login(db, user, ip, ua)
    return ApiResponse(
        message="Xác thực thiết bị thành công",
        data=TokenData(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=max_age,
            requires_otp=False,
            user=_build_user_profile(user)
        )
    )

@router.post("/resend-otp", response_model=ApiResponse[dict], dependencies=[Depends(rate_limit_ip(max_requests=5, window_seconds=60, prefix="rl:resend_otp"))])
async def resend_otp(
    req: ResendOtpRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản.")
    
    # Bảo vệ /resend-otp: Giới hạn tối thiểu 60 giây giữa 2 lần gửi lại OTP theo email
    cooldown_key = f"otp_cooldown:{user.email}"
    try:
        ttl = await redis_client.ttl(cooldown_key)
    except Exception as e:
        logger.warning(f"⚠️ Redis ttl cooldown gặp sự cố: {e}")
        ttl = -1

    if ttl > 0:
        raise RateLimitException(
            detail=f"Vui lòng đợi {ttl} giây trước khi yêu cầu gửi lại mã OTP mới.",
            retry_after=ttl
        )

    ip = extract_client_ip(request)
    ua = request.headers.get("User-Agent", "Unknown")

    await AuthService.resend_otp(db, user, ip, ua)

    # Đặt cooldown 60 giây và reset bộ đếm thử sai OTP
    try:
        await redis_client.setex(cooldown_key, 60, "1")
        await redis_client.delete(f"otp_fail:{user.id}")
    except Exception as e:
        logger.warning(f"⚠️ Redis set cooldown / reset fail counter lỗi: {e}")

    return ApiResponse(
        message="Đã tạo và gửi lại mã OTP mới về email của bạn.",
        data={"success": True}
    )

@router.post("/refresh", response_model=ApiResponse[TokenData])
async def refresh_token(
    req: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    if not req.refresh_token:
        raise HTTPException(status_code=401, detail="Không tìm thấy refresh token.")
    
    new_access_token, new_refresh_token, user = await AuthService.refresh_access_token(db, req.refresh_token)
    return ApiResponse(
        message="Gia hạn access token thành công",
        data=TokenData(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            expires_in=7 * 24 * 3600,
            requires_otp=False,
            user=_build_user_profile(user)
        )
    )

@router.post("/logout", response_model=ApiResponse[dict])
async def logout(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await AuthService.logout_user(db, current_user.id)
    return ApiResponse(message="Đăng xuất thành công", data={"success": True})

# ============================================================
# 2. Hồ sơ cá nhân & Bảo mật (Profile Management)
# ============================================================

@router.get("/me", response_model=ApiResponse[UserProfile])
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return ApiResponse(
        message="Lấy hồ sơ cá nhân thành công",
        data=_build_user_profile(current_user)
    )

@router.put("/me", response_model=ApiResponse[UserProfile])
async def update_my_profile(
    req: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    user = await AuthService.update_profile(db, current_user, req)
    return ApiResponse(
        message="Cập nhật hồ sơ cá nhân thành công",
        data=_build_user_profile(user)
    )

@router.post("/me/avatar", response_model=ApiResponse[UserProfile])
async def upload_my_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    content = await file.read()
    content_type = file.content_type or "image/jpeg"
    await AuthService.upload_user_avatar(db, current_user, content, content_type)
    return ApiResponse(
        message="Cập nhật ảnh đại diện thành công",
        data=_build_user_profile(current_user)
    )

@router.put("/me/password", response_model=ApiResponse[dict])
async def change_my_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await AuthService.change_password(db, current_user, req)
    return ApiResponse(
        message="Đổi mật khẩu thành công. Các thiết bị khác đã được đăng xuất an toàn.",
        data={"success": True}
    )

@router.post("/me/cvat-login", response_model=ApiResponse[CvatTokenResponse])
async def login_and_connect_cvat(
    req: CvatCredentialsLoginRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Xác thực tài khoản và mật khẩu trực tiếp từ máy chủ CVAT (https://cvat.itup.io.vn).
    
    Quy trình an toàn:
    1. Gửi thông tin sang CVAT Plugin để kiểm tra và nhận Token Key + User ID.
    2. Cập nhật cvat_token, cvat_user_id, cvat_username vào PostgreSQL.
    3. Mật khẩu không bao giờ được lưu trữ vào DB hoặc file log.
    """
    try:
        auth_data = await cvat_client.login_with_credentials(
            username=req.username,
            password=req.password
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"❌ Lỗi khi xác thực đăng nhập CVAT: {exc}")
        raise HTTPException(status_code=400, detail=f"Không thể kết nối hoặc xác thực với máy chủ CVAT: {exc}")

    user_db = await db.get(User, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

    # Kiểm tra xem tài khoản CVAT này đã được liên kết với User khác trong hệ thống chưa (Đảm bảo quan hệ 1-1)
    target_cvat_user_id = auth_data["user_id"]
    existing_cvat_res = await db.execute(
        select(User).where(
            User.cvat_user_id == target_cvat_user_id,
            User.id != current_user.id
        )
    )
    duplicate_user = existing_cvat_res.scalar_one_or_none()
    if duplicate_user:
        raise HTTPException(
            status_code=400,
            detail=f"Tài khoản CVAT '@{auth_data['username']}' (ID: #{target_cvat_user_id}) đã được liên kết với một tài khoản GreenSM khác trong hệ thống. Mỗi tài khoản CVAT chỉ được liên kết duy nhất với một tài khoản."
        )

    user_db.cvat_token = auth_data.get("token_with_prefix", auth_data["token"])
    user_db.cvat_user_id = auth_data["user_id"]
    user_db.cvat_username = auth_data["username"]
    user_db.cvat_email = auth_data.get("email")
    user_db.cvat_first_name = auth_data.get("first_name")
    user_db.cvat_last_name = auth_data.get("last_name")
    groups = auth_data.get("groups", [])
    user_db.cvat_groups = ",".join(groups) if isinstance(groups, list) else str(groups or "")
    user_db.cvat_is_staff = bool(auth_data.get("is_staff", False))
    user_db.is_first_login = False

    await db.commit()
    await db.refresh(user_db)

    logger.info(f"✅ Người dùng {user_db.email} đã liên kết thành công với tài khoản CVAT: {user_db.cvat_username} (#{user_db.cvat_user_id})")

    return ApiResponse(
        message=f"Liên kết thành công với tài khoản CVAT: {user_db.cvat_username} (#{user_db.cvat_user_id})",
        data=CvatTokenResponse(
            cvat_user_id=user_db.cvat_user_id,
            cvat_username=user_db.cvat_username,
            cvat_email=user_db.cvat_email,
            cvat_first_name=user_db.cvat_first_name,
            cvat_last_name=user_db.cvat_last_name,
            cvat_groups=auth_data.get("groups", []),
            cvat_is_staff=user_db.cvat_is_staff,
            cvat_is_superuser=auth_data.get("is_superuser", False),
            cvat_date_joined=auth_data.get("date_joined"),
            cvat_last_login=auth_data.get("last_login"),
            message="Liên kết tài khoản CVAT thành công"
        )
    )

@router.put("/me/cvat-token", response_model=ApiResponse[CvatTokenResponse])
async def update_my_cvat_token(
    req: CvatTokenUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cài đặt và kiểm tra sống token CVAT cá nhân, tự động lưu thông tin user CVAT."""
    try:
        cvat_info = await cvat_client.verify_user_token(req.cvat_token)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"❌ Lỗi ngoại lệ khi kiểm tra token CVAT: {exc}")
        raise HTTPException(status_code=400, detail=f"Không thể kết nối hoặc xác thực với máy chủ CVAT: {exc}")

    user_db = await db.get(User, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

    # Kiểm tra xem tài khoản CVAT này đã được liên kết với User khác trong hệ thống chưa (Đảm bảo quan hệ 1-1)
    target_cvat_user_id = cvat_info["id"]
    existing_cvat_res = await db.execute(
        select(User).where(
            User.cvat_user_id == target_cvat_user_id,
            User.id != current_user.id
        )
    )
    duplicate_user = existing_cvat_res.scalar_one_or_none()
    if duplicate_user:
        raise HTTPException(
            status_code=400,
            detail=f"Tài khoản CVAT '@{cvat_info['username']}' (ID: #{target_cvat_user_id}) đã được liên kết với một tài khoản GreenSM khác trong hệ thống. Mỗi tài khoản CVAT chỉ được liên kết duy nhất với một tài khoản."
        )

    user_db.cvat_token = cvat_info.get("token_with_prefix", req.cvat_token.strip())
    user_db.cvat_user_id = cvat_info["id"]
    user_db.cvat_username = cvat_info["username"]
    user_db.cvat_email = cvat_info.get("email")
    user_db.cvat_first_name = cvat_info.get("first_name")
    user_db.cvat_last_name = cvat_info.get("last_name")
    groups = cvat_info.get("groups", [])
    user_db.cvat_groups = ",".join(groups) if isinstance(groups, list) else str(groups or "")
    user_db.cvat_is_staff = bool(cvat_info.get("is_staff", False))
    user_db.is_first_login = False

    is_rotation = (user_db.cvat_user_id == target_cvat_user_id)
    action_message = (
        f"Đã cập nhật mã Token mới thành công cho tài khoản CVAT: @{user_db.cvat_username} (#{user_db.cvat_user_id})"
        if is_rotation
        else f"Liên kết tài khoản CVAT thành công: @{user_db.cvat_username} (#{user_db.cvat_user_id})"
    )

    await db.commit()
    await db.refresh(user_db)

    return ApiResponse(
        message=action_message,
        data=CvatTokenResponse(
            cvat_user_id=user_db.cvat_user_id,
            cvat_username=user_db.cvat_username,
            cvat_email=user_db.cvat_email,
            cvat_first_name=user_db.cvat_first_name,
            cvat_last_name=user_db.cvat_last_name,
            cvat_groups=cvat_info.get("groups", []),
            cvat_is_staff=user_db.cvat_is_staff,
            cvat_is_superuser=cvat_info.get("is_superuser", False),
            cvat_date_joined=cvat_info.get("date_joined"),
            cvat_last_login=cvat_info.get("last_login"),
            message=action_message
        )
    )

@router.post("/me/cvat-token/check", response_model=ApiResponse[CvatTokenCheckResponse])
async def check_cvat_token(
    req: CvatTokenUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Kiểm tra tính hợp lệ của token CVAT và xác minh tài khoản đích mà không lưu vào DB.
    
    Phục vụ cho trường hợp người dùng tạo nhiều token: kiểm tra xem token mới có cùng trỏ về 
    tài khoản CVAT hiện tại không, hoặc có bị trùng với tài khoản người dùng khác không.
    """
    try:
        cvat_info = await cvat_client.verify_user_token(req.cvat_token)
    except ValueError as exc:
        return ApiResponse(
            message=str(exc),
            data=CvatTokenCheckResponse(
                valid=False,
                cvat_user_id=0,
                cvat_username="",
                message=str(exc)
            )
        )
    except Exception as exc:
        return ApiResponse(
            message=f"Lỗi kết nối tới máy chủ CVAT: {exc}",
            data=CvatTokenCheckResponse(
                valid=False,
                cvat_user_id=0,
                cvat_username="",
                message=f"Lỗi kết nối tới máy chủ CVAT: {exc}"
            )
        )

    target_cvat_user_id = cvat_info["id"]
    is_same_account = bool(current_user.cvat_user_id == target_cvat_user_id)

    # Kiểm tra xem tài khoản CVAT này đã bị liên kết bởi User GreenSM khác chưa
    existing_cvat_res = await db.execute(
        select(User).where(
            User.cvat_user_id == target_cvat_user_id,
            User.id != current_user.id
        )
    )
    duplicate_user = existing_cvat_res.scalar_one_or_none()
    is_linked_to_other = bool(duplicate_user is not None)
    linked_by_email = duplicate_user.email if duplicate_user else None

    if is_linked_to_other:
        status_msg = f"Tài khoản CVAT '@{cvat_info['username']}' (#{target_cvat_user_id}) đã bị liên kết bởi tài khoản GreenSM khác ({linked_by_email})."
    elif is_same_account:
        status_msg = f"Token hợp lệ! Đây là mã Token mới của chính tài khoản CVAT hiện tại (@{cvat_info['username']} #{target_cvat_user_id})."
    else:
        status_msg = f"Token hợp lệ! Đại diện cho tài khoản CVAT mới: @{cvat_info['username']} (#{target_cvat_user_id})."

    return ApiResponse(
        message=status_msg,
        data=CvatTokenCheckResponse(
            valid=True,
            cvat_user_id=target_cvat_user_id,
            cvat_username=cvat_info["username"],
            cvat_email=cvat_info.get("email"),
            cvat_first_name=cvat_info.get("first_name"),
            cvat_last_name=cvat_info.get("last_name"),
            is_same_account=is_same_account,
            is_linked_to_other=is_linked_to_other,
            linked_by_email=linked_by_email,
            message=status_msg
        )
    )

@router.post("/me/cvat-token/ping", response_model=ApiResponse[CvatTokenPingResponse])
async def ping_my_cvat_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Kiểm tra tình trạng sống của mã Token CVAT hiện đang lưu trong tài khoản cá nhân."""
    user_db = await db.get(User, current_user.id)
    if not user_db or not user_db.cvat_token:
        return ApiResponse(
            message="Chưa có mã Token CVAT nào được lưu trong hồ sơ cá nhân",
            data=CvatTokenPingResponse(
                active=False,
                message="Chưa có mã Token CVAT nào được lưu trong hồ sơ cá nhân"
            )
        )

    import time
    start = time.perf_counter()
    try:
        live_profile = await cvat_client.verify_user_token(user_db.cvat_token)
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ApiResponse(
            message=f"Mã Token CVAT đang hoạt động tốt ({latency}ms)",
            data=CvatTokenPingResponse(
                active=True,
                cvat_user_id=live_profile["id"],
                cvat_username=live_profile["username"],
                latency_ms=latency,
                message=f"Mã Token của tài khoản @{live_profile['username']} (#{live_profile['id']}) đang hoạt động tốt"
            )
        )
    except Exception as e:
        latency = round((time.perf_counter() - start) * 1000, 2)
        return ApiResponse(
            message=f"Token CVAT không còn khả dụng hoặc đã bị thu hồi: {e}",
            data=CvatTokenPingResponse(
                active=False,
                cvat_user_id=user_db.cvat_user_id,
                cvat_username=user_db.cvat_username,
                latency_ms=latency,
                message=f"Token đã bị thu hồi hoặc hết hạn trên máy chủ CVAT ({e})"
            )
        )

@router.get("/me/first-login-status", response_model=ApiResponse[FirstLoginStatusResponse])
async def get_first_login_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Kiểm tra xem người dùng hiện tại có phải đăng nhập lần đầu tiên hay không.
    
    Phục vụ cho Frontend quyết định có hiển thị Modal Onboarding kết nối CVAT hay không.
    """
    user_db = await db.get(User, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

    is_first = bool(user_db.is_first_login) if user_db.is_first_login is not None else False
    has_cvat = bool(user_db.cvat_user_id is not None)
    
    # Cần onboarding nếu là lần đầu đăng nhập VÀ chưa liên kết CVAT
    requires_onboarding = is_first and not has_cvat
    groups_list = [g.strip() for g in user_db.cvat_groups.split(",") if g.strip()] if user_db.cvat_groups else []

    return ApiResponse(
        message="Lấy trạng thái đăng nhập đầu tiên thành công",
        data=FirstLoginStatusResponse(
            is_first_login=is_first,
            cvat_connected=has_cvat,
            cvat_user_id=user_db.cvat_user_id,
            cvat_username=user_db.cvat_username,
            cvat_email=user_db.cvat_email,
            cvat_first_name=user_db.cvat_first_name,
            cvat_last_name=user_db.cvat_last_name,
            cvat_groups=groups_list,
            cvat_is_staff=bool(user_db.cvat_is_staff),
            requires_onboarding=requires_onboarding
        )
    )

@router.get("/me/cvat-profile", response_model=ApiResponse[CvatDetailedProfileResponse])
async def get_my_cvat_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Lấy thông tin chi tiết và kiểm tra realtime trạng thái tài khoản CVAT của người dùng."""
    user_db = await db.get(User, current_user.id)
    if not user_db or not user_db.cvat_user_id:
        return ApiResponse(
            message="Chưa liên kết tài khoản CVAT",
            data=CvatDetailedProfileResponse(
                connected=False,
                cvat_url=settings.CVAT_BASE_URL
            )
        )

    # Thử gọi realtime tra cứu từ máy chủ CVAT nếu có token
    if user_db.cvat_token:
        try:
            live_profile = await cvat_client.verify_user_token(user_db.cvat_token)
            return ApiResponse(
                message="Lấy thông tin CVAT thời gian thực thành công",
                data=CvatDetailedProfileResponse(
                    connected=True,
                    cvat_user_id=live_profile["id"],
                    cvat_username=live_profile["username"],
                    cvat_email=live_profile.get("email"),
                    cvat_first_name=live_profile.get("first_name"),
                    cvat_last_name=live_profile.get("last_name"),
                    cvat_groups=live_profile.get("groups", []),
                    cvat_is_staff=bool(live_profile.get("is_staff", False)),
                    cvat_is_superuser=bool(live_profile.get("is_superuser", False)),
                    cvat_is_active=bool(live_profile.get("is_active", True)),
                    cvat_date_joined=live_profile.get("date_joined"),
                    cvat_last_login=live_profile.get("last_login"),
                    cvat_url=settings.CVAT_BASE_URL
                )
            )
        except Exception as e:
            logger.warning(f"⚠️ Không thể gọi realtime CVAT profile, sử dụng metadata lưu trong DB: {e}")

    # Fallback dữ liệu đã lưu trong CSDL
    groups_list = [g.strip() for g in user_db.cvat_groups.split(",") if g.strip()] if user_db.cvat_groups else []
    return ApiResponse(
        message="Lấy thông tin CVAT từ CSDL thành công",
        data=CvatDetailedProfileResponse(
            connected=True,
            cvat_user_id=user_db.cvat_user_id,
            cvat_username=user_db.cvat_username,
            cvat_email=user_db.cvat_email,
            cvat_first_name=user_db.cvat_first_name,
            cvat_last_name=user_db.cvat_last_name,
            cvat_groups=groups_list,
            cvat_is_staff=bool(user_db.cvat_is_staff),
            cvat_is_superuser=False,
            cvat_is_active=True,
            cvat_url=settings.CVAT_BASE_URL
        )
    )

@router.post("/me/complete-onboarding", response_model=ApiResponse[UserProfile])
async def complete_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Đánh dấu hoàn thành (hoặc bỏ qua) quá trình Onboarding lần đầu của người dùng."""
    user_db = await db.get(User, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

    user_db.is_first_login = False
    await db.commit()
    await db.refresh(user_db)

    logger.info(f"✅ Người dùng {user_db.email} đã hoàn tất Onboarding (is_first_login = False).")
    return ApiResponse(
        message="Đã hoàn tất quá trình thiết lập ban đầu thành công",
        data=_build_user_profile(user_db)
    )

@router.delete("/me/cvat-token", response_model=ApiResponse[dict])
async def remove_my_cvat_token(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Hủy liên kết tài khoản CVAT Host khỏi hồ sơ cá nhân."""
    user_db = await db.get(User, current_user.id)
    if not user_db:
        raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản người dùng.")

    user_db.cvat_token = None
    user_db.cvat_user_id = None
    user_db.cvat_username = None
    user_db.cvat_email = None
    user_db.cvat_first_name = None
    user_db.cvat_last_name = None
    user_db.cvat_groups = None
    user_db.cvat_is_staff = False

    await db.commit()
    return ApiResponse(
        message="Đã hủy liên kết tài khoản CVAT thành công",
        data={"success": True}
    )

@router.get("/me/sessions", response_model=ApiResponse[list[SessionResponse]])
async def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    sessions = await AuthService.get_user_sessions(db, current_user.id)
    data = [
        SessionResponse(
            id=str(s.id),
            ip_address=s.ip_address,
            user_agent=s.user_agent,
            is_current=False,
            created_at=s.created_at,
            expires_at=s.expires_at
        ) for s in sessions
    ]
    return ApiResponse(message="Lấy danh sách phiên đăng nhập thành công", data=data)

@router.delete("/me/sessions/{session_id}", response_model=ApiResponse[dict])
async def revoke_my_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    await AuthService.revoke_session_by_id(db, current_user.id, session_id)
    return ApiResponse(message="Đã thu hồi phiên đăng nhập thành công", data={"success": True})

# ============================================================
# 3. Quản trị Người dùng (User Directory & Admin Controls)
# ============================================================

@router.get("/users", response_model=ApiResponse[UserPaginationResponse])
async def list_users(
    search: Optional[str] = Query(None, description="Tìm theo email, họ tên hoặc title"),
    is_active: Optional[bool] = Query(None, description="Lọc theo trạng thái tài khoản"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    users, total = await AuthService.list_users(db, search=search, is_active=is_active, skip=skip, limit=limit)
    items = [
        UserListItem(
            id=str(u.id),
            email=u.email,
            full_name=u.full_name,
            avatar_url=u.avatar_url,
            title=u.title,
            is_admin=u.is_admin,
            is_active=u.is_active,
            cvat_user_id=u.cvat_user_id,
            cvat_username=u.cvat_username,
            total_annotated=u.total_annotated,
            accuracy_rate=u.accuracy_rate,
            last_login_at=u.last_login_at,
            created_at=u.created_at
        ) for u in users
    ]
    return ApiResponse(
        message="Lấy danh sách người dùng thành công",
        data=UserPaginationResponse(items=items, total=total, skip=skip, limit=limit)
    )

@router.get("/users/{user_id}", response_model=ApiResponse[UserProfile])
async def get_user_detail(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng.")
    return ApiResponse(message="Lấy thông tin người dùng thành công", data=_build_user_profile(user))

@router.patch("/users/{user_id}/status", response_model=ApiResponse[UserProfile])
async def toggle_user_status(
    user_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    user = await AuthService.toggle_user_status(db, user_id, current_admin)
    status_str = "kích hoạt" if user.is_active else "khóa"
    return ApiResponse(
        message=f"Đã {status_str} tài khoản người dùng thành công",
        data=_build_user_profile(user)
    )

@router.patch("/users/{user_id}/admin", response_model=ApiResponse[UserProfile])
async def toggle_user_admin(
    user_id: uuid.UUID,
    current_admin: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    user = await AuthService.toggle_user_admin(db, user_id, current_admin)
    role_str = "Quản trị viên (Admin)" if user.is_admin else "Thành viên (Member)"
    return ApiResponse(
        message=f"Đã cập nhật quyền thành: {role_str}",
        data=_build_user_profile(user)
    )

# ============================================================
# 4. Realtime WebSocket
# ============================================================

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    try:
        import jwt
        from app.core.config import settings
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008)
            return
    except Exception:
        await websocket.close(code=1008)
        return

    await ws_manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, user_id)
