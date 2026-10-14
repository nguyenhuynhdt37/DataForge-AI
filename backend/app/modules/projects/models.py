import uuid
import enum
from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, ForeignKey, Enum as SQLEnum, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

# ============================================================
# 100% Constant Keys Enums (Upper Snake Case)
# ============================================================

class ProjectVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    PRIVATE = "PRIVATE"

class CampaignType(str, enum.Enum):
    ACTIVE_LEARNING_V3 = "ACTIVE_LEARNING_V3"
    HARD_SLICE_CURATION = "HARD_SLICE_CURATION"
    EDGE_BENCHMARK = "EDGE_BENCHMARK"
    ZERO_SHOT_DISCOVERY = "ZERO_SHOT_DISCOVERY"

class ProjectStatus(str, enum.Enum):
    INITIALIZING = "INITIALIZING"
    ANNOTATING = "ANNOTATING"
    UNDER_QA = "UNDER_QA"
    TRAINING = "TRAINING"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ProjectRole(str, enum.Enum):
    PROJECT_LEAD = "PROJECT_LEAD"
    QA_REVIEWER = "QA_REVIEWER"
    ANNOTATOR = "ANNOTATOR"
    PROJECT_MEMBER = "PROJECT_MEMBER"

class MemberStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    PENDING_ACCEPTANCE = "PENDING_ACCEPTANCE"
    ACTIVE = "ACTIVE"
    REJECTED = "REJECTED"
    REMOVED = "REMOVED"

class TaskStatus(str, enum.Enum):
    SAMPLING = "SAMPLING"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_QA = "UNDER_QA"
    COMPLETED = "COMPLETED"

class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    UNDER_QA = "UNDER_QA"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class JobRole(str, enum.Enum):
    ANNOTATOR = "ANNOTATOR"
    QA_REVIEWER = "QA_REVIEWER"


# ============================================================
# Database Models
# ============================================================

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    visibility: Mapped[ProjectVisibility] = mapped_column(
        SQLEnum(ProjectVisibility, native_enum=False), 
        default=ProjectVisibility.PUBLIC, 
        nullable=False
    )
    campaign_type: Mapped[CampaignType] = mapped_column(
        SQLEnum(CampaignType, native_enum=False), 
        default=CampaignType.ACTIVE_LEARNING_V3, 
        nullable=False
    )
    status: Mapped[ProjectStatus] = mapped_column(
        SQLEnum(ProjectStatus, native_enum=False), 
        default=ProjectStatus.INITIALIZING, 
        nullable=False
    )
    
    created_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True
    )
    total_frames: Mapped[int] = mapped_column(Integer, default=0)
    annotated_frames: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    created_by = relationship("User", foreign_keys=[created_by_id])
    members = relationship("ProjectMember", back_populates="project", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")


class ProjectMember(Base):
    __tablename__ = "project_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    role: Mapped[ProjectRole] = mapped_column(
        SQLEnum(ProjectRole), 
        default=ProjectRole.PROJECT_MEMBER, 
        nullable=False
    )
    status: Mapped[MemberStatus] = mapped_column(
        SQLEnum(MemberStatus), 
        default=MemberStatus.ACTIVE, 
        nullable=False
    )
    invited_by_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        nullable=True
    )

    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships", foreign_keys=[user_id])
    invited_by = relationship("User", foreign_keys=[invited_by_id])


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    status: Mapped[TaskStatus] = mapped_column(
        SQLEnum(TaskStatus), 
        default=TaskStatus.SAMPLING, 
        nullable=False
    )
    lead_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), 
        index=True, 
        nullable=True
    )
    total_sampled_images: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="tasks")
    lead = relationship("User", foreign_keys=[lead_id])
    jobs = relationship("Job", back_populates="task", cascade="all, delete-orphan")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("tasks.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    
    status: Mapped[JobStatus] = mapped_column(
        SQLEnum(JobStatus), 
        default=JobStatus.PENDING, 
        nullable=False
    )
    image_count: Mapped[int] = mapped_column(Integer, default=0)
    annotated_frames: Mapped[int] = mapped_column(Integer, default=0)
    
    cvat_job_id: Mapped[Optional[int]] = mapped_column(Integer, index=True, nullable=True)
    cvat_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    task = relationship("Task", back_populates="jobs")
    job_members = relationship("JobMember", back_populates="job", cascade="all, delete-orphan")


class JobMember(Base):
    __tablename__ = "job_members"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    role: Mapped[JobRole] = mapped_column(
        SQLEnum(JobRole), 
        nullable=False
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    job = relationship("Job", back_populates="job_members")
    user = relationship("User", back_populates="job_assignments", foreign_keys=[user_id])
