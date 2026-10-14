import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from loguru import logger

from app.core.database import get_db
from app.core.config import settings
from app.core.cvat_client import cvat_client
from app.core.websocket import ws_manager
from app.shared.schemas import ApiResponse
from app.modules.projects.models import (
    Project,
    ProjectMember,
    Task,
    Job,
    JobMember,
    ProjectVisibility,
    CampaignType,
    ProjectStatus,
    ProjectRole,
    MemberStatus,
    TaskStatus,
    JobStatus,
    JobRole,
)
from app.modules.projects.schemas import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectMemberInvite,
    ProjectMemberResponse,
    InvitationJobItem,
    InvitationResponse,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    JobCreate,
    JobUpdate,
    JobAssignRequest,
    JobResponse,
    JobMemberInfo,
    CVATWebhookPayload,
)
from app.modules.auth.dependencies import get_current_user
from app.modules.auth.models import User

router = APIRouter(prefix="/projects", tags=["Projects Management"])
integrations_router = APIRouter(prefix="/integrations", tags=["External Integrations"])

# ============================================================
# Helpers: Format & Permission Checks
# ============================================================

def _map_campaign_type_label(c_type: CampaignType) -> str:
    mapping = {
        CampaignType.ACTIVE_LEARNING_V3: "Active Learning V3",
        CampaignType.HARD_SLICE_CURATION: "Hard Slice Curation",
        CampaignType.EDGE_BENCHMARK: "Edge INT8 Benchmark",
        CampaignType.ZERO_SHOT_DISCOVERY: "Zero-Shot Discovery",
    }
    return mapping.get(c_type, "Active Learning V3")

def _map_status_color(p_status: ProjectStatus) -> str:
    mapping = {
        ProjectStatus.INITIALIZING: "bg-[#FAF2E8] text-[#8C6239] border-[#EEDFCD]",
        ProjectStatus.ANNOTATING: "bg-[#E8F0EA] text-[#4E7756] border-[#D5E4D8]",
        ProjectStatus.UNDER_QA: "bg-[#E6F0F7] text-[#3D6B8C] border-[#D0E2EE]",
        ProjectStatus.TRAINING: "bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]",
        ProjectStatus.COMPLETED: "bg-[#EFEBF5] text-[#5C4D78] border-[#DFD8EB]",
        ProjectStatus.ARCHIVED: "bg-gray-100 text-gray-600 border-gray-200",
    }
    return mapping.get(p_status, "bg-[#E8F0EA] text-[#4E7756] border-[#D5E4D8]")

def _build_project_response(project: Project) -> ProjectResponse:
    # Xác định Project Lead để hiển thị
    lead_name = "Admin MLOps"
    for m in project.members:
        if m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE and m.user:
            lead_name = m.user.full_name
            break

    # Tính toán tiến độ dựa trên số frame
    progress_val = 0
    if project.total_frames > 0:
        progress_val = min(100, int((project.annotated_frames / project.total_frames) * 100))

    active_members_count = sum(1 for m in project.members if m.status == MemberStatus.ACTIVE)

    return ProjectResponse(
        id=project.id,
        name=project.name,
        title=project.name,
        description=project.description or "",
        visibility=project.visibility,
        campaign_type=project.campaign_type,
        status=project.status,
        type=_map_campaign_type_label(project.campaign_type),
        status_color=_map_status_color(project.status),
        progress=progress_val,
        total_frames=f"{project.total_frames:,}",
        annotated_frames=f"{project.annotated_frames:,}",
        annotators=max(1, active_members_count),
        lead=lead_name,
        last_active="Vừa xong",
        tasks_count=len(project.tasks),
        created_by_id=str(project.created_by_id) if project.created_by_id else None,
        created_at=project.created_at,
        updated_at=project.updated_at,
    )

async def _get_project_with_access_check(
    db: AsyncSession,
    project_id: str,
    user: User,
    require_lead: bool = False
) -> Project:
    stmt = (
        select(Project)
        .options(
            selectinload(Project.members).selectinload(ProjectMember.user),
            selectinload(Project.tasks).selectinload(Task.jobs).selectinload(Job.job_members),
            selectinload(Project.created_by)
        )
        .where(Project.id == project_id)
    )
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Không tìm thấy dự án.")

    # Kiểm tra quyền Lead / Admin
    is_admin = bool(user.is_admin)
    is_creator = project.created_by_id == user.id
    is_lead_member = any(
        m.user_id == user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    )

    if require_lead:
        if not (is_admin or is_creator or is_lead_member):
            raise HTTPException(
                status_code=403, 
                detail="Bạn không có quyền quản trị (Project Lead) trên dự án này."
            )
        return project

    # Kiểm tra quyền xem thông thường:
    # Nếu PRIVATE: Tối mật, tàng hình hoàn toàn với người ngoài -> Trả về 404 để không lộ thông tin
    if project.visibility == ProjectVisibility.PRIVATE:
        is_member = any(
            m.user_id == user.id and m.status in [MemberStatus.ACTIVE, MemberStatus.PENDING_ACCEPTANCE]
            for m in project.members
        )
        if not (is_admin or is_creator or is_lead_member or is_member):
            raise HTTPException(status_code=404, detail="Không tìm thấy dự án.")

    return project

# ============================================================
# Seed Projects Mẫu
# ============================================================

DEFAULT_SEED_PROJECTS = [
    {
        "id": "PRJ-GSM-01",
        "name": "GreenSM Vehicle Detection",
        "description": "Chiến dịch nhận diện và phân loại phương tiện ô tô điện GreenSM",
        "visibility": ProjectVisibility.PUBLIC,
        "campaign_type": CampaignType.ACTIVE_LEARNING_V3,
        "status": ProjectStatus.ANNOTATING,
        "total_frames": 45200,
        "annotated_frames": 30736,
    },
    {
        "id": "PRJ-GSM-02",
        "name": "Pedestrian Trajectory & Safety",
        "description": "Giám định quỹ đạo người đi bộ và biển báo an toàn đô thị",
        "visibility": ProjectVisibility.PUBLIC,
        "campaign_type": CampaignType.HARD_SLICE_CURATION,
        "status": ProjectStatus.UNDER_QA,
        "total_frames": 28100,
        "annotated_frames": 23604,
    },
    {
        "id": "PRJ-GSM-03",
        "name": "Traffic Signs & Signals Realtime",
        "description": "Đo lường độ trễ và độ chính xác nhận diện biển báo trên thiết bị biên",
        "visibility": ProjectVisibility.PUBLIC,
        "campaign_type": CampaignType.EDGE_BENCHMARK,
        "status": ProjectStatus.COMPLETED,
        "total_frames": 18400,
        "annotated_frames": 18400,
    },
    {
        "id": "PRJ-GSM-04",
        "name": "Weather Anomaly (Rain & Night Fog)",
        "description": "Khai phá ca khó trong điều kiện mưa đêm và chói sáng đèn pha",
        "visibility": ProjectVisibility.PRIVATE,
        "campaign_type": CampaignType.ZERO_SHOT_DISCOVERY,
        "status": ProjectStatus.INITIALIZING,
        "total_frames": 12000,
        "annotated_frames": 3000,
    }
]

# ============================================================
# 1. Project Management APIs
# ============================================================

@router.get("", response_model=ApiResponse[List[ProjectResponse]])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các dự án MLOps.
    
    Quy tắc Tàng hình Dự án PRIVATE:
    - User Admin: Thấy toàn bộ dự án.
    - User thường: Chỉ thấy dự án PUBLIC HOẶC dự án PRIVATE mà mình là creator / thành viên (ACTIVE hoặc PENDING_ACCEPTANCE).
    """
    stmt = (
        select(Project)
        .options(
            selectinload(Project.members).selectinload(ProjectMember.user),
            selectinload(Project.tasks).selectinload(Task.jobs).selectinload(Job.job_members),
            selectinload(Project.created_by)
        )
    )
    res = await db.execute(stmt)
    projects = res.scalars().all()

    if not projects:
        # Seed 4 dự án ban đầu nếu chưa có
        for p_data in DEFAULT_SEED_PROJECTS:
            new_p = Project(
                id=p_data["id"],
                name=p_data["name"],
                description=p_data["description"],
                visibility=p_data["visibility"],
                campaign_type=p_data["campaign_type"],
                status=p_data["status"],
                total_frames=p_data["total_frames"],
                annotated_frames=p_data["annotated_frames"],
                created_by_id=current_user.id
            )
            # Tự động gán user hiện tại làm Lead cho project mẫu
            member = ProjectMember(
                project_id=p_data["id"],
                user_id=current_user.id,
                role=ProjectRole.PROJECT_LEAD,
                status=MemberStatus.ACTIVE
            )
            new_p.members.append(member)
            db.add(new_p)

        await db.commit()
        res = await db.execute(stmt)
        projects = res.scalars().all()

    # Lọc dự án theo quyền truy cập và chế độ Visibility
    visible_projects: List[ProjectResponse] = []
    is_admin = bool(current_user.is_admin)

    for p in projects:
        if is_admin:
            visible_projects.append(_build_project_response(p))
            continue

        if p.visibility == ProjectVisibility.PUBLIC:
            visible_projects.append(_build_project_response(p))
        else:
            # Dự án PRIVATE: Kiểm tra xem user có phải creator hoặc thành viên hợp lệ không
            is_creator = p.created_by_id == current_user.id
            is_member = any(
                m.user_id == current_user.id and m.status in [MemberStatus.ACTIVE, MemberStatus.PENDING_ACCEPTANCE]
                for m in p.members
            )
            if is_creator or is_member:
                visible_projects.append(_build_project_response(p))

    return ApiResponse(
        success=True,
        message=f"Lấy danh sách {len(visible_projects)} dự án thành công",
        data=visible_projects
    )

@router.post("", response_model=ApiResponse[ProjectResponse])
async def create_project(
    payload: ProjectCreate, 
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo mới dự án MLOps. Tự động gán người tạo làm PROJECT_LEAD ở trạng thái ACTIVE."""
    # Tự sinh mã ID nếu chưa có
    project_id = payload.id
    if not project_id:
        res = await db.execute(select(Project))
        existing_count = len(res.scalars().all())
        project_id = f"PRJ-GSM-{existing_count + 1:02d}"

    # Đảm bảo mã dự án duy nhất
    res_check = await db.execute(select(Project).where(Project.id == project_id))
    if res_check.scalar_one_or_none():
        project_id = f"PRJ-GSM-{uuid.uuid4().hex[:4].upper()}"

    new_project = Project(
        id=project_id,
        name=payload.name,
        description=payload.description or "Dự án gán nhãn & tinh tuyển dữ liệu xe điện",
        visibility=payload.visibility,
        campaign_type=payload.campaign_type,
        status=ProjectStatus.INITIALIZING,
        total_frames=payload.total_frames or 0,
        annotated_frames=0,
        created_by_id=current_user.id
    )
    db.add(new_project)

    # Tự động gán người tạo làm PROJECT_LEAD ở trạng thái ACTIVE
    lead_member = ProjectMember(
        project_id=project_id,
        user_id=current_user.id,
        role=ProjectRole.PROJECT_LEAD,
        status=MemberStatus.ACTIVE
    )
    db.add(lead_member)

    await db.commit()

    # Load lại đầy đủ quan hệ để response
    project = await _get_project_with_access_check(db, project_id, current_user)
    return ApiResponse(
        success=True,
        message=f"Tạo mới dự án {project.id} thành công",
        data=_build_project_response(project)
    )

@router.get("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def get_project_detail(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xem chi tiết dự án. Nếu dự án PRIVATE và user không có quyền, trả về HTTP 404 để tàng hình hoàn toàn."""
    project = await _get_project_with_access_check(db, project_id, current_user)
    return ApiResponse(
        success=True,
        message="Lấy thông tin dự án thành công",
        data=_build_project_response(project)
    )

@router.patch("/{project_id}", response_model=ApiResponse[ProjectResponse])
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật thông tin dự án (Chỉ Project Lead hoặc Quản trị viên)."""
    project = await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.visibility is not None:
        project.visibility = payload.visibility
    if payload.campaign_type is not None:
        project.campaign_type = payload.campaign_type
    if payload.status is not None:
        project.status = payload.status

    await db.commit()
    await db.refresh(project)
    return ApiResponse(
        success=True,
        message=f"Cập nhật dự án {project.id} thành công",
        data=_build_project_response(project)
    )

@router.delete("/{project_id}", response_model=ApiResponse[dict])
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa dự án (Chỉ Project Lead hoặc Quản trị viên). Cascade xóa toàn bộ Tasks, Jobs và Member links."""
    project = await _get_project_with_access_check(db, project_id, current_user, require_lead=True)
    await db.delete(project)
    await db.commit()
    return ApiResponse(
        success=True,
        message=f"Đã xóa dự án {project_id} thành công",
        data={"project_id": project_id, "deleted": True}
    )

# ============================================================
# 2. Project Member Pool & In-App Join/Invitation Flow
# ============================================================

@router.post("/{project_id}/join-requests", response_model=ApiResponse[ProjectMemberResponse])
async def request_to_join_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gửi yêu cầu xin gia nhập dự án PUBLIC (Tạo ProjectMember với PENDING_APPROVAL).
    
    Dự án PRIVATE tàng hình hoàn toàn, chặn gửi yêu cầu và trả về 404.
    """
    stmt = select(Project).where(Project.id == project_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()

    if not project or project.visibility == ProjectVisibility.PRIVATE:
        # Dự án riêng tư không tồn tại đối với bên ngoài -> 404
        raise HTTPException(
            status_code=404, 
            detail="Không tìm thấy dự án hoặc dự án ở chế độ riêng tư không nhận yêu cầu xin gia nhập."
        )

    # Kiểm tra trạng thái thành viên hiện tại
    member_stmt = select(ProjectMember).where(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    )
    res_member = await db.execute(member_stmt)
    existing_member = res_member.scalar_one_or_none()

    if existing_member:
        if existing_member.status == MemberStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Bạn đã là thành viên chính thức của dự án.")
        elif existing_member.status == MemberStatus.PENDING_APPROVAL:
            raise HTTPException(status_code=400, detail="Yêu cầu tham gia của bạn đang chờ phê duyệt.")
        elif existing_member.status == MemberStatus.PENDING_ACCEPTANCE:
            raise HTTPException(status_code=400, detail="Bạn đã nhận được lời mời tham gia dự án, vui lòng chấp nhận lời mời.")
        elif existing_member.status in [MemberStatus.REJECTED, MemberStatus.REMOVED]:
            # Cho phép gửi lại yêu cầu
            existing_member.status = MemberStatus.PENDING_APPROVAL
            existing_member.role = ProjectRole.PROJECT_MEMBER
            await db.commit()
            await db.refresh(existing_member)
            return ApiResponse(
                success=True,
                message="Đã gửi lại yêu cầu tham gia dự án thành công",
                data=ProjectMemberResponse(
                    id=existing_member.id,
                    project_id=project_id,
                    user_id=current_user.id,
                    user_name=current_user.full_name,
                    user_email=current_user.email,
                    role=existing_member.role,
                    status=existing_member.status,
                    joined_at=existing_member.joined_at,
                    updated_at=existing_member.updated_at
                )
            )

    new_member = ProjectMember(
        project_id=project_id,
        user_id=current_user.id,
        role=ProjectRole.PROJECT_MEMBER,
        status=MemberStatus.PENDING_APPROVAL
    )
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)

    return ApiResponse(
        success=True,
        message="Đã gửi yêu cầu tham gia dự án thành công. Vui lòng chờ Project Lead phê duyệt.",
        data=ProjectMemberResponse(
            id=new_member.id,
            project_id=project_id,
            user_id=current_user.id,
            user_name=current_user.full_name,
            user_email=current_user.email,
            role=new_member.role,
            status=new_member.status,
            joined_at=new_member.joined_at,
            updated_at=new_member.updated_at
        )
    )

@router.get("/{project_id}/members", response_model=ApiResponse[List[ProjectMemberResponse]])
async def list_project_members(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách thành viên trong dự án."""
    project = await _get_project_with_access_check(db, project_id, current_user)
    
    stmt = (
        select(ProjectMember)
        .options(selectinload(ProjectMember.user))
        .where(ProjectMember.project_id == project_id)
    )
    res = await db.execute(stmt)
    members = res.scalars().all()

    output = [
        ProjectMemberResponse(
            id=m.id,
            project_id=m.project_id,
            user_id=m.user_id,
            user_name=m.user.full_name if m.user else None,
            user_email=m.user.email if m.user else None,
            role=m.role,
            status=m.status,
            joined_at=m.joined_at,
            updated_at=m.updated_at
        ) for m in members
    ]

    return ApiResponse(
        success=True,
        message=f"Lấy danh sách {len(output)} thành viên thành công",
        data=output
    )

@router.post("/{project_id}/members/{member_id}/approve", response_model=ApiResponse[ProjectMemberResponse])
async def approve_member_request(
    project_id: str,
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Project Lead phê duyệt yêu cầu xin tham gia dự án (Chuyển thành ACTIVE)."""
    await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).where(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu tham gia của thành viên.")

    if member.status != MemberStatus.PENDING_APPROVAL:
        raise HTTPException(status_code=400, detail=f"Không thể duyệt thành viên ở trạng thái {member.status.value}.")

    member.status = MemberStatus.ACTIVE
    await db.commit()
    await db.refresh(member)

    return ApiResponse(
        success=True,
        message=f"Đã phê duyệt thành viên {member.user.full_name if member.user else ''} vào dự án",
        data=ProjectMemberResponse(
            id=member.id,
            project_id=member.project_id,
            user_id=member.user_id,
            user_name=member.user.full_name if member.user else None,
            user_email=member.user.email if member.user else None,
            role=member.role,
            status=member.status,
            joined_at=member.joined_at,
            updated_at=member.updated_at
        )
    )

@router.post("/{project_id}/members/{member_id}/reject", response_model=ApiResponse[ProjectMemberResponse])
async def reject_member_request(
    project_id: str,
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Project Lead từ chối yêu cầu xin tham gia dự án (Chuyển thành REJECTED)."""
    await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).where(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu thành viên.")

    member.status = MemberStatus.REJECTED
    await db.commit()
    await db.refresh(member)

    return ApiResponse(
        success=True,
        message="Đã từ chối yêu cầu tham gia dự án",
        data=ProjectMemberResponse(
            id=member.id,
            project_id=member.project_id,
            user_id=member.user_id,
            user_name=member.user.full_name if member.user else None,
            user_email=member.user.email if member.user else None,
            role=member.role,
            status=member.status,
            joined_at=member.joined_at,
            updated_at=member.updated_at
        )
    )

@router.delete("/{project_id}/members/{member_id}", response_model=ApiResponse[ProjectMemberResponse])
async def remove_project_member(
    project_id: str,
    member_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Project Lead loại thành viên ra khỏi dự án (Chuyển thành REMOVED).
    
    Quy tắc an toàn: Không thể tự loại chính mình nếu là Project Lead duy nhất.
    """
    project = await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).where(
        ProjectMember.id == member_id,
        ProjectMember.project_id == project_id
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy thành viên trong dự án.")

    if member.user_id == current_user.id and member.role == ProjectRole.PROJECT_LEAD:
        active_leads = [
            m for m in project.members 
            if m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE and m.id != member_id
        ]
        if not active_leads and not current_user.is_admin:
            raise HTTPException(
                status_code=400, 
                detail="Không thể loại bỏ Project Lead duy nhất của dự án. Vui lòng chỉ định Lead khác trước."
            )

    member.status = MemberStatus.REMOVED
    await db.commit()
    await db.refresh(member)

    return ApiResponse(
        success=True,
        message=f"Đã loại bỏ thành viên {member.user.full_name if member.user else ''} khỏi dự án",
        data=ProjectMemberResponse(
            id=member.id,
            project_id=member.project_id,
            user_id=member.user_id,
            user_name=member.user.full_name if member.user else None,
            user_email=member.user.email if member.user else None,
            role=member.role,
            status=member.status,
            joined_at=member.joined_at,
            updated_at=member.updated_at
        )
    )

@router.post("/{project_id}/invitations", response_model=ApiResponse[ProjectMemberResponse])
async def invite_member_to_project(
    project_id: str,
    payload: ProjectMemberInvite,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Project Lead chủ động mời thành viên vào dự án (Tạo ProjectMember với PENDING_ACCEPTANCE).
    
    Hoạt động cho cả dự án PRIVATE và PUBLIC mà không dùng email.
    """
    await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    # Kiểm tra target user tồn tại
    target_res = await db.execute(select(User).where(User.id == payload.user_id))
    target_user = target_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng được mời.")

    # Kiểm tra membership hiện tại
    stmt = select(ProjectMember).options(selectinload(ProjectMember.user)).where(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == payload.user_id
    )
    res = await db.execute(stmt)
    existing_member = res.scalar_one_or_none()

    if existing_member:
        if existing_member.status == MemberStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Người dùng này đã là thành viên chính thức.")
        elif existing_member.status == MemberStatus.PENDING_ACCEPTANCE:
            raise HTTPException(status_code=400, detail="Lời mời đã được gửi tới người dùng này trước đó.")
        
        # Cập nhật lại lời mời
        existing_member.status = MemberStatus.PENDING_ACCEPTANCE
        existing_member.role = payload.role
        existing_member.invited_by_id = current_user.id
        await db.commit()
        await db.refresh(existing_member)
        return ApiResponse(
            success=True,
            message=f"Đã gửi lại lời mời gia nhập dự án cho {target_user.full_name}",
            data=ProjectMemberResponse(
                id=existing_member.id,
                project_id=project_id,
                user_id=target_user.id,
                user_name=target_user.full_name,
                user_email=target_user.email,
                role=existing_member.role,
                status=existing_member.status,
                joined_at=existing_member.joined_at,
                updated_at=existing_member.updated_at
            )
        )

    new_invite = ProjectMember(
        project_id=project_id,
        user_id=payload.user_id,
        role=payload.role,
        status=MemberStatus.PENDING_ACCEPTANCE,
        invited_by_id=current_user.id
    )
    db.add(new_invite)
    await db.commit()
    await db.refresh(new_invite)

    return ApiResponse(
        success=True,
        message=f"Đã gửi lời mời tham gia dự án cho {target_user.full_name}",
        data=ProjectMemberResponse(
            id=new_invite.id,
            project_id=project_id,
            user_id=target_user.id,
            user_name=target_user.full_name,
            user_email=target_user.email,
            role=new_invite.role,
            status=new_invite.status,
            joined_at=new_invite.joined_at,
            updated_at=new_invite.updated_at
        )
    )

# ============================================================
# In-App Invitation Dashboard
# ============================================================

@router.get("/invitations/me", response_model=ApiResponse[List[InvitationResponse]])
async def get_my_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """In-App Dashboard: Lấy danh sách các lời mời vào dự án đang chờ người dùng phản hồi.
    
    Cung cấp đầy đủ thông tin: ai mời, mô tả dự án, tổng số task, tổng số job, deadline và chi tiết các job.
    """
    stmt = (
        select(ProjectMember)
        .options(
            selectinload(ProjectMember.project)
            .selectinload(Project.tasks)
            .selectinload(Task.jobs),
            selectinload(ProjectMember.invited_by)
        )
        .where(
            ProjectMember.user_id == current_user.id,
            ProjectMember.status == MemberStatus.PENDING_ACCEPTANCE
        )
        .order_by(ProjectMember.joined_at.desc())
    )
    res = await db.execute(stmt)
    invites = res.scalars().all()

    output = []
    for inv in invites:
        p = inv.project
        if not p:
            continue

        job_items = []
        for t in p.tasks:
            for j in t.jobs:
                job_items.append(InvitationJobItem(
                    id=j.id,
                    name=j.name,
                    image_count=j.image_count,
                    deadline=j.deadline,
                    cvat_url=j.cvat_url
                ))

        output.append(InvitationResponse(
            id=inv.id,
            project_id=p.id,
            project_name=p.name,
            project_description=p.description or "",
            project_visibility=p.visibility,
            campaign_type=p.campaign_type,
            role=inv.role,
            status=inv.status,
            invited_at=inv.joined_at,
            invited_by_name=inv.invited_by.full_name if inv.invited_by else None,
            invited_by_email=inv.invited_by.email if inv.invited_by else None,
            total_frames=p.total_frames,
            tasks_count=len(p.tasks),
            jobs_count=len(job_items),
            jobs=job_items
        ))

    return ApiResponse(
        success=True,
        message=f"Lấy danh sách {len(output)} lời mời thành công",
        data=output
    )

@router.post("/invitations/{membership_id}/accept", response_model=ApiResponse[dict])
async def accept_invitation(
    membership_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Người dùng chấp nhận lời mời tham gia dự án (Trạng thái chuyển thành ACTIVE)."""
    stmt = select(ProjectMember).where(
        ProjectMember.id == membership_id,
        ProjectMember.user_id == current_user.id
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy lời mời tương ứng.")

    if member.status != MemberStatus.PENDING_ACCEPTANCE:
        raise HTTPException(status_code=400, detail="Lời mời này đã được xử lý trước đó.")

    member.status = MemberStatus.ACTIVE
    await db.commit()

    return ApiResponse(
        success=True,
        message="Chấp nhận lời mời tham gia dự án thành công",
        data={"membership_id": str(member.id), "status": member.status.value}
    )

@router.post("/invitations/{membership_id}/reject", response_model=ApiResponse[dict])
async def reject_invitation(
    membership_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Người dùng từ chối lời mời tham gia dự án (Trạng thái chuyển thành REJECTED)."""
    stmt = select(ProjectMember).where(
        ProjectMember.id == membership_id,
        ProjectMember.user_id == current_user.id
    )
    res = await db.execute(stmt)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Không tìm thấy lời mời tương ứng.")

    if member.status != MemberStatus.PENDING_ACCEPTANCE:
        raise HTTPException(status_code=400, detail="Lời mời này đã được xử lý trước đó.")

    member.status = MemberStatus.REJECTED
    await db.commit()

    return ApiResponse(
        success=True,
        message="Đã từ chối lời mời tham gia dự án",
        data={"membership_id": str(member.id), "status": member.status.value}
    )

# ============================================================
# 3. Tasks Management APIs
# ============================================================

@router.post("/{project_id}/tasks", response_model=ApiResponse[TaskResponse])
async def create_task(
    project_id: str,
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo Task mới trong dự án. Hỗ trợ gán lead_id (1 User có thể làm Lead nhiều Task).
    
    Quy chuẩn kiến trúc 2 tầng: Task Lead BẮT BUỘC phải là thành viên ACTIVE của dự án.
    """
    project = await _get_project_with_access_check(db, project_id, current_user, require_lead=True)

    lead_name = None
    if payload.lead_id:
        res_lead = await db.execute(select(User).where(User.id == payload.lead_id))
        lead_user = res_lead.scalar_one_or_none()
        if not lead_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản Task Lead được chỉ định.")

        # Ràng buộc kiến trúc 2 tầng: Task Lead phải là thành viên ACTIVE của dự án
        is_active_member = any(
            m.user_id == payload.lead_id and m.status == MemberStatus.ACTIVE
            for m in project.members
        )
        is_creator = project.created_by_id == payload.lead_id
        is_admin = bool(lead_user.is_admin)

        if not (is_active_member or is_creator or is_admin):
            raise HTTPException(
                status_code=400,
                detail="Task Lead được chỉ định phải là thành viên chính thức (ACTIVE) của dự án."
            )

        lead_name = lead_user.full_name

    new_task = Task(
        project_id=project_id,
        name=payload.name,
        status=TaskStatus.SAMPLING,
        lead_id=payload.lead_id,
        total_sampled_images=payload.total_sampled_images or 0
    )
    db.add(new_task)
    await db.commit()
    await db.refresh(new_task)

    return ApiResponse(
        success=True,
        message=f"Tạo mới Task '{new_task.name}' thành công",
        data=TaskResponse(
            id=new_task.id,
            project_id=new_task.project_id,
            name=new_task.name,
            status=new_task.status,
            lead_id=new_task.lead_id,
            lead_name=lead_name,
            total_sampled_images=new_task.total_sampled_images,
            jobs_count=0,
            created_at=new_task.created_at,
            updated_at=new_task.updated_at
        )
    )

@router.get("/{project_id}/tasks", response_model=ApiResponse[List[TaskResponse]])
async def list_project_tasks(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách Tasks thuộc dự án."""
    await _get_project_with_access_check(db, project_id, current_user)

    stmt = (
        select(Task)
        .options(selectinload(Task.lead), selectinload(Task.jobs))
        .where(Task.project_id == project_id)
        .order_by(Task.created_at.desc())
    )
    res = await db.execute(stmt)
    tasks = res.scalars().all()

    output = [
        TaskResponse(
            id=t.id,
            project_id=t.project_id,
            name=t.name,
            status=t.status,
            lead_id=t.lead_id,
            lead_name=t.lead.full_name if t.lead else None,
            total_sampled_images=t.total_sampled_images,
            jobs_count=len(t.jobs),
            created_at=t.created_at,
            updated_at=t.updated_at
        ) for t in tasks
    ]

    return ApiResponse(
        success=True,
        message=f"Lấy danh sách {len(output)} Task thành công",
        data=output
    )

@router.get("/tasks/{task_id}", response_model=ApiResponse[TaskResponse])
async def get_task_detail(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xem chi tiết một Task cụ thể."""
    stmt = (
        select(Task)
        .options(selectinload(Task.lead), selectinload(Task.jobs), selectinload(Task.project))
        .where(Task.id == task_id)
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy Task.")

    await _get_project_with_access_check(db, task.project_id, current_user)

    return ApiResponse(
        success=True,
        message="Lấy thông tin Task thành công",
        data=TaskResponse(
            id=task.id,
            project_id=task.project_id,
            name=task.name,
            status=task.status,
            lead_id=task.lead_id,
            lead_name=task.lead.full_name if task.lead else None,
            total_sampled_images=task.total_sampled_images,
            jobs_count=len(task.jobs),
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    )

@router.patch("/tasks/{task_id}", response_model=ApiResponse[TaskResponse])
async def update_task(
    task_id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật thông tin Task (Chỉ Project Lead hoặc Quản trị viên)."""
    stmt = (
        select(Task)
        .options(selectinload(Task.lead), selectinload(Task.jobs), selectinload(Task.project))
        .where(Task.id == task_id)
    )
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy Task.")

    project = await _get_project_with_access_check(db, task.project_id, current_user, require_lead=True)

    if payload.lead_id is not None:
        res_lead = await db.execute(select(User).where(User.id == payload.lead_id))
        lead_user = res_lead.scalar_one_or_none()
        if not lead_user:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài khoản Task Lead được chỉ định.")

        is_active_member = any(
            m.user_id == payload.lead_id and m.status == MemberStatus.ACTIVE
            for m in project.members
        )
        is_creator = project.created_by_id == payload.lead_id
        is_admin = bool(lead_user.is_admin)

        if not (is_active_member or is_creator or is_admin):
            raise HTTPException(
                status_code=400,
                detail="Task Lead được chỉ định phải là thành viên chính thức (ACTIVE) của dự án."
            )
        task.lead_id = payload.lead_id
        task.lead = lead_user

    if payload.name is not None:
        task.name = payload.name
    if payload.status is not None:
        task.status = payload.status
    if payload.total_sampled_images is not None:
        task.total_sampled_images = payload.total_sampled_images

    await db.commit()
    await db.refresh(task)

    return ApiResponse(
        success=True,
        message=f"Cập nhật Task '{task.name}' thành công",
        data=TaskResponse(
            id=task.id,
            project_id=task.project_id,
            name=task.name,
            status=task.status,
            lead_id=task.lead_id,
            lead_name=task.lead.full_name if task.lead else None,
            total_sampled_images=task.total_sampled_images,
            jobs_count=len(task.jobs),
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    )

@router.delete("/tasks/{task_id}", response_model=ApiResponse[dict])
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa Task (Chỉ Project Lead hoặc Quản trị viên). Cascade xóa toàn bộ Jobs trực thuộc."""
    stmt = select(Task).where(Task.id == task_id)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy Task.")

    await _get_project_with_access_check(db, task.project_id, current_user, require_lead=True)

    await db.delete(task)
    await db.commit()
    return ApiResponse(
        success=True,
        message=f"Đã xóa Task {task_id} thành công",
        data={"task_id": str(task_id), "deleted": True}
    )

# ============================================================
# 4. Jobs Management APIs
# ============================================================

def _build_job_response(job: Job) -> JobResponse:
    members_info = []
    for jm in job.job_members:
        members_info.append(JobMemberInfo(
            user_id=jm.user_id,
            user_name=jm.user.full_name if jm.user else None,
            user_email=jm.user.email if jm.user else None,
            role=jm.role,
            assigned_at=jm.assigned_at
        ))
    return JobResponse(
        id=job.id,
        task_id=job.task_id,
        name=job.name,
        status=job.status,
        image_count=job.image_count,
        annotated_frames=job.annotated_frames,
        cvat_job_id=job.cvat_job_id,
        cvat_url=job.cvat_url,
        deadline=job.deadline,
        created_at=job.created_at,
        updated_at=job.updated_at,
        members=members_info
    )

@router.post("/tasks/{task_id}/jobs", response_model=ApiResponse[JobResponse])
async def create_job(
    task_id: uuid.UUID,
    payload: JobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Tạo Job mới trong Task. Tự động sinh cvat_url nếu có cvat_job_id."""
    stmt_task = select(Task).where(Task.id == task_id)
    res_task = await db.execute(stmt_task)
    task = res_task.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy Task.")

    # Kiểm tra quyền tạo Job (Project Lead hoặc Task Lead)
    is_admin = bool(current_user.is_admin)
    is_task_lead = task.lead_id == current_user.id
    
    project = await _get_project_with_access_check(db, task.project_id, current_user)
    is_project_lead = any(
        m.user_id == current_user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    ) or project.created_by_id == current_user.id

    if not (is_admin or is_task_lead or is_project_lead):
        raise HTTPException(status_code=403, detail="Chỉ Task Lead hoặc Project Lead mới có quyền tạo Job.")

    # Sinh link CVAT tự động nếu có cvat_job_id
    cvat_url = payload.cvat_url
    if payload.cvat_job_id and not cvat_url:
        cvat_url = cvat_client.generate_job_url(payload.cvat_job_id)

    new_job = Job(
        task_id=task_id,
        name=payload.name,
        status=JobStatus.PENDING,
        image_count=payload.image_count or 0,
        annotated_frames=0,
        cvat_job_id=payload.cvat_job_id,
        cvat_url=cvat_url,
        deadline=payload.deadline
    )
    db.add(new_job)
    await db.commit()

    # Load lại có relationships
    stmt = (
        select(Job)
        .options(selectinload(Job.job_members).selectinload(JobMember.user))
        .where(Job.id == new_job.id)
        .execution_options(populate_existing=True)
    )
    res = await db.execute(stmt)
    job = res.scalar_one()

    return ApiResponse(
        success=True,
        message=f"Tạo mới Job '{job.name}' thành công",
        data=_build_job_response(job)
    )

@router.get("/tasks/{task_id}/jobs", response_model=ApiResponse[List[JobResponse]])
async def list_task_jobs(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách các Job trong Task."""
    stmt_task = select(Task).where(Task.id == task_id)
    res_task = await db.execute(stmt_task)
    task = res_task.scalar_one_or_none()

    if not task:
        raise HTTPException(status_code=404, detail="Không tìm thấy Task.")

    await _get_project_with_access_check(db, task.project_id, current_user)

    stmt = (
        select(Job)
        .options(selectinload(Job.job_members).selectinload(JobMember.user))
        .where(Job.task_id == task_id)
        .order_by(Job.created_at.asc())
    )
    res = await db.execute(stmt)
    jobs = res.scalars().all()

    return ApiResponse(
        success=True,
        message=f"Lấy danh sách {len(jobs)} Job thành công",
        data=[_build_job_response(j) for j in jobs]
    )

@router.get("/jobs/{job_id}", response_model=ApiResponse[JobResponse])
async def get_job_detail(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xem chi tiết một Job cụ thể."""
    stmt = (
        select(Job)
        .options(
            selectinload(Job.job_members).selectinload(JobMember.user),
            selectinload(Job.task).selectinload(Task.project)
        )
        .where(Job.id == job_id)
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job.")

    await _get_project_with_access_check(db, job.task.project_id, current_user)
    return ApiResponse(
        success=True,
        message="Lấy thông tin Job thành công",
        data=_build_job_response(job)
    )

@router.patch("/jobs/{job_id}", response_model=ApiResponse[JobResponse])
async def update_job(
    job_id: uuid.UUID,
    payload: JobUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật thông tin Job (Chỉ Task Lead hoặc Project Lead)."""
    stmt = (
        select(Job)
        .options(
            selectinload(Job.job_members).selectinload(JobMember.user),
            selectinload(Job.task).selectinload(Task.project).selectinload(Project.members)
        )
        .where(Job.id == job_id)
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job.")

    task = job.task
    project = task.project

    is_admin = bool(current_user.is_admin)
    is_task_lead = task.lead_id == current_user.id
    is_project_lead = any(
        m.user_id == current_user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    ) or project.created_by_id == current_user.id

    if not (is_admin or is_task_lead or is_project_lead):
        raise HTTPException(status_code=403, detail="Chỉ Task Lead hoặc Project Lead mới có quyền cập nhật Job.")

    if payload.name is not None:
        job.name = payload.name
    if payload.status is not None:
        job.status = payload.status
    if payload.image_count is not None:
        job.image_count = payload.image_count
    if payload.cvat_job_id is not None:
        job.cvat_job_id = payload.cvat_job_id
        if not payload.cvat_url:
            job.cvat_url = cvat_client.generate_job_url(payload.cvat_job_id)
    if payload.cvat_url is not None:
        job.cvat_url = payload.cvat_url
    if payload.deadline is not None:
        job.deadline = payload.deadline

    await db.commit()
    await db.refresh(job)

    return ApiResponse(
        success=True,
        message=f"Cập nhật Job '{job.name}' thành công",
        data=_build_job_response(job)
    )

@router.delete("/jobs/{job_id}", response_model=ApiResponse[dict])
async def delete_job(
    job_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xóa Job (Chỉ Task Lead hoặc Project Lead)."""
    stmt = (
        select(Job)
        .options(
            selectinload(Job.task).selectinload(Task.project).selectinload(Project.members)
        )
        .where(Job.id == job_id)
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job.")

    task = job.task
    project = task.project

    is_admin = bool(current_user.is_admin)
    is_task_lead = task.lead_id == current_user.id
    is_project_lead = any(
        m.user_id == current_user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    ) or project.created_by_id == current_user.id

    if not (is_admin or is_task_lead or is_project_lead):
        raise HTTPException(status_code=403, detail="Chỉ Task Lead hoặc Project Lead mới có quyền xóa Job.")

    await db.delete(job)
    await db.commit()

    return ApiResponse(
        success=True,
        message=f"Đã xóa Job {job_id} thành công",
        data={"job_id": str(job_id), "deleted": True}
    )

@router.post("/jobs/{job_id}/assign", response_model=ApiResponse[JobResponse])
async def assign_job_member(
    job_id: uuid.UUID,
    payload: JobAssignRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Phân công thành viên vào Job.
    
    Quy tắc nghiệp vụ:
    1. Quyền gán: Task Lead, Project Lead hoặc Quản trị viên.
    2. RÀNG BUỘC KIẾN TRÚC 2 TẦNG: Người được phân công BẮT BUỘC phải là thành viên chính thức (ACTIVE) của dự án.
    3. Lead-as-Worker: Task Lead / Project Lead CÓ THỂ tự gán mình vào Job.
    4. Gán việc đa nhiệm: 1 Thành viên có thể nhận nhiều Job cùng lúc trong 1 Task.
    5. Chống Bias (Anti-Self Review): Chặn 1 người vừa làm ANNOTATOR vừa làm QA_REVIEWER trên cùng 1 Job.
    6. Tự động gán assignee trên CVAT nếu đã cấu hình cvat_job_id và cvat_user_id.
    """
    stmt = (
        select(Job)
        .options(
            selectinload(Job.job_members).selectinload(JobMember.user),
            selectinload(Job.task).selectinload(Task.project).selectinload(Project.members)
        )
        .where(Job.id == job_id)
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job.")

    task = job.task
    project = task.project

    # Kiểm tra quyền gán việc
    is_admin = bool(current_user.is_admin)
    is_task_lead = task.lead_id == current_user.id
    is_project_lead = any(
        m.user_id == current_user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    ) or project.created_by_id == current_user.id

    if not (is_admin or is_task_lead or is_project_lead):
        raise HTTPException(status_code=403, detail="Chỉ Task Lead hoặc Project Lead mới có quyền phân công Job.")

    # Tìm thông tin người nhận việc
    user_res = await db.execute(select(User).where(User.id == payload.user_id))
    assignee = user_res.scalar_one_or_none()
    if not assignee:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng nhận việc.")

    # RÀNG BUỘC KIẾN TRÚC 2 TẦNG (2-Tier Hierarchy Enforcement):
    # Người được phân công Job BẮT BUỘC phải là thành viên chính thức (ACTIVE) của dự án!
    is_active_member = any(
        m.user_id == payload.user_id and m.status == MemberStatus.ACTIVE
        for m in project.members
    )
    is_creator = project.created_by_id == payload.user_id
    is_admin_worker = bool(assignee.is_admin)

    if not (is_active_member or is_creator or is_admin_worker):
        raise HTTPException(
            status_code=400,
            detail="Người dùng này chưa phải là thành viên chính thức (ACTIVE) của dự án."
        )

    # Chống Bias (Anti-Self Review) trên cùng 1 Job:
    # 1 người KHÔNG THỂ vừa làm ANNOTATOR vừa làm QA_REVIEWER trên cùng 1 Job!
    for existing_jm in job.job_members:
        if existing_jm.user_id == payload.user_id:
            if existing_jm.role != payload.role:
                raise HTTPException(
                    status_code=400,
                    detail="Chống tự kiểm duyệt (Anti-Self Review): Một người không thể vừa làm ANNOTATOR vừa làm QA_REVIEWER trên cùng một Job."
                )
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Người dùng này đã được gán vai trò {payload.role.value} trên Job này rồi."
                )

    new_jm = JobMember(
        job_id=job_id,
        user_id=payload.user_id,
        role=payload.role
    )
    new_jm.user = assignee
    job.job_members.append(new_jm)

    # Cập nhật trạng thái job nếu đang PENDING
    if job.status == JobStatus.PENDING:
        job.status = JobStatus.IN_PROGRESS

    # Tự động chuyển Task sang IN_PROGRESS nếu Task đang SAMPLING
    if task.status == TaskStatus.SAMPLING:
        task.status = TaskStatus.IN_PROGRESS

    # Tích hợp CVAT: Tự động gán assignee trên máy chủ CVAT nếu có CVAT IDs
    if job.cvat_job_id and assignee.cvat_user_id:
        try:
            await cvat_client.assign_job(
                cvat_job_id=job.cvat_job_id,
                assignee_id=assignee.cvat_user_id,
                auth_token=current_user.cvat_token
            )
        except Exception as exc:
            logger.warning(f"⚠️ Đồng bộ assignee sang CVAT thất bại: {exc}")

    if job.cvat_job_id and not job.cvat_url:
        job.cvat_url = cvat_client.generate_job_url(job.cvat_job_id)

    await db.commit()

    # Query lại job với đầy đủ quan hệ để response
    stmt = (
        select(Job)
        .options(selectinload(Job.job_members).selectinload(JobMember.user))
        .where(Job.id == job_id)
        .execution_options(populate_existing=True)
    )
    res_re = await db.execute(stmt)
    updated_job = res_re.scalar_one()

    return ApiResponse(
        success=True,
        message=f"Đã gán vai trò {payload.role.value} cho {assignee.full_name} trên Job '{updated_job.name}'",
        data=_build_job_response(updated_job)
    )

@router.delete("/jobs/{job_id}/members/{user_id}", response_model=ApiResponse[JobResponse])
async def unassign_job_member(
    job_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Gỡ phân công thành viên khỏi Job (Chỉ Task Lead hoặc Project Lead)."""
    stmt = (
        select(Job)
        .options(
            selectinload(Job.job_members).selectinload(JobMember.user),
            selectinload(Job.task).selectinload(Task.project).selectinload(Project.members)
        )
        .where(Job.id == job_id)
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy Job.")

    task = job.task
    project = task.project

    is_admin = bool(current_user.is_admin)
    is_task_lead = task.lead_id == current_user.id
    is_project_lead = any(
        m.user_id == current_user.id and m.role == ProjectRole.PROJECT_LEAD and m.status == MemberStatus.ACTIVE
        for m in project.members
    ) or project.created_by_id == current_user.id

    if not (is_admin or is_task_lead or is_project_lead):
        raise HTTPException(status_code=403, detail="Chỉ Task Lead hoặc Project Lead mới có quyền gỡ phân công Job.")

    member_to_remove = next((jm for jm in job.job_members if jm.user_id == user_id), None)
    if not member_to_remove:
        raise HTTPException(status_code=404, detail="Người dùng này không được phân công trong Job.")

    job.job_members.remove(member_to_remove)
    await db.delete(member_to_remove)
    await db.commit()

    stmt_re = (
        select(Job)
        .options(selectinload(Job.job_members).selectinload(JobMember.user))
        .where(Job.id == job_id)
        .execution_options(populate_existing=True)
    )
    res_re = await db.execute(stmt_re)
    updated_job = res_re.scalar_one()

    return ApiResponse(
        success=True,
        message="Đã gỡ phân công thành viên khỏi Job",
        data=_build_job_response(updated_job)
    )

# ============================================================
# 5. CVAT Realtime Webhook Receiver
# ============================================================

async def _process_cvat_webhook(
    request: Request,
    db: AsyncSession,
    x_signature_256: Optional[str] = None
) -> ApiResponse[dict]:
    """Hàm xử lý nghiệp vụ chung cho Webhook CVAT với xác thực HMAC-SHA256."""
    raw_body = await request.body()
    
    # Lấy signature từ headers
    sig = (
        x_signature_256 or 
        request.headers.get("x-signature-256") or 
        request.headers.get("x-hub-signature-256") or 
        request.headers.get("x-cvat-signature")
    )

    # Xác thực HMAC-SHA256 nếu máy chủ có thiết lập secret
    if settings.CVAT_WEBHOOK_SECRET:
        if not cvat_client.verify_webhook_signature(raw_body, sig):
            logger.warning("❌ Chữ ký CVAT Webhook không hợp lệ!")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, 
                detail="Chữ ký webhook CVAT HMAC-SHA256 không hợp lệ."
            )

    try:
        payload_data = await request.json()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Dữ liệu JSON webhook không hợp lệ: {exc}")

    event = payload_data.get("event") or payload_data.get("action") or "update:job"
    job_info = payload_data.get("job") or payload_data

    cvat_job_id = job_info.get("id")
    job_state = job_info.get("state") or job_info.get("status")

    logger.info(f"🔔 Nhận CVAT Webhook: event={event}, cvat_job_id={cvat_job_id}, state={job_state}")

    if not cvat_job_id:
        return ApiResponse(
            success=True, 
            message="Webhook nhận thành công nhưng không có cvat_job_id để đồng bộ",
            data={"processed": False}
        )

    # Tìm Job trong Database của GreenSM
    stmt = (
        select(Job)
        .options(
            selectinload(Job.task).selectinload(Task.project),
            selectinload(Job.job_members).selectinload(JobMember.user)
        )
        .where(Job.cvat_job_id == int(cvat_job_id))
    )
    res = await db.execute(stmt)
    job = res.scalar_one_or_none()

    if not job:
        return ApiResponse(
            success=True,
            message=f"Không tìm thấy Job GreenSM tương ứng với CVAT Job #{cvat_job_id}",
            data={"processed": False, "cvat_job_id": cvat_job_id}
        )

    # Kiểm tra trạng thái hoàn thành (completed / validation / finish)
    completed_states = ["completed", "finish", "validation", "COMPLETED"]
    is_completed_event = (
        event in ["update:job", "updated", "create:annotation", "save:job"] and
        (str(job_state).lower() in ["completed", "finish", "validation"])
    )

    if is_completed_event or str(job_state).lower() in ["completed", "finish"]:
        # IDEMPOTENCY CHECK:
        # Nếu Job đã hoàn thành trước đó và frames đã đủ, không cộng dồn lặp lại!
        if job.status == JobStatus.COMPLETED and job.annotated_frames == job.image_count:
            logger.info(f"ℹ️ Job #{job.id} (CVAT #{cvat_job_id}) đã ở trạng thái COMPLETED từ trước (Idempotent)")
            return ApiResponse(
                success=True,
                message=f"Đồng bộ Job #{cvat_job_id} thành công: Đã COMPLETED từ trước (Idempotent)",
                data={
                    "job_id": str(job.id),
                    "cvat_job_id": job.cvat_job_id,
                    "status": job.status.value,
                    "annotated_frames": job.annotated_frames
                }
            )

        frames_delta = max(0, job.image_count - job.annotated_frames)
        job.status = JobStatus.COMPLETED
        job.annotated_frames = job.image_count
        
        # Cập nhật tổng frame đã gán nhãn cho Project an toàn, không ép về 0 nếu total_frames = 0
        project = job.task.project
        project.annotated_frames = project.annotated_frames + frames_delta
        if project.total_frames < project.annotated_frames:
            project.total_frames = project.annotated_frames

        # Tăng tổng số frame annotate cho thành viên ANNOTATOR theo đúng delta
        for jm in job.job_members:
            if jm.role == JobRole.ANNOTATOR and jm.user:
                jm.user.total_annotated = (jm.user.total_annotated or 0) + frames_delta
                # Bắn thông báo realtime qua WebSocket tới user nếu online
                try:
                    await ws_manager.send_personal_message({
                        "type": "CVAT_JOB_COMPLETED",
                        "job_id": str(job.id),
                        "cvat_job_id": job.cvat_job_id,
                        "message": f"Job #{job.cvat_job_id} '{job.name}' trên CVAT đã hoàn thành!"
                    }, str(jm.user.id))
                except Exception as ws_err:
                    logger.debug(f"Không gửi được websocket tới user: {ws_err}")

        # Cascade cập nhật trạng thái Task: Nếu tất cả Job trong Task đều COMPLETED
        stmt_task_jobs = select(Job).where(Job.task_id == job.task_id)
        res_task_jobs = await db.execute(stmt_task_jobs)
        task_jobs = res_task_jobs.scalars().all()
        if all(tj.status == JobStatus.COMPLETED for tj in task_jobs):
            job.task.status = TaskStatus.COMPLETED

        await db.commit()
        logger.info(f"✅ Đã cập nhật Job #{job.id} (CVAT #{cvat_job_id}) sang COMPLETED với delta={frames_delta}")

        return ApiResponse(
            success=True,
            message=f"Đồng bộ Job #{cvat_job_id} thành công: COMPLETED",
            data={
                "job_id": str(job.id),
                "cvat_job_id": job.cvat_job_id,
                "status": job.status.value,
                "annotated_frames": job.annotated_frames
            }
        )

    return ApiResponse(
        success=True,
        message=f"Đã nhận webhook CVAT cho Job #{cvat_job_id}",
        data={"processed": True, "cvat_job_id": cvat_job_id, "state": job_state}
    )

@router.post("/cvat/webhook", response_model=ApiResponse[dict])
async def projects_cvat_webhook_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_signature_256: Optional[str] = Header(None, alias="X-Signature-256")
):
    """Webhook nhận sự kiện từ CVAT (Đường dẫn /api/v1/projects/cvat/webhook)."""
    return await _process_cvat_webhook(request, db, x_signature_256)

@integrations_router.post("/cvat/webhook", response_model=ApiResponse[dict])
async def integrations_cvat_webhook_endpoint(
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_signature_256: Optional[str] = Header(None, alias="X-Signature-256")
):
    """Webhook nhận sự kiện từ CVAT (Đường dẫn /api/v1/integrations/cvat/webhook)."""
    return await _process_cvat_webhook(request, db, x_signature_256)
