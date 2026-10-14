import uuid
import asyncio
from datetime import datetime, timedelta
import random
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update, func, or_
from fastapi import HTTPException, status
import jwt

from app.core.config import settings
from app.modules.auth.models import User, UserSession
from app.modules.auth.schemas import (
    RegisterRequest, 
    LoginRequest, 
    UpdateProfileRequest, 
    ChangePasswordRequest
)
from app.core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    create_refresh_token
)
from app.core.database import redis_client
from app.core.websocket import ws_manager
from app.core.storage import storage_service
from app.core.email import email_service
from loguru import logger

class AuthService:
    @staticmethod
    async def bootstrap_initial_admin(db: AsyncSession):
        """Khởi tạo tài khoản Quản trị viên mặc định nếu chưa tồn tại."""
        try:
            result = await db.execute(select(User).where(User.email == settings.INITIAL_ADMIN_EMAIL))
            admin_user = result.scalar_one_or_none()
            if not admin_user:
                new_admin = User(
                    email=settings.INITIAL_ADMIN_EMAIL,
                    hashed_password=get_password_hash(settings.INITIAL_ADMIN_PASSWORD),
                    full_name=settings.INITIAL_ADMIN_NAME,
                    title="System Administrator",
                    is_admin=True,
                    is_active=True,
                    accuracy_rate=1.0,
                    total_annotated=0
                )
                db.add(new_admin)
                await db.commit()
                logger.info(f"👑 Đã khởi tạo tài khoản Quản trị viên mặc định: {settings.INITIAL_ADMIN_EMAIL}")
        except Exception as e:
            logger.warning(f"⚠️ Không thể kiểm tra/khởi tạo tài khoản Admin lúc startup: {e}")


    @staticmethod
    async def register_user(db: AsyncSession, req: RegisterRequest) -> User:
        result = await db.execute(select(User).where(User.email == req.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email này đã được đăng ký trong hệ thống."
            )
        
        hashed = get_password_hash(req.password)
        new_user = User(
            email=req.email,
            hashed_password=hashed,
            full_name=req.full_name,
            title=req.title,
            is_admin=False,
            is_active=True,
            accuracy_rate=1.0,
            total_annotated=0
        )
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return new_user

    @staticmethod
    async def check_credentials(
        db: AsyncSession, 
        req: LoginRequest, 
        ip: str = "127.0.0.1", 
        ua: str = "Unknown"
    ) -> Tuple[User, bool]:
        """
        Xác thực thông tin đăng nhập của người dùng.
        Áp dụng cơ chế phòng vệ Brute-force:
        - Nếu tài khoản đang trong trạng thái 2FA Escalation: Bắt buộc yêu cầu OTP 2FA.
        - Nếu nhập sai mật khẩu >= 5 lần (kể cả từ nhiều rotating IP): Tự động kích hoạt 2FA Escalation,
          gửi mã OTP về email ngay lập tức và yêu cầu xác thực OTP (không khóa cứng tài khoản).
        """
        result = await db.execute(select(User).where(User.email == req.email))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Email hoặc mật khẩu không chính xác."
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ Quản trị viên."
            )

        force_otp_key = f"auth:force_otp:{user.id}"
        is_forced_otp = None
        try:
            is_forced_otp = await redis_client.get(force_otp_key)
        except Exception as e:
            logger.warning(f"⚠️ Redis get force_otp gặp sự cố ({e}), tiếp tục quy trình kiểm tra mật khẩu.")

        # 1. Trường hợp tài khoản đang kích hoạt chế độ bảo vệ cưỡng chế 2FA
        if is_forced_otp:
            logger.info(f"🛡️ Tài khoản {user.email} đang bật cờ 2FA Escalation. Yêu cầu nhập mã OTP.")
            cached_otp = None
            try:
                cached_otp = await redis_client.get(f"otp:{user.id}")
            except Exception as e:
                logger.warning(f"⚠️ Redis get cached_otp gặp sự cố: {e}")

            if not cached_otp:
                otp_code = str(random.randint(100000, 999999))
                try:
                    await redis_client.setex(f"otp:{user.id}", 300, otp_code)
                except Exception as e:
                    logger.warning(f"⚠️ Redis setex otp gặp sự cố: {e}")
                asyncio.create_task(
                    email_service.send_otp_email(
                        to_email=user.email,
                        otp_code=otp_code,
                        user_name=user.full_name,
                        ip_address=ip,
                        user_agent=ua
                    )
                )
            return user, True

        # 2. Kiểm tra mật khẩu
        if not verify_password(req.password, user.hashed_password):
            failed_ips_key = f"auth:failed_ips:{user.email}"
            failed_count_key = f"auth:failed_count:{user.email}"

            failed_attempts = 1
            num_ips = 1
            try:
                await redis_client.sadd(failed_ips_key, ip)
                await redis_client.expire(failed_ips_key, 900)

                failed_attempts = await redis_client.incr(failed_count_key)
                await redis_client.expire(failed_count_key, 900)

                num_ips = await redis_client.scard(failed_ips_key)
            except Exception as e:
                logger.warning(f"⚠️ Redis brute-force tracking gặp sự cố: {e}")

            logger.warning(
                f"⚠️ [AUTH BRUTE-FORCE TRACKING] Email '{user.email}' nhập sai {failed_attempts} lần từ {num_ips} IP khác nhau (IP: {ip})"
            )

            # Quyết định 1: Nhập sai mật khẩu >= 5 lần -> Kích hoạt 2FA OTP ngay lập tức
            if failed_attempts >= 5:
                logger.warning(
                    f"🚨 [AUTH 2FA ESCALATION] Email '{user.email}' bị tấn công brute-force ({failed_attempts} lần thử sai). Kích hoạt 2FA ngay!"
                )
                otp_code = str(random.randint(100000, 999999))
                try:
                    await redis_client.setex(force_otp_key, 900, "1")
                    await redis_client.setex(f"otp:{user.id}", 300, otp_code)
                    await redis_client.delete(f"otp_fail:{user.id}")
                except Exception as e:
                    logger.warning(f"⚠️ Redis escalation setup gặp sự cố: {e}")

                asyncio.create_task(
                    email_service.send_otp_email(
                        to_email=user.email,
                        otp_code=otp_code,
                        user_name=user.full_name,
                        ip_address=ip,
                        user_agent=ua
                    )
                )
                return user, True

            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Email hoặc mật khẩu không chính xác."
            )

        # Mật khẩu chính xác -> Dọn dẹp các key theo dõi brute-force cũ nếu có
        try:
            await redis_client.delete(f"auth:failed_count:{user.email}")
            await redis_client.delete(f"auth:failed_ips:{user.email}")
        except Exception as e:
            logger.warning(f"⚠️ Redis delete failed tracking keys gặp sự cố: {e}")
        return user, False

    @staticmethod
    async def verify_device_anomaly(db: AsyncSession, user: User, ip: str, ua: str) -> bool:
        """Kiểm tra xem thiết bị này đã từng truy cập chưa. Nếu chưa -> Gửi OTP & Email."""
        result = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.user_agent == ua,
                UserSession.ip_address == ip,
                UserSession.is_revoked == False
            ).limit(1)
        )
        existing_session = result.scalar_one_or_none()
        
        if not existing_session:
            otp_code = str(random.randint(100000, 999999))
            try:
                await redis_client.setex(f"otp:{user.id}", 300, otp_code)
            except Exception as e:
                logger.warning(f"⚠️ Redis setex anomaly otp gặp sự cố: {e}")
            # Gửi Email OTP bất đồng bộ
            asyncio.create_task(
                email_service.send_otp_email(
                    to_email=user.email,
                    otp_code=otp_code,
                    user_name=user.full_name,
                    ip_address=ip,
                    user_agent=ua
                )
            )
            return True
            
        return False

    @staticmethod
    async def resend_otp(db: AsyncSession, user: User, ip: str, ua: str) -> str:
        """Tạo lại mã OTP mới và gửi lại email cho người dùng."""
        otp_code = str(random.randint(100000, 999999))
        try:
            await redis_client.setex(f"otp:{user.id}", 300, otp_code)
        except Exception as e:
            logger.warning(f"⚠️ Redis setex resend otp gặp sự cố: {e}")
        asyncio.create_task(
            email_service.send_otp_email(
                to_email=user.email,
                otp_code=otp_code,
                user_name=user.full_name,
                ip_address=ip,
                user_agent=ua
            )
        )
        return otp_code

    @staticmethod
    async def finalize_login(db: AsyncSession, user: User, ip: str, ua: str) -> Tuple[str, str, int]:
        # 1. Thu hồi toàn bộ session cũ của User này
        await db.execute(
            update(UserSession)
            .where(UserSession.user_id == user.id, UserSession.is_revoked == False)
            .values(is_revoked=True)
        )
        
        # 2. Cập nhật thời gian đăng nhập gần nhất
        user.last_login_at = datetime.utcnow()

        # 3. Tạo Session mới
        new_jti = str(uuid.uuid4())
        session_id = uuid.uuid4()
        expires = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        new_session = UserSession(
            id=session_id,
            user_id=user.id,
            refresh_token_jti=new_jti,
            user_agent=ua,
            ip_address=ip,
            expires_at=expires
        )
        db.add(new_session)
        await db.commit()

        # 4. Kích hoạt Event WebSocket đá mọi thiết bị cũ ra ngoài
        await ws_manager.broadcast_kickout_across_cluster(str(user.id), str(session_id))

        # 5. Sinh Access Token và Refresh Token kèm JTI
        role_claim = "ADMIN" if user.is_admin else "MEMBER"
        access_token = create_access_token(user.id, role=role_claim)
        
        # Nhúng jti vào refresh token payload
        refresh_token = create_refresh_token(subject=user.id)
        
        max_age = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        return access_token, refresh_token, max_age

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> str:
        """Cấp lại Access Token mới từ Refresh Token hợp lệ."""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phiên làm việc đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại."
        )
        try:
            payload = jwt.decode(
                refresh_token, 
                settings.REFRESH_SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            user_id_str: str = payload.get("sub")
            if not user_id_str:
                raise credentials_exception
            user_id = uuid.UUID(user_id_str)
        except jwt.PyJWTError:
            raise credentials_exception

        # Kiểm tra User
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tài khoản không khả dụng.")

        # Kiểm tra Session còn hiệu lực
        session_res = await db.execute(
            select(UserSession).where(
                UserSession.user_id == user.id,
                UserSession.is_revoked == False,
                UserSession.expires_at > datetime.utcnow()
            ).limit(1)
        )
        valid_session = session_res.scalar_one_or_none()
        if not valid_session:
            raise credentials_exception

        # Refresh Token Rotation: Cập nhật jti mới cho session
        new_jti = str(uuid.uuid4())
        valid_session.refresh_token_jti = new_jti
        await db.commit()

        role_claim = "ADMIN" if user.is_admin else "MEMBER"
        new_access_token = create_access_token(user.id, role=role_claim)
        new_refresh_token = create_refresh_token(subject=user.id)

        return new_access_token, new_refresh_token, user

    @staticmethod
    async def logout_user(db: AsyncSession, user_id: uuid.UUID):
        """Đăng xuất và thu hồi toàn bộ session đang kích hoạt của người dùng."""
        await db.execute(
            update(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_revoked == False)
            .values(is_revoked=True)
        )
        await db.commit()
        await redis_client.delete(f"otp:{user_id}")

    @staticmethod
    async def update_profile(db: AsyncSession, user: User, req: UpdateProfileRequest) -> User:
        if req.full_name is not None:
            user.full_name = req.full_name
        if req.title is not None:
            user.title = req.title
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def upload_user_avatar(db: AsyncSession, user: User, content: bytes, content_type: str) -> str:
        old_avatar = user.avatar_url
        new_url = storage_service.upload_avatar(user.id, content, content_type)
        user.avatar_url = new_url
        await db.commit()
        await db.refresh(user)

        # Xóa file avatar cũ trên MinIO nếu có
        if old_avatar and old_avatar != new_url:
            storage_service.delete_file_by_url(old_avatar)

        return new_url

    @staticmethod
    async def change_password(db: AsyncSession, user: User, req: ChangePasswordRequest):
        if not verify_password(req.old_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Mật khẩu hiện tại không chính xác."
            )
        
        user.hashed_password = get_password_hash(req.new_password)
        
        # Thu hồi toàn bộ session cũ để ép các thiết bị khác đăng nhập lại
        await db.execute(
            update(UserSession)
            .where(UserSession.user_id == user.id, UserSession.is_revoked == False)
            .values(is_revoked=True)
        )
        await db.commit()
        await ws_manager.broadcast_kickout_across_cluster(str(user.id), "password_changed")

    @staticmethod
    async def get_user_sessions(db: AsyncSession, user_id: uuid.UUID) -> List[UserSession]:
        result = await db.execute(
            select(UserSession)
            .where(UserSession.user_id == user_id, UserSession.is_revoked == False)
            .order_by(UserSession.created_at.desc())
        )
        return list(result.scalars().all())

    @staticmethod
    async def revoke_session_by_id(db: AsyncSession, user_id: uuid.UUID, session_id: uuid.UUID):
        result = await db.execute(
            select(UserSession).where(
                UserSession.id == session_id,
                UserSession.user_id == user_id
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiên đăng nhập.")
        
        session.is_revoked = True
        await db.commit()

    @staticmethod
    async def list_users(
        db: AsyncSession, 
        search: Optional[str] = None, 
        is_active: Optional[bool] = None,
        skip: int = 0, 
        limit: int = 50
    ) -> Tuple[List[User], int]:
        query = select(User)
        count_query = select(func.count(User.id))

        if search:
            search_pattern = f"%{search.strip()}%"
            filter_cond = or_(
                User.email.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
                User.title.ilike(search_pattern)
            )
            query = query.where(filter_cond)
            count_query = count_query.where(filter_cond)

        if is_active is not None:
            query = query.where(User.is_active == is_active)
            count_query = count_query.where(User.is_active == is_active)

        total_res = await db.execute(count_query)
        total = total_res.scalar() or 0

        users_res = await db.execute(
            query.order_by(User.created_at.desc()).offset(skip).limit(limit)
        )
        users = list(users_res.scalars().all())
        return users, total

    @staticmethod
    async def toggle_user_status(db: AsyncSession, target_user_id: uuid.UUID, current_admin: User) -> User:
        if target_user_id == current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn không thể tự khóa tài khoản quản trị của chính mình."
            )
        result = await db.execute(select(User).where(User.id == target_user_id))
        target_user = result.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng.")

        target_user.is_active = not target_user.is_active
        if not target_user.is_active:
            # Nếu khóa thì thu hồi toàn bộ session và đá ra khỏi hệ thống ngay lập tức
            await db.execute(
                update(UserSession)
                .where(UserSession.user_id == target_user.id, UserSession.is_revoked == False)
                .values(is_revoked=True)
            )
            await ws_manager.broadcast_kickout_across_cluster(str(target_user.id), "account_locked")

        await db.commit()
        await db.refresh(target_user)
        return target_user

    @staticmethod
    async def toggle_user_admin(db: AsyncSession, target_user_id: uuid.UUID, current_admin: User) -> User:
        if target_user_id == current_admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bạn không thể tự hạ quyền quản trị của chính mình."
            )
        result = await db.execute(select(User).where(User.id == target_user_id))
        target_user = result.scalar_one_or_none()
        if not target_user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người dùng.")

        target_user.is_admin = not target_user.is_admin
        await db.commit()
        await db.refresh(target_user)
        return target_user
