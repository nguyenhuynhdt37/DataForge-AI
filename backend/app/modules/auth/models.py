import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # --- Hồ sơ Năng lực & Thông tin Cá nhân ---
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # VD: Senior AI Engineer, Data Labeler
    total_annotated: Mapped[int] = mapped_column(Integer, default=0) # Tổng số box đã dán
    accuracy_rate: Mapped[float] = mapped_column(Float, default=1.0) # Tỷ lệ QA duyệt đúng (1.0 = 100%)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # --- Relationships ---
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    project_memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan")
    job_assignments = relationship("JobMember", back_populates="user", cascade="all, delete-orphan")
    annotations_made = relationship("AnnotationBox", back_populates="annotator")

class UserSession(Base):
    """Quản lý Phiên đăng nhập & Quản lý thiết bị (Active Sessions)"""
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    # JWT ID duy nhất của Refresh Token (Dùng để thu hồi phiên / Đá thiết bị)
    refresh_token_jti: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True) # VD: Chrome 126 trên macOS
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True) # Hỗ trợ cả IPv4 và IPv6
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False) # True = Phiên đã bị hủy
    
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship(back_populates="sessions")
