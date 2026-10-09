import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import ForeignKey, Boolean, DateTime, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.core.database import Base

class AnnotationBox(Base):
    __tablename__ = "annotation_boxes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    image_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dataset_images.id", ondelete="CASCADE"))
    annotator_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    
    class_id: Mapped[int] = mapped_column(Integer, nullable=False)
    x_center: Mapped[float] = mapped_column(Float, nullable=False)
    y_center: Mapped[float] = mapped_column(Float, nullable=False)
    width: Mapped[float] = mapped_column(Float, nullable=False)
    height: Mapped[float] = mapped_column(Float, nullable=False)
    
    is_auto_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    image = relationship("app.modules.data_lab.models.DatasetImage", back_populates="annotations")
    annotator = relationship("app.modules.auth.models.User", back_populates="annotations_made")
