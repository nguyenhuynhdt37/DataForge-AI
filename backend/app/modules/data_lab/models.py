import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum

class SliceTag(str, enum.Enum):
    NIGHT = "NIGHT"
    SMALL_OBJECT = "SMALL_OBJECT"
    OCCLUSION = "OCCLUSION"
    BLUR = "BLUR"
    DENSE = "DENSE"
    NORMAL = "NORMAL"

class DatasetImage(Base):
    __tablename__ = "dataset_images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    job_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("jobs.id", ondelete="SET NULL"), nullable=True)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    phash: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    slice_tag: Mapped[SliceTag] = mapped_column(SQLEnum(SliceTag), default=SliceTag.NORMAL)
    active_score: Mapped[Optional[float]] = mapped_column(Float)

    job = relationship("app.modules.projects.models.Job", back_populates="images")
    annotations = relationship("app.modules.hitl_studio.models.AnnotationBox", back_populates="image", cascade="all, delete-orphan")
