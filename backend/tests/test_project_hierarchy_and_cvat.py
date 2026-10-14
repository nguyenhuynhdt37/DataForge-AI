import re
import uuid
import hmac
import hashlib
import json
import pytest
import pytest_asyncio
import httpx
from unittest.mock import AsyncMock, patch

from app.main import app
from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.core.cvat_client import cvat_client
from app.modules.auth.models import User
from app.modules.auth.dependencies import get_current_user
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

@pytest_asyncio.fixture
async def async_client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(autouse=True)
async def cleanup_db_connections():
    yield
    from app.core.database import engine
    await engine.dispose()

# ============================================================
# Helpers: Tạo test user
# ============================================================

def create_mock_user(
    email: str = "test@greensm.vn",
    full_name: str = "Test User",
    is_admin: bool = False,
    user_id: uuid.UUID = None,
    cvat_user_id: int = None,
    cvat_username: str = None
) -> User:
    u = User(
        id=user_id or uuid.uuid4(),
        email=email,
        hashed_password="some_hashed_password",
        full_name=full_name,
        is_active=True,
        is_admin=is_admin,
        cvat_user_id=cvat_user_id,
        cvat_username=cvat_username,
        total_annotated=0,
        accuracy_rate=1.0
    )
    return u

# ============================================================
# 1. Kiểm thử 100% Constant Keys Enums (Upper Snake Case)
# ============================================================

def test_enum_constant_keys_compliance():
    """Kiểm tra toàn bộ Enums trong module Projects:
    - 100% Constant Keys dạng UPPER_SNAKE_CASE
    - Tuyệt đối không chứa tiếng Việt có dấu
    """
    enums_to_check = [
        (ProjectVisibility, ["PUBLIC", "PRIVATE"]),
        (CampaignType, ["ACTIVE_LEARNING_V3", "HARD_SLICE_CURATION", "EDGE_BENCHMARK", "ZERO_SHOT_DISCOVERY"]),
        (ProjectStatus, ["INITIALIZING", "ANNOTATING", "UNDER_QA", "TRAINING", "COMPLETED", "ARCHIVED"]),
        (ProjectRole, ["PROJECT_LEAD", "QA_REVIEWER", "ANNOTATOR", "PROJECT_MEMBER"]),
        (MemberStatus, ["PENDING_APPROVAL", "PENDING_ACCEPTANCE", "ACTIVE", "REJECTED", "REMOVED"]),
        (TaskStatus, ["SAMPLING", "IN_PROGRESS", "UNDER_QA", "COMPLETED"]),
        (JobStatus, ["PENDING", "IN_PROGRESS", "UNDER_QA", "COMPLETED", "REJECTED"]),
        (JobRole, ["ANNOTATOR", "QA_REVIEWER"]),
    ]

    upper_snake_regex = re.compile(r"^[A-Z0-9]+(_[A-Z0-9]+)*$")

    for enum_cls, expected_members in enums_to_check:
        actual_members = [m.value for m in enum_cls]
        for exp in expected_members:
            assert exp in actual_members, f"Enum {enum_cls.__name__} thiếu key: {exp}"

        for m in enum_cls:
            assert upper_snake_regex.match(m.value), f"Key {m.value} của {enum_cls.__name__} không đúng UPPER_SNAKE_CASE"
            assert m.value.isascii(), f"Key {m.value} của {enum_cls.__name__} chứa ký tự non-ascii (tiếng Việt)"


# ============================================================
# 2. Kiểm thử Tầng 1: Tạo dự án & Tự động gán PROJECT_LEAD ACTIVE
# ============================================================

@pytest.mark.asyncio
async def test_create_project_auto_assigns_lead_active(async_client):
    """Khi tạo dự án mới:
    - Tự động gán người tạo làm PROJECT_LEAD ở trạng thái ACTIVE
    - created_by_id lưu ID người tạo
    """
    lead_user = create_mock_user(email=f"lead_creator_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Đặng Huỳnh")

    async with AsyncSessionLocal() as session:
        session.add(lead_user)
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead_user
    try:
        project_payload = {
            "name": "Dự án Thử Nghiệm VF9",
            "description": "Thử nghiệm gán nhãn lidar và camera VF9",
            "visibility": "PUBLIC",
            "campaign_type": "ACTIVE_LEARNING_V3",
            "total_frames": 5000
        }
        res = await async_client.post("/api/v1/projects", json=project_payload)
        assert res.status_code == 200
        data = res.json()["data"]
        project_id = data["id"]
        assert data["name"] == "Dự án Thử Nghiệm VF9"
        assert data["created_by_id"] == str(lead_user.id)

        # Kiểm tra trong DB: Người tạo phải có ProjectMember với PROJECT_LEAD và ACTIVE
        async with AsyncSessionLocal() as session:
            project = await session.get(Project, project_id)
            assert project is not None
            assert project.created_by_id == lead_user.id

            from sqlalchemy.future import select
            members_res = await session.execute(
                select(ProjectMember).where(ProjectMember.project_id == project_id)
            )
            members = members_res.scalars().all()
            assert len(members) == 1
            assert members[0].user_id == lead_user.id
            assert members[0].role == ProjectRole.PROJECT_LEAD
            assert members[0].status == MemberStatus.ACTIVE
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 3. Kiểm thử Tầng 1: Dự án PRIVATE Tàng Hình Hoàn Toàn & Chặn Join-Request
# ============================================================

@pytest.mark.asyncio
async def test_private_project_stealth_visibility(async_client):
    """Dự án PRIVATE:
    - Tối mật, tàng hình hoàn toàn: User ngoài gọi GET /projects không thấy.
    - Gọi GET /projects/{id} trực tiếp trả về 404 (Không để lộ sự tồn tại).
    - Gọi POST /projects/{id}/join-requests bị từ chối 404.
    """
    creator_user = create_mock_user(email=f"owner_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Secret Owner")
    stranger_user = create_mock_user(email=f"stranger_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Người Ngoài")

    async with AsyncSessionLocal() as session:
        session.add(creator_user)
        session.add(stranger_user)
        await session.commit()

    # Tạo 1 dự án PRIVATE và 1 dự án PUBLIC
    app.dependency_overrides[get_current_user] = lambda: creator_user
    try:
        res_priv = await async_client.post("/api/v1/projects", json={
            "name": "Dự Án Tối Mật Quân Sự",
            "visibility": "PRIVATE",
            "campaign_type": "ZERO_SHOT_DISCOVERY"
        })
        assert res_priv.status_code == 200
        private_id = res_priv.json()["data"]["id"]

        res_pub = await async_client.post("/api/v1/projects", json={
            "name": "Dự Án Công Khai Xe Máy Điện",
            "visibility": "PUBLIC",
            "campaign_type": "HARD_SLICE_CURATION"
        })
        assert res_pub.status_code == 200
        public_id = res_pub.json()["data"]["id"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Đăng nhập với tư cách Người Ngoài (stranger)
    app.dependency_overrides[get_current_user] = lambda: stranger_user
    try:
        # 1. GET /projects: Dự án PRIVATE phải tàng hình hoàn toàn!
        res_list = await async_client.get("/api/v1/projects")
        assert res_list.status_code == 200
        list_ids = [p["id"] for p in res_list.json()["data"]]
        assert public_id in list_ids
        assert private_id not in list_ids, "Dự án PRIVATE không được xuất hiện trong danh sách của người ngoài!"

        # 2. GET /projects/{private_id}: Trả về 404 để không lộ thông tin
        res_detail = await async_client.get(f"/api/v1/projects/{private_id}")
        assert res_detail.status_code == 404

        # 3. POST /projects/{private_id}/join-requests: Bị chặn với 404
        res_join = await async_client.post(f"/api/v1/projects/{private_id}/join-requests")
        assert res_join.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 4. Kiểm thử Tầng 1: Quy trình Xin gia nhập và Lead duyệt / từ chối
# ============================================================

@pytest.mark.asyncio
async def test_public_project_join_request_and_lead_approval(async_client):
    """Quy trình xin gia nhập dự án PUBLIC:
    - User gửi join-request -> status: PENDING_APPROVAL
    - Gửi lặp lại -> Báo lỗi 400
    - Lead duyệt -> status chuyển thành ACTIVE
    - Người không phải Lead duyệt -> 403 Forbidden
    """
    lead_user = create_mock_user(email=f"lead_pub_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Public")
    applicant_user = create_mock_user(email=f"app_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Ứng Viên A")
    bystander_user = create_mock_user(email=f"by_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Người Dưng")

    async with AsyncSessionLocal() as session:
        session.add_all([lead_user, applicant_user, bystander_user])
        await session.commit()

    # Lead tạo dự án PUBLIC
    app.dependency_overrides[get_current_user] = lambda: lead_user
    res_p = await async_client.post("/api/v1/projects", json={
        "name": "Dự án Mở Nhận Diện Người Đi Bộ",
        "visibility": "PUBLIC",
        "campaign_type": "ACTIVE_LEARNING_V3"
    })
    project_id = res_p.json()["data"]["id"]

    # Ứng viên gửi join request
    app.dependency_overrides[get_current_user] = lambda: applicant_user
    res_req = await async_client.post(f"/api/v1/projects/{project_id}/join-requests")
    assert res_req.status_code == 200
    member_data = res_req.json()["data"]
    membership_id = member_data["id"]
    assert member_data["status"] == "PENDING_APPROVAL"

    # Thử gửi lại lần 2 -> 400 Bad Request
    res_repeat = await async_client.post(f"/api/v1/projects/{project_id}/join-requests")
    assert res_repeat.status_code == 400

    # Người Dưng thử duyệt -> 403 Forbidden
    app.dependency_overrides[get_current_user] = lambda: bystander_user
    res_unauth = await async_client.post(f"/api/v1/projects/{project_id}/members/{membership_id}/approve")
    assert res_unauth.status_code == 403

    # Lead duyệt thành công -> status: ACTIVE
    app.dependency_overrides[get_current_user] = lambda: lead_user
    res_approve = await async_client.post(f"/api/v1/projects/{project_id}/members/{membership_id}/approve")
    assert res_approve.status_code == 200
    assert res_approve.json()["data"]["status"] == "ACTIVE"

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_public_project_join_request_rejection(async_client):
    """Lead từ chối yêu cầu gia nhập -> status: REJECTED."""
    lead = create_mock_user(email=f"lead_rej_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Reject")
    applicant = create_mock_user(email=f"app_rej_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Ứng Viên B")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, applicant])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Lọc Xe Lạ", "visibility": "PUBLIC"})
    project_id = res_p.json()["data"]["id"]

    app.dependency_overrides[get_current_user] = lambda: applicant
    res_req = await async_client.post(f"/api/v1/projects/{project_id}/join-requests")
    membership_id = res_req.json()["data"]["id"]

    app.dependency_overrides[get_current_user] = lambda: lead
    res_rej = await async_client.post(f"/api/v1/projects/{project_id}/members/{membership_id}/reject")
    assert res_rej.status_code == 200
    assert res_rej.json()["data"]["status"] == "REJECTED"

    app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 5. Kiểm thử Tầng 1: In-App Invitation Dashboard & Accept / Reject
# ============================================================

@pytest.mark.asyncio
async def test_in_app_invitation_flow_private_project(async_client):
    """Quy trình Mời In-App (Không dùng email):
    - Lead mời User vào dự án PRIVATE -> status: PENDING_ACCEPTANCE
    - User xem Dashboard In-App Lời mời: GET /projects/invitations/me
    - User bấm accept: status -> ACTIVE
    - Sau khi accept, User thấy dự án PRIVATE trong danh sách
    """
    lead = create_mock_user(email=f"lead_inv_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Mời")
    invitee = create_mock_user(email=f"invitee_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Thành Viên Được Mời")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, invitee])
        await session.commit()

    # Lead tạo dự án PRIVATE
    app.dependency_overrides[get_current_user] = lambda: lead
    res_p = await async_client.post("/api/v1/projects", json={
        "name": "Dự án Private Cần Thợ Lành Nghề",
        "visibility": "PRIVATE",
        "campaign_type": "EDGE_BENCHMARK"
    })
    project_id = res_p.json()["data"]["id"]

    # Lead mời Invitee vào dự án
    res_inv = await async_client.post(f"/api/v1/projects/{project_id}/invitations", json={
        "user_id": str(invitee.id),
        "role": "ANNOTATOR"
    })
    assert res_inv.status_code == 200
    membership_id = res_inv.json()["data"]["id"]
    assert res_inv.json()["data"]["status"] == "PENDING_ACCEPTANCE"

    # Invitee kiểm tra Dashboard In-App
    app.dependency_overrides[get_current_user] = lambda: invitee
    res_dash = await async_client.get("/api/v1/projects/invitations/me")
    assert res_dash.status_code == 200
    invitations = res_dash.json()["data"]
    assert len(invitations) >= 1
    found = next((i for i in invitations if i["id"] == membership_id), None)
    assert found is not None
    assert found["project_id"] == project_id
    assert found["project_visibility"] == "PRIVATE"

    # Invitee bấm accept
    res_acc = await async_client.post(f"/api/v1/projects/invitations/{membership_id}/accept")
    assert res_acc.status_code == 200
    assert res_acc.json()["data"]["status"] == "ACTIVE"

    # Sau khi accept, Invitee xem dự án PRIVATE thành công!
    res_detail = await async_client.get(f"/api/v1/projects/{project_id}")
    assert res_detail.status_code == 200
    assert res_detail.json()["data"]["id"] == project_id

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_in_app_invitation_rejection(async_client):
    """User từ chối lời mời -> status chuyển sang REJECTED."""
    lead = create_mock_user(email=f"lead_reji_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Rej")
    invitee = create_mock_user(email=f"inv_reji_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="User Rej")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, invitee])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Test Reject Inv", "visibility": "PUBLIC"})
    project_id = res_p.json()["data"]["id"]

    res_inv = await async_client.post(f"/api/v1/projects/{project_id}/invitations", json={
        "user_id": str(invitee.id),
        "role": "PROJECT_MEMBER"
    })
    membership_id = res_inv.json()["data"]["id"]

    app.dependency_overrides[get_current_user] = lambda: invitee
    res_rej = await async_client.post(f"/api/v1/projects/invitations/{membership_id}/reject")
    assert res_rej.status_code == 200
    assert res_rej.json()["data"]["status"] == "REJECTED"

    app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 6. Kiểm thử Tầng 2: Task, Job, Lead-as-Worker & Multi-job
# ============================================================

@pytest.mark.asyncio
async def test_lead_as_worker_and_multi_job_assignment(async_client):
    """Tầng 2:
    - 1 User có thể làm Lead nhiều Task
    - Lead-as-Worker: Task Lead tự gán chính mình làm ANNOTATOR trên Job của mình
    - Gán việc đa nhiệm: 1 User nhận nhiều Job cùng lúc trong 1 Task
    """
    lead_user = create_mock_user(email=f"multi_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Đa Nhiệm")

    async with AsyncSessionLocal() as session:
        session.add(lead_user)
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead_user
    try:
        # Tạo Project
        res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Xe Tự Hành", "visibility": "PUBLIC"})
        project_id = res_p.json()["data"]["id"]

        # Tạo Task 1 gán lead_user làm Lead
        res_t1 = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={
            "name": "Task 1: Camera Trước",
            "lead_id": str(lead_user.id)
        })
        assert res_t1.status_code == 200
        task1_id = res_t1.json()["data"]["id"]
        assert res_t1.json()["data"]["lead_id"] == str(lead_user.id)

        # Tạo Task 2 cũng do lead_user làm Lead (1 user làm Lead nhiều Task)
        res_t2 = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={
            "name": "Task 2: Camera Sau",
            "lead_id": str(lead_user.id)
        })
        assert res_t2.status_code == 200
        task2_id = res_t2.json()["data"]["id"]
        assert res_t2.json()["data"]["lead_id"] == str(lead_user.id)

        # Tạo Job 1 và Job 2 trong Task 1
        res_j1 = await async_client.post(f"/api/v1/projects/tasks/{task1_id}/jobs", json={
            "name": "Job 1: Khung hình 0-100",
            "image_count": 100,
            "cvat_job_id": 1001
        })
        assert res_j1.status_code == 200
        job1_id = res_j1.json()["data"]["id"]
        assert "/tasks/jobs/1001" in res_j1.json()["data"]["cvat_url"]

        res_j2 = await async_client.post(f"/api/v1/projects/tasks/{task1_id}/jobs", json={
            "name": "Job 2: Khung hình 101-200",
            "image_count": 100,
            "cvat_job_id": 1002
        })
        assert res_j2.status_code == 200
        job2_id = res_j2.json()["data"]["id"]

        # Lead-as-Worker: Task Lead tự gán chính mình làm ANNOTATOR trên Job 1
        res_assign1 = await async_client.post(f"/api/v1/projects/jobs/{job1_id}/assign", json={
            "user_id": str(lead_user.id),
            "role": "ANNOTATOR"
        })
        assert res_assign1.status_code == 200
        assigned_members = res_assign1.json()["data"]["members"]
        assert any(m["user_id"] == str(lead_user.id) and m["role"] == "ANNOTATOR" for m in assigned_members)

        # Gán việc đa nhiệm: Cùng Lead đó nhận tiếp Job 2 trong cùng Task 1
        res_assign2 = await async_client.post(f"/api/v1/projects/jobs/{job2_id}/assign", json={
            "user_id": str(lead_user.id),
            "role": "ANNOTATOR"
        })
        assert res_assign2.status_code == 200
        assigned_members2 = res_assign2.json()["data"]["members"]
        assert any(m["user_id"] == str(lead_user.id) and m["role"] == "ANNOTATOR" for m in assigned_members2)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 7. Kiểm thử Anti-Self Review (Chống Bias)
# ============================================================

@pytest.mark.asyncio
async def test_anti_self_review_constraint(async_client):
    """Chống Bias (Anti-Self Review):
    - Chặn không cho phép 1 người vừa làm ANNOTATOR vừa làm QA_REVIEWER trên cùng 1 Job!
    - Bắn HTTP 400 Bad Request kèm thông báo chống tự kiểm duyệt.
    """
    lead = create_mock_user(email=f"bias_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Chống Bias")
    worker = create_mock_user(email=f"worker_bias_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Worker Thử Nghiệm")
    qa_user = create_mock_user(email=f"qa_indep_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="QA Độc Lập")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, worker, qa_user])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    try:
        res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Test Anti Bias", "visibility": "PUBLIC"})
        project_id = res_p.json()["data"]["id"]

        # Đưa worker và qa_user vào Member Pool của dự án (ACTIVE) theo chuẩn 2 tầng
        async with AsyncSessionLocal() as session:
            m1 = ProjectMember(project_id=project_id, user_id=worker.id, role=ProjectRole.ANNOTATOR, status=MemberStatus.ACTIVE)
            m2 = ProjectMember(project_id=project_id, user_id=qa_user.id, role=ProjectRole.QA_REVIEWER, status=MemberStatus.ACTIVE)
            session.add_all([m1, m2])
            await session.commit()

        res_t = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={"name": "Task Kiểm Định"})
        task_id = res_t.json()["data"]["id"]

        res_j = await async_client.post(f"/api/v1/projects/tasks/{task_id}/jobs", json={"name": "Job Kiểm Soát Điểm Mù", "image_count": 50})
        job_id = res_j.json()["data"]["id"]

        # Gán worker làm ANNOTATOR trên Job này (Thành công vì đã là ACTIVE member)
        res_assign_ann = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(worker.id),
            "role": "ANNOTATOR"
        })
        assert res_assign_ann.status_code == 200

        # Thử gán chính worker đó làm QA_REVIEWER trên cùng Job này -> BẮT BUỘC BỊ CHẶN 400!
        res_conflict = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(worker.id),
            "role": "QA_REVIEWER"
        })
        assert res_conflict.status_code == 400
        detail_msg = res_conflict.json()["detail"]
        assert "Anti-Self Review" in detail_msg or "Chống tự kiểm duyệt" in detail_msg

        # Gán người khác (qa_user) làm QA_REVIEWER -> Thành công!
        res_qa = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(qa_user.id),
            "role": "QA_REVIEWER"
        })
        assert res_qa.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 8. Kiểm thử Tích hợp CVAT: Xác thực CVAT Access Token
# ============================================================

@pytest.mark.asyncio
async def test_cvat_token_verification_endpoint(async_client):
    """PUT /api/v1/auth/me/cvat-token:
    - Kiểm tra token sống sang CVAT Server qua GET /api/users/self
    - Mock thành công (HTTP 200) -> cập nhật cvat_user_id, cvat_username
    - Mock thất bại (HTTP 401) -> trả về HTTP 400
    """
    test_user = create_mock_user(email=f"cvat_user_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="CVAT Annotator")

    async with AsyncSessionLocal() as session:
        session.add(test_user)
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: test_user
    try:
        # Mock thành công
        with patch.object(cvat_client, "verify_user_token", new_callable=AsyncMock) as mock_verify:
            mock_verify.return_value = {"id": 108, "username": "cvat_hero_2026", "email": test_user.email}

            res = await async_client.put("/api/v1/auth/me/cvat-token", json={"cvat_token": "valid_cvat_token_abc_123"})
            assert res.status_code == 200
            data = res.json()["data"]
            assert data["cvat_user_id"] == 108
            assert data["cvat_username"] == "cvat_hero_2026"

        # Mock thất bại: Token hết hạn hoặc sai
        with patch.object(cvat_client, "verify_user_token", new_callable=AsyncMock) as mock_verify_err:
            mock_verify_err.side_effect = ValueError("CVAT Token không hợp lệ hoặc đã hết hạn")

            res_err = await async_client.put("/api/v1/auth/me/cvat-token", json={"cvat_token": "invalid_expired_token"})
            assert res_err.status_code == 400
            assert "CVAT Token không hợp lệ" in res_err.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 9. Kiểm thử CVAT Webhook Receiver với HMAC-SHA256
# ============================================================

@pytest.mark.asyncio
async def test_cvat_webhook_receiver_hmac_and_completion(async_client):
    """CVAT Webhook Receiver (Hỗ trợ cả 2 URL):
    - POST /api/v1/integrations/cvat/webhook
    - POST /api/v1/projects/cvat/webhook
    - Xác thực HMAC-SHA256: Sai signature -> 401 Unauthorized
    - Đúng signature: Sự kiện update:job hoàn thành -> job.status = COMPLETED, tăng frames, tăng total_annotated
    """
    annotator_user = create_mock_user(
        email=f"cvat_work_{uuid.uuid4().hex[:6]}@greensm.vn", 
        full_name="Nguyễn Văn Gán Nhãn",
        cvat_user_id=505,
        cvat_username="worker_505"
    )

    async with AsyncSessionLocal() as session:
        session.add(annotator_user)
        await session.commit()

    # Chuẩn bị Project, Task, Job với cvat_job_id ngẫu nhiên
    cvat_id_test = int(uuid.uuid4().int % 1000000)
    prj_id = f"PRJ-{uuid.uuid4().hex[:6].upper()}"

    async with AsyncSessionLocal() as session:
        prj = Project(
            id=prj_id,
            name="Dự án Test Webhook",
            visibility=ProjectVisibility.PUBLIC,
            campaign_type=CampaignType.ACTIVE_LEARNING_V3,
            status=ProjectStatus.ANNOTATING,
            total_frames=1000,
            annotated_frames=0
        )
        task = Task(
            project_id=prj.id,
            name="Task Webhook 1",
            status=TaskStatus.IN_PROGRESS
        )
        job = Job(
            task_id=task.id,
            name=f"Job Webhook {cvat_id_test}",
            status=JobStatus.IN_PROGRESS,
            image_count=250,
            annotated_frames=0,
            cvat_job_id=cvat_id_test
        )
        jm = JobMember(
            job_id=job.id,
            user_id=annotator_user.id,
            role=JobRole.ANNOTATOR
        )
        job.job_members.append(jm)
        task.jobs.append(job)
        prj.tasks.append(task)
        session.add(prj)
        await session.commit()

    webhook_payload = {
        "event": "update:job",
        "action": "updated",
        "job": {
            "id": cvat_id_test,
            "state": "completed",
            "stage": "acceptance"
        }
    }
    payload_bytes = json.dumps(webhook_payload).encode("utf-8")

    # 1. Gửi với SAI chữ ký HMAC -> 401
    bad_headers = {
        "Content-Type": "application/json",
        "X-Signature-256": "sha256=invalid_signature_hex_12345"
    }
    res_bad = await async_client.post("/api/v1/integrations/cvat/webhook", content=payload_bytes, headers=bad_headers)
    assert res_bad.status_code == 401

    # 2. Gửi với ĐÚNG chữ ký HMAC-SHA256
    correct_sig = hmac.new(
        settings.CVAT_WEBHOOK_SECRET.encode("utf-8"),
        msg=payload_bytes,
        digestmod=hashlib.sha256
    ).hexdigest()

    good_headers = {
        "Content-Type": "application/json",
        "X-Signature-256": f"sha256={correct_sig}"
    }

    # Test trên endpoint /api/v1/integrations/cvat/webhook
    res_ok = await async_client.post("/api/v1/integrations/cvat/webhook", content=payload_bytes, headers=good_headers)
    assert res_ok.status_code == 200
    resp_data = res_ok.json()["data"]
    assert resp_data["status"] == "COMPLETED"
    assert resp_data["annotated_frames"] == 250

    # Kiểm tra trong DB: Job, Project frames và User total_annotated đã cập nhật
    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        job_check = await session.execute(select(Job).where(Job.cvat_job_id == cvat_id_test))
        j_db = job_check.scalar_one()
        assert j_db.status == JobStatus.COMPLETED
        assert j_db.annotated_frames == 250

        u_check = await session.execute(select(User).where(User.id == annotator_user.id))
        u_db = u_check.scalar_one()
        assert u_db.total_annotated >= 250

    # Test thêm trên endpoint alias /api/v1/projects/cvat/webhook
    res_alias = await async_client.post("/api/v1/projects/cvat/webhook", content=payload_bytes, headers=good_headers)
    assert res_alias.status_code == 200


# ============================================================
# 10. Kiểm thử Ràng buộc Kiến trúc 2 Tầng: Phải là Member ACTIVE
# ============================================================

@pytest.mark.asyncio
async def test_hierarchy_strict_membership_required_for_task_lead_and_job_worker(async_client):
    """Kiểm tra nguyên tắc cốt lõi của Kiến trúc 2 Tầng:
    - Task Lead BẮT BUỘC phải là thành viên ACTIVE trong Member Pool của dự án (nếu không -> HTTP 400).
    - Job Worker BẮT BUỘC phải là thành viên ACTIVE trong Member Pool của dự án (nếu không -> HTTP 400).
    - Sau khi mời và accept -> phân công thành công.
    """
    lead = create_mock_user(email=f"arch_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Arch Lead")
    outsider = create_mock_user(email=f"outsider_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Người Ngoài Pool")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, outsider])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    try:
        # Lead tạo dự án
        res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Chuẩn 2 Tầng", "visibility": "PUBLIC"})
        assert res_p.status_code == 200
        project_id = res_p.json()["data"]["id"]

        # 1. Thử gán outsider (chưa thuộc Member Pool) làm Task Lead -> BỊ CHẶN 400!
        res_bad_task = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={
            "name": "Task 1 Lỗi",
            "lead_id": str(outsider.id)
        })
        assert res_bad_task.status_code == 400
        assert "ACTIVE" in res_bad_task.json()["detail"]

        # Tạo Task hợp lệ với lead là chính mình (creator)
        res_good_task = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={
            "name": "Task 1 Hợp Lệ",
            "lead_id": str(lead.id)
        })
        assert res_good_task.status_code == 200
        task_id = res_good_task.json()["data"]["id"]

        # Tạo Job
        res_j = await async_client.post(f"/api/v1/projects/tasks/{task_id}/jobs", json={"name": "Job 1", "image_count": 100})
        assert res_j.status_code == 200
        job_id = res_j.json()["data"]["id"]

        # 2. Thử gán outsider làm Job Worker -> BỊ CHẶN 400!
        res_bad_assign = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(outsider.id),
            "role": "ANNOTATOR"
        })
        assert res_bad_assign.status_code == 400
        assert "ACTIVE" in res_bad_assign.json()["detail"]

        # Mời outsider vào Member Pool
        res_inv = await async_client.post(f"/api/v1/projects/{project_id}/invitations", json={
            "user_id": str(outsider.id),
            "role": "PROJECT_MEMBER"
        })
        assert res_inv.status_code == 200
        inv_id = res_inv.json()["data"]["id"]

        # Outsider accept lời mời
        app.dependency_overrides[get_current_user] = lambda: outsider
        res_acc = await async_client.post(f"/api/v1/projects/invitations/{inv_id}/accept")
        assert res_acc.status_code == 200

        # Bây giờ Lead gán việc cho outsider -> THÀNH CÔNG!
        app.dependency_overrides[get_current_user] = lambda: lead
        res_good_assign = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(outsider.id),
            "role": "ANNOTATOR"
        })
        assert res_good_assign.status_code == 200
        assert any(m["user_id"] == str(outsider.id) for m in res_good_assign.json()["data"]["members"])

        # Outsider làm Task Lead cũng thành công!
        res_task_with_outsider = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={
            "name": "Task Do Outsider Quản Lý",
            "lead_id": str(outsider.id)
        })
        assert res_task_with_outsider.status_code == 200
        assert res_task_with_outsider.json()["data"]["lead_id"] == str(outsider.id)
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 11. Kiểm thử Idempotency của CVAT Webhook: Chống Double-Counting
# ============================================================

@pytest.mark.asyncio
async def test_cvat_webhook_idempotency_prevents_double_counting(async_client):
    """Khi CVAT webhook gửi lại nhiều lần cho cùng 1 job đã hoàn thành:
    - Lần 1: cập nhật status COMPLETED, cộng đúng số frame cho Job, Project và User.
    - Lần 2 (trùng lặp): Trả về Idempotent response, KHÔNG cộng lặp frame vào Project và User.
    """
    annotator = create_mock_user(email=f"idemp_ann_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Idempotent Annotator")
    async with AsyncSessionLocal() as session:
        session.add(annotator)
        await session.commit()

    cvat_job_id = int(uuid.uuid4().int % 1000000)
    prj_id = f"PRJ-{uuid.uuid4().hex[:6].upper()}"

    async with AsyncSessionLocal() as session:
        prj = Project(
            id=prj_id,
            name="Dự án Test Idempotency",
            visibility=ProjectVisibility.PUBLIC,
            campaign_type=CampaignType.ACTIVE_LEARNING_V3,
            status=ProjectStatus.ANNOTATING,
            total_frames=500,
            annotated_frames=0
        )
        task = Task(project_id=prj.id, name="Task Test Idempotency", status=TaskStatus.IN_PROGRESS)
        job = Job(
            task_id=task.id,
            name=f"Job Idempotency {cvat_job_id}",
            status=JobStatus.IN_PROGRESS,
            image_count=200,
            annotated_frames=0,
            cvat_job_id=cvat_job_id
        )
        jm = JobMember(job_id=job.id, user_id=annotator.id, role=JobRole.ANNOTATOR)
        job.job_members.append(jm)
        task.jobs.append(job)
        prj.tasks.append(task)
        session.add(prj)
        await session.commit()

    payload_data = {
        "event": "update:job",
        "action": "updated",
        "job": {"id": cvat_job_id, "state": "completed"}
    }
    payload_bytes = json.dumps(payload_data).encode("utf-8")
    sig = hmac.new(settings.CVAT_WEBHOOK_SECRET.encode("utf-8"), msg=payload_bytes, digestmod=hashlib.sha256).hexdigest()
    headers = {"Content-Type": "application/json", "X-Signature-256": f"sha256={sig}"}

    # Gửi webhook LẦN 1
    res1 = await async_client.post("/api/v1/integrations/cvat/webhook", content=payload_bytes, headers=headers)
    assert res1.status_code == 200
    assert res1.json()["data"]["annotated_frames"] == 200

    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        prj_db1 = (await session.execute(select(Project).where(Project.id == prj_id))).scalar_one()
        user_db1 = (await session.execute(select(User).where(User.id == annotator.id))).scalar_one()
        assert prj_db1.annotated_frames == 200
        assert user_db1.total_annotated == 200

    # Gửi webhook LẦN 2 (trùng lặp do retry mạng)
    res2 = await async_client.post("/api/v1/integrations/cvat/webhook", content=payload_bytes, headers=headers)
    assert res2.status_code == 200
    assert "Idempotent" in res2.json()["message"]

    # Kiểm tra trong DB: Tuyệt đối không bị nhân đôi lên 400 frames!
    async with AsyncSessionLocal() as session:
        prj_db2 = (await session.execute(select(Project).where(Project.id == prj_id))).scalar_one()
        user_db2 = (await session.execute(select(User).where(User.id == annotator.id))).scalar_one()
        assert prj_db2.annotated_frames == 200, "LỖI: Project frames bị cộng đúp khi nhận webhook lần 2!"
        assert user_db2.total_annotated == 200, "LỖI: User total_annotated bị cộng đúp khi nhận webhook lần 2!"


# ============================================================
# 12. Kiểm thử Webhook khi total_frames = 0 ban đầu
# ============================================================

@pytest.mark.asyncio
async def test_cvat_webhook_zero_total_frames_safe_upgrade(async_client):
    """Nếu dự án tạo mới với total_frames = 0, webhook hoàn thành Job 150 frames:
    - Không bị ép về 0 (như lỗi min(project.total_frames, ...)).
    - annotated_frames cập nhật thành 150, total_frames tự động nâng thành 150.
    """
    cvat_id = int(uuid.uuid4().int % 1000000)
    prj_id = f"PRJ-{uuid.uuid4().hex[:6].upper()}"

    async with AsyncSessionLocal() as session:
        prj = Project(
            id=prj_id,
            name="Dự án Không Đặt Trước Frames",
            visibility=ProjectVisibility.PUBLIC,
            campaign_type=CampaignType.ACTIVE_LEARNING_V3,
            status=ProjectStatus.ANNOTATING,
            total_frames=0,
            annotated_frames=0
        )
        task = Task(project_id=prj.id, name="Task Zero Frames", status=TaskStatus.IN_PROGRESS)
        job = Job(
            task_id=task.id,
            name="Job 150 Frames",
            status=JobStatus.IN_PROGRESS,
            image_count=150,
            annotated_frames=0,
            cvat_job_id=cvat_id
        )
        task.jobs.append(job)
        prj.tasks.append(task)
        session.add(prj)
        await session.commit()

    payload_data = {"event": "update:job", "job": {"id": cvat_id, "state": "completed"}}
    payload_bytes = json.dumps(payload_data).encode("utf-8")
    sig = hmac.new(settings.CVAT_WEBHOOK_SECRET.encode("utf-8"), msg=payload_bytes, digestmod=hashlib.sha256).hexdigest()
    headers = {"Content-Type": "application/json", "X-Signature-256": f"sha256={sig}"}

    res = await async_client.post("/api/v1/integrations/cvat/webhook", content=payload_bytes, headers=headers)
    assert res.status_code == 200

    async with AsyncSessionLocal() as session:
        from sqlalchemy.future import select
        prj_db = (await session.execute(select(Project).where(Project.id == prj_id))).scalar_one()
        assert prj_db.annotated_frames == 150, "annotated_frames phải là 150 chứ không được là 0"
        assert prj_db.total_frames >= 150


# ============================================================
# 13. Kiểm thử Tự động gọi CVAT Client Assign Job
# ============================================================

@pytest.mark.asyncio
async def test_cvat_client_auto_assign_job_invoked(async_client):
    """Khi phân công Job có cvat_job_id cho User có cvat_user_id:
    - cvat_client.assign_job phải được gọi tự động với đúng id.
    """
    lead = create_mock_user(email=f"cvat_assign_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead CVAT Assign")
    worker = create_mock_user(
        email=f"cvat_worker_linked_{uuid.uuid4().hex[:6]}@greensm.vn",
        full_name="Worker Linked CVAT",
        cvat_user_id=777,
        cvat_username="cvat_worker_777"
    )

    async with AsyncSessionLocal() as session:
        session.add_all([lead, worker])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    try:
        res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Auto Sync CVAT", "visibility": "PUBLIC"})
        project_id = res_p.json()["data"]["id"]

        # Thêm worker vào Member Pool ACTIVE
        async with AsyncSessionLocal() as session:
            m = ProjectMember(project_id=project_id, user_id=worker.id, role=ProjectRole.ANNOTATOR, status=MemberStatus.ACTIVE)
            session.add(m)
            await session.commit()

        res_t = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={"name": "Task Sync CVAT"})
        task_id = res_t.json()["data"]["id"]

        res_j = await async_client.post(f"/api/v1/projects/tasks/{task_id}/jobs", json={
            "name": "Job Sync CVAT #9999",
            "image_count": 80,
            "cvat_job_id": 9999
        })
        job_id = res_j.json()["data"]["id"]

        # Mock cvat_client.assign_job để xác thực việc gọi đồng bộ
        with patch.object(cvat_client, "assign_job", new_callable=AsyncMock) as mock_assign:
            mock_assign.return_value = {"success": True}

            res_assign = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
                "user_id": str(worker.id),
                "role": "ANNOTATOR"
            })
            assert res_assign.status_code == 200

            # Xác thực client đã gọi assign_job với cvat_job_id=9999 và assignee_id=777
            mock_assign.assert_called_once()
            call_kwargs = mock_assign.call_args.kwargs
            assert call_kwargs["cvat_job_id"] == 9999
            assert call_kwargs["assignee_id"] == 777
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 14. Kiểm thử In-App Invitation Dashboard: Chi tiết Job & Deadline
# ============================================================

@pytest.mark.asyncio
async def test_in_app_invitation_dashboard_comprehensive_info(async_client):
    """GET /api/v1/projects/invitations/me:
    - Phải trả về đúng jobs_count > 0
    - Danh sách jobs chứa tên, số ảnh, cvat_url
    - Thông tin invited_by_name đầy đủ
    """
    lead = create_mock_user(email=f"dash_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Nguyễn Văn A")
    invitee = create_mock_user(email=f"dash_inv_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Ứng Viên B")

    async with AsyncSessionLocal() as session:
        session.add_all([lead, invitee])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    try:
        res_p = await async_client.post("/api/v1/projects", json={
            "name": "Dự án Lời Mời Chi Tiết",
            "description": "Chiến dịch gán nhãn radar & camera",
            "visibility": "PUBLIC"
        })
        project_id = res_p.json()["data"]["id"]

        res_t = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={"name": "Task Mẫu"})
        task_id = res_t.json()["data"]["id"]

        await async_client.post(f"/api/v1/projects/tasks/{task_id}/jobs", json={
            "name": "Job Khung 1-50",
            "image_count": 50,
            "cvat_job_id": 5555
        })

        # Lead gửi lời mời tới invitee
        res_inv = await async_client.post(f"/api/v1/projects/{project_id}/invitations", json={
            "user_id": str(invitee.id),
            "role": "ANNOTATOR"
        })
        assert res_inv.status_code == 200
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Invitee kiểm tra dashboard
    app.dependency_overrides[get_current_user] = lambda: invitee
    try:
        res_dash = await async_client.get("/api/v1/projects/invitations/me")
        assert res_dash.status_code == 200
        invs = res_dash.json()["data"]
        target_inv = next((i for i in invs if i["project_id"] == project_id), None)
        assert target_inv is not None
        assert target_inv["jobs_count"] >= 1
        assert target_inv["invited_by_name"] == "Lead Nguyễn Văn A"
        assert target_inv["project_description"] == "Chiến dịch gán nhãn radar & camera"
        assert len(target_inv["jobs"]) >= 1
        assert target_inv["jobs"][0]["name"] == "Job Khung 1-50"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


# ============================================================
# 15. Kiểm thử Quản trị Member REMOVED, Unassign Job và Auth CVAT-Token Cleanup
# ============================================================

@pytest.mark.asyncio
async def test_member_removal_and_job_unassignment_and_auth_cleanup(async_client):
    """Kiểm tra:
    - DELETE /projects/{p_id}/members/{m_id} -> Member chuyển thành REMOVED
    - DELETE /projects/jobs/{j_id}/members/{u_id} -> Gỡ worker khỏi Job
    - DELETE /api/v1/auth/me/cvat-token -> Xóa token CVAT an toàn
    - DELETE /projects/{p_id} -> Xóa dự án thành công
    """
    lead = create_mock_user(email=f"mgr_lead_{uuid.uuid4().hex[:6]}@greensm.vn", full_name="Lead Quản Trị")
    worker = create_mock_user(
        email=f"mgr_worker_{uuid.uuid4().hex[:6]}@greensm.vn", 
        full_name="Worker Quản Trị",
        cvat_user_id=123,
        cvat_username="user_123"
    )

    async with AsyncSessionLocal() as session:
        session.add_all([lead, worker])
        await session.commit()

    app.dependency_overrides[get_current_user] = lambda: lead
    try:
        res_p = await async_client.post("/api/v1/projects", json={"name": "Dự án Vòng Đời", "visibility": "PUBLIC"})
        project_id = res_p.json()["data"]["id"]

        # Thêm worker vào member pool
        async with AsyncSessionLocal() as session:
            m = ProjectMember(project_id=project_id, user_id=worker.id, role=ProjectRole.ANNOTATOR, status=MemberStatus.ACTIVE)
            session.add(m)
            await session.commit()
            m_id = m.id

        res_t = await async_client.post(f"/api/v1/projects/{project_id}/tasks", json={"name": "Task Vòng Đời"})
        task_id = res_t.json()["data"]["id"]

        res_j = await async_client.post(f"/api/v1/projects/tasks/{task_id}/jobs", json={"name": "Job Vòng Đời", "image_count": 40})
        job_id = res_j.json()["data"]["id"]

        # Gán worker vào job
        res_assign = await async_client.post(f"/api/v1/projects/jobs/{job_id}/assign", json={
            "user_id": str(worker.id),
            "role": "ANNOTATOR"
        })
        assert res_assign.status_code == 200
        assert len(res_assign.json()["data"]["members"]) == 1

        # Gỡ worker khỏi job
        res_unassign = await async_client.delete(f"/api/v1/projects/jobs/{job_id}/members/{worker.id}")
        assert res_unassign.status_code == 200
        assert len(res_unassign.json()["data"]["members"]) == 0

        # Loại worker ra khỏi dự án -> REMOVED
        res_rem = await async_client.delete(f"/api/v1/projects/{project_id}/members/{m_id}")
        assert res_rem.status_code == 200
        assert res_rem.json()["data"]["status"] == "REMOVED"

        # Xóa Job
        res_del_j = await async_client.delete(f"/api/v1/projects/jobs/{job_id}")
        assert res_del_j.status_code == 200

        # Xóa Task
        res_del_t = await async_client.delete(f"/api/v1/projects/tasks/{task_id}")
        assert res_del_t.status_code == 200

        # Xóa Project
        res_del_p = await async_client.delete(f"/api/v1/projects/{project_id}")
        assert res_del_p.status_code == 200

        # Xác nhận Project không còn tồn tại
        res_get_p = await async_client.get(f"/api/v1/projects/{project_id}")
        assert res_get_p.status_code == 404
    finally:
        app.dependency_overrides.pop(get_current_user, None)

    # Worker xóa kết nối CVAT token
    app.dependency_overrides[get_current_user] = lambda: worker
    try:
        res_del_cvat = await async_client.delete("/api/v1/auth/me/cvat-token")
        assert res_del_cvat.status_code == 200
        assert res_del_cvat.json()["data"]["success"] is True

        # Kiểm tra trong DB
        async with AsyncSessionLocal() as session:
            from sqlalchemy.future import select
            u_db = (await session.execute(select(User).where(User.id == worker.id))).scalar_one()
            assert u_db.cvat_token is None
            assert u_db.cvat_user_id is None
    finally:
        app.dependency_overrides.pop(get_current_user, None)
