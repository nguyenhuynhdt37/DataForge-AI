from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Mật khẩu tối thiểu 8 ký tự")
    full_name: str = Field(..., min_length=2, max_length=100)
    title: Optional[str] = "Thành viên MLOps"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None

class ResendOtpRequest(BaseModel):
    email: EmailStr

class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., description="Refresh token để cấp mới access token")

class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    title: Optional[str] = None
    total_annotated: Optional[int] = 0
    accuracy_rate: Optional[float] = 0.0
    is_admin: Optional[bool] = False
    is_active: Optional[bool] = True
    cvat_user_id: Optional[int] = None
    cvat_username: Optional[str] = None
    cvat_email: Optional[str] = None
    cvat_first_name: Optional[str] = None
    cvat_last_name: Optional[str] = None
    cvat_groups: Optional[List[str]] = []
    cvat_is_staff: Optional[bool] = False
    is_first_login: Optional[bool] = True
    last_login_at: Optional[datetime] = None

class TokenData(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 1800
    requires_otp: bool = False
    message: str = "Đăng nhập thành công"
    user: Optional[UserProfile] = None

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    title: Optional[str] = Field(None, max_length=100)

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, description="Mật khẩu mới tối thiểu 8 ký tự")

class SessionResponse(BaseModel):
    id: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    is_current: bool
    created_at: datetime
    expires_at: datetime

class UserListItem(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str]
    title: Optional[str]
    is_admin: bool
    is_active: bool
    cvat_user_id: Optional[int] = None
    cvat_username: Optional[str] = None
    is_first_login: bool = True
    total_annotated: int
    accuracy_rate: float
    last_login_at: Optional[datetime] = None
    created_at: datetime

class UserPaginationResponse(BaseModel):
    items: List[UserListItem]
    total: int
    skip: int
    limit: int

class CvatTokenUpdateRequest(BaseModel):
    cvat_token: str = Field(..., min_length=10, description="Personal Access Token từ CVAT host")

class CvatTokenResponse(BaseModel):
    cvat_user_id: int
    cvat_username: str
    cvat_email: Optional[str] = None
    cvat_first_name: Optional[str] = None
    cvat_last_name: Optional[str] = None
    cvat_groups: Optional[List[str]] = []
    cvat_is_staff: Optional[bool] = False
    cvat_is_superuser: Optional[bool] = False
    cvat_date_joined: Optional[str] = None
    cvat_last_login: Optional[str] = None
    message: str = "Liên kết tài khoản CVAT thành công"

class CvatCredentialsLoginRequest(BaseModel):
    username: str = Field(..., min_length=1, description="Tên tài khoản trên CVAT (cvat.itup.io.vn)")
    password: str = Field(..., min_length=1, description="Mật khẩu tài khoản trên CVAT")

class FirstLoginStatusResponse(BaseModel):
    is_first_login: bool = Field(..., description="Cờ xác định người dùng có phải đăng nhập lần đầu tiên hay không")
    cvat_connected: bool = Field(..., description="Đã liên kết tài khoản CVAT Host hay chưa")
    cvat_user_id: Optional[int] = Field(None, description="ID của người dùng trên CVAT nếu đã kết nối")
    cvat_username: Optional[str] = Field(None, description="Tên tài khoản CVAT nếu đã kết nối")
    cvat_email: Optional[str] = Field(None, description="Email tài khoản CVAT nếu đã kết nối")
    cvat_first_name: Optional[str] = Field(None, description="Tên trên CVAT")
    cvat_last_name: Optional[str] = Field(None, description="Họ trên CVAT")
    cvat_groups: Optional[List[str]] = Field(default=[], description="Nhóm quyền trên CVAT")
    cvat_is_staff: Optional[bool] = Field(False, description="Là quản trị viên trên CVAT")
    requires_onboarding: bool = Field(..., description="Frontend có nên hiển thị popup onboarding hay không")

class CvatDetailedProfileResponse(BaseModel):
    connected: bool = Field(..., description="Đã liên kết với máy chủ CVAT hay chưa")
    cvat_user_id: Optional[int] = None
    cvat_username: Optional[str] = None
    cvat_email: Optional[str] = None
    cvat_first_name: Optional[str] = None
    cvat_last_name: Optional[str] = None
    cvat_groups: List[str] = []
    cvat_is_staff: bool = False
    cvat_is_superuser: bool = False
    cvat_is_active: bool = True
    cvat_date_joined: Optional[str] = None
    cvat_last_login: Optional[str] = None
    cvat_url: str = "https://cvat.itup.io.vn"

class CvatTokenCheckResponse(BaseModel):
    valid: bool = Field(..., description="Token có hợp lệ trên máy chủ CVAT hay không")
    cvat_user_id: int
    cvat_username: str
    cvat_email: Optional[str] = None
    cvat_first_name: Optional[str] = None
    cvat_last_name: Optional[str] = None
    is_same_account: bool = Field(False, description="Token này thuộc về cùng tài khoản CVAT đang liên kết")
    is_linked_to_other: bool = Field(False, description="Tài khoản CVAT này đã bị liên kết bởi một user khác")
    linked_by_email: Optional[str] = Field(None, description="Email user GreenSM đang giữ liên kết nếu bị trùng")
    message: str

class CvatTokenPingResponse(BaseModel):
    active: bool = Field(..., description="Token hiện tại còn sống trên CVAT hay không")
    cvat_user_id: Optional[int] = None
    cvat_username: Optional[str] = None
    latency_ms: Optional[float] = None
    message: str




