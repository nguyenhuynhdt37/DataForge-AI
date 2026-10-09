import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Integer, Float, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

# ==========================================
# 1. ENUMS (Chuẩn hóa toàn bộ trạng thái hệ thống)
# ==========================================

class ProjectRole(str, enum.Enum):
    PROJECT_LEAD = "PROJECT_LEAD"       # Admin của dự án, quyền sinh sát
    PROJECT_MEMBER = "PROJECT_MEMBER"   # Kỹ sư, Thợ dán nhãn của dự án

class TaskStatus(str, enum.Enum):
    SAMPLING = "SAMPLING"               # Hệ thống AI đang quét lấy 10% ảnh khó
    PENDING_SPLIT = "PENDING_SPLIT"     # Đã gom đủ ảnh, chờ Lead bấm nút chia Job
    IN_PROGRESS = "IN_PROGRESS"         # Đang trong quá trình dán nhãn
    COMPLETED = "COMPLETED"             # Hoàn tất, sẵn sàng export

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"                 # Chờ Annotator nhận việc
    ANNOTATING = "ANNOTATING"           # Annotator đang làm
    UNDER_QA = "UNDER_QA"               # Đã nộp, chờ QA duyệt
    REJECTED = "REJECTED"               # QA trả về bắt sửa lại
    APPROVED = "APPROVED"               # Đạt chuẩn

class JobRole(str, enum.Enum):
    ANNOTATOR = "ANNOTATOR"             # Người dán nhãn Bounding Box
    QA_REVIEWER = "QA_REVIEWER"         # Người kiểm định chất lượng

class SliceTag(str, enum.Enum):
    NIGHT = "NIGHT"
    SMALL_OBJECT = "SMALL_OBJECT"
    OCCLUSION = "OCCLUSION"
    BLUR = "BLUR"
    DENSE = "DENSE"
    NORMAL = "NORMAL"

# ==========================================
# 2. HỆ THỐNG QUẢN TRỊ TÀI KHOẢN & DỰ ÁN
# ==========================================

class User(Base):
    """Mọi tài khoản đều bình đẳng, không có Super Admin ở cấp hệ thống"""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project_memberships: Mapped[List["ProjectMember"]] = relationship(back_populates="user")
    job_assignments: Mapped[List["JobMember"]] = relationship(back_populates="user")
    annotations_made: Mapped[List["AnnotationBox"]] = relationship(back_populates="annotator")

class Project(Base):
    """Một bài toán AI lớn (VD: Phân tích hành vi tài xế, Nhận diện xe GreenSM)"""
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(50), primary_key=True) # VD: PRJ-GSM-2026
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    members: Mapped[List["ProjectMember"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship(back_populates="project", cascade="all, delete-orphan")

class ProjectMember(Base):
    """Quyền lực được quyết định ở cấp độ Dự án (Sếp ở dự án A, lính ở dự án B)"""
    __tablename__ = "project_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[ProjectRole] = mapped_column(SQLEnum(ProjectRole), nullable=False)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="project_memberships")

# ==========================================
# 3. HỆ THỐNG ĐIỀU PHỐI VÒNG LẶP & CÔNG VIỆC
# ==========================================

class Task(Base):
    """Một lần chích xuất Dataset bằng Active Learning (VD: Vòng lặp V1 lấy 10% ảnh khó)"""
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False) # VD: AL Cycle 1
    status: Mapped[TaskStatus] = mapped_column(SQLEnum(TaskStatus), default=TaskStatus.SAMPLING)
    total_sampled_images: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="tasks")
    jobs: Mapped[List["Job"]] = relationship(back_populates="task", cascade="all, delete-orphan")

class Job(Base):
    """Gói công việc 50 ảnh được băm nhỏ từ Task để giao cho con người làm song song"""
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False) # VD: Job 01 - Đêm
    status: Mapped[JobStatus] = mapped_column(SQLEnum(JobStatus), default=JobStatus.PENDING)
    image_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    task: Mapped["Task"] = relationship(back_populates="jobs")
    job_members: Mapped[List["JobMember"]] = relationship(back_populates="job", cascade="all, delete-orphan")
    images: Mapped[List["DatasetImage"]] = relationship(back_populates="job")

class JobMember(Base):
    """Bảng kiểm soát tiến trình - Ai là Annotator, Ai là QA Reviewer trong Job này"""
    __tablename__ = "job_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[JobRole] = mapped_column(SQLEnum(JobRole), nullable=False)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    job: Mapped["Job"] = relationship(back_populates="job_members")
    user: Mapped["User"] = relationship(back_populates="job_assignments")

# ==========================================
# 4. HỆ THỐNG LƯU VẾT ẢNH & NHÃN (DATA LINEAGE)
# ==========================================

class DatasetImage(Base):
    """Bức ảnh được gắn chặt vào Job, có metadata pHash chống trùng và điểm AI"""
    __tablename__ = "dataset_images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    phash: Mapped[Optional[str]] = mapped_column(String(64), index=True) # Phục vụ O(1) Dedup search
    slice_tag: Mapped[SliceTag] = mapped_column(SQLEnum(SliceTag), default=SliceTag.NORMAL)
    active_score: Mapped[Optional[float]] = mapped_column(Float) # Điểm khó do AI chấm

    # Relationships
    job: Mapped["Job"] = relationship(back_populates="images")
    annotations: Mapped[List["AnnotationBox"]] = relationship(back_populates="image", cascade="all, delete-orphan")

class AnnotationBox(Base):
    """Tọa độ khung chữ nhật chuẩn YOLO, có lưu lại định danh người sửa cuối cùng (Audit Trail)"""
    __tablename__ = "annotation_boxes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    image_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dataset_images.id", ondelete="CASCADE"))
    annotator_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    
    class_id: Mapped[int] = mapped_column(Integer, nullable=False) # 0: greensm, 1: car...
    x_center: Mapped[float] = mapped_column(Float, nullable=False)
    y_center: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    
    is_auto_verified: Mapped[bool] = mapped_column(Boolean, default=False) # True nếu máy tự duyệt (IoU cao)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    image: Mapped["DatasetImage"] = relationship(back_populates="annotations")
    annotator: Mapped["User"] = relationship(back_populates="annotations_made")
