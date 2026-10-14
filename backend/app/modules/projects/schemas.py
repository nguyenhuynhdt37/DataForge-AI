import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.modules.projects.models import (
    ProjectVisibility,
    CampaignType,
    ProjectStatus,
    ProjectRole,
    MemberStatus,
    TaskStatus,
    JobStatus,
    JobRole,
)

# ============================================================
# Project Schemas
# ============================================================

class ProjectCreate(BaseModel):
    id: Optional[str] = Field(None, description="Mã dự án (ví dụ PRJ-GSM-05), tự sinh nếu để trống")
    name: str = Field(..., min_length=2, max_length=255, description="Tên dự án")
    description: Optional[str] = Field(None, description="Mô tả dự án")
    visibility: ProjectVisibility = Field(ProjectVisibility.PUBLIC, description="Chế độ hiển thị: PUBLIC hoặc PRIVATE")
    campaign_type: CampaignType = Field(CampaignType.ACTIVE_LEARNING_V3, description="Loại chiến dịch MLOps")
    total_frames: Optional[int] = Field(0, description="Tổng số frame dự kiến")

class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = None
    visibility: Optional[ProjectVisibility] = None
    campaign_type: Optional[CampaignType] = None
    status: Optional[ProjectStatus] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    title: Optional[str] = None
    description: Optional[str] = None
    visibility: ProjectVisibility
    campaign_type: CampaignType
    status: ProjectStatus
    
    # Các trường mở rộng đồng bộ UI Frontend
    type: str = "Active Learning V3"
    status_color: str = "bg-[#E8F0EA] text-[#4E7756] border-[#D5E4D8]"
    progress: int = 0
    total_frames: str = "0"
    annotated_frames: str = "0"
    annotators: int = 0
    lead: str = "Admin MLOps"
    last_active: str = "Vừa xong"
    tasks_count: int = 0
    created_by_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

# ============================================================
# Member & In-App Invitation Schemas
# ============================================================

class ProjectMemberInvite(BaseModel):
    user_id: uuid.UUID = Field(..., description="ID người dùng được mời")
    role: ProjectRole = Field(ProjectRole.PROJECT_MEMBER, description="Vai trò dự án")

class ProjectMemberResponse(BaseModel):
    id: uuid.UUID
    project_id: str
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    role: ProjectRole
    status: MemberStatus
    joined_at: datetime
    updated_at: Optional[datetime] = None

class InvitationJobItem(BaseModel):
    id: uuid.UUID
    name: str
    image_count: int = 0
    deadline: Optional[datetime] = None
    cvat_url: Optional[str] = None

class InvitationResponse(BaseModel):
    id: uuid.UUID
    project_id: str
    project_name: str
    project_description: Optional[str] = None
    project_visibility: ProjectVisibility
    campaign_type: CampaignType
    role: ProjectRole
    status: MemberStatus
    invited_at: datetime
    invited_by_name: Optional[str] = None
    invited_by_email: Optional[str] = None
    total_frames: int = 0
    tasks_count: int = 0
    jobs_count: int = 0
    jobs: List[InvitationJobItem] = []

# ============================================================
# Task Schemas
# ============================================================

class TaskCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tên Task")
    lead_id: Optional[uuid.UUID] = Field(None, description="Task Lead phụ trách")
    total_sampled_images: Optional[int] = Field(0, description="Số lượng ảnh sampled ban đầu")

class TaskUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    status: Optional[TaskStatus] = None
    lead_id: Optional[uuid.UUID] = None
    total_sampled_images: Optional[int] = None

class TaskResponse(BaseModel):
    id: uuid.UUID
    project_id: str
    name: str
    status: TaskStatus
    lead_id: Optional[uuid.UUID] = None
    lead_name: Optional[str] = None
    total_sampled_images: int = 0
    jobs_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

# ============================================================
# Job Schemas
# ============================================================

class JobCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Tên Job")
    image_count: Optional[int] = Field(0, description="Số frame/ảnh của Job")
    cvat_job_id: Optional[int] = Field(None, description="ID Job trên máy chủ CVAT")
    cvat_url: Optional[str] = Field(None, description="Đường link mở CVAT trực tiếp")
    deadline: Optional[datetime] = Field(None, description="Hạn chót hoàn thành")

class JobUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    status: Optional[JobStatus] = None
    image_count: Optional[int] = None
    cvat_job_id: Optional[int] = None
    cvat_url: Optional[str] = None
    deadline: Optional[datetime] = None

class JobAssignRequest(BaseModel):
    user_id: uuid.UUID = Field(..., description="ID người nhận việc")
    role: JobRole = Field(..., description="Vai trò trên Job: ANNOTATOR hoặc QA_REVIEWER")

class JobMemberInfo(BaseModel):
    user_id: uuid.UUID
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    role: JobRole
    assigned_at: datetime

class JobResponse(BaseModel):
    id: uuid.UUID
    task_id: uuid.UUID
    name: str
    status: JobStatus
    image_count: int = 0
    annotated_frames: int = 0
    cvat_job_id: Optional[int] = None
    cvat_url: Optional[str] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    members: List[JobMemberInfo] = []

# ============================================================
# CVAT Webhook Schema
# ============================================================

class CVATWebhookPayload(BaseModel):
    event: Optional[str] = Field(None, description="Tên sự kiện CVAT (ví dụ update:job)")
    job: Optional[Dict[str, Any]] = Field(None, description="Dữ liệu Job cập nhật")
    before_update: Optional[Dict[str, Any]] = None
