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
    
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    total_annotated: Mapped[int] = mapped_column(Integer, default=0)
    accuracy_rate: Mapped[float] = mapped_column(Float, default=1.0)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    is_first_login: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # CVAT Host Credentials & Profile Metadata
    cvat_token: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    cvat_user_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    cvat_username: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cvat_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cvat_first_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cvat_last_name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    cvat_groups: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    cvat_is_staff: Mapped[bool] = mapped_column(Boolean, default=False)

    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # --- Relationships ---
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    project_memberships = relationship("ProjectMember", back_populates="user", cascade="all, delete-orphan", foreign_keys="ProjectMember.user_id")
    job_assignments = relationship("JobMember", back_populates="user", cascade="all, delete-orphan")

class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    
    refresh_token_jti: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    
    user_agent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="sessions")
