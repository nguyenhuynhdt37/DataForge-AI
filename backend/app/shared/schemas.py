from typing import Generic, TypeVar, Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = "Thao tác thành công"
    data: Optional[T] = None
    error_code: Optional[str] = None
    detail: Optional[Any] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class PaginatedData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
    total_pages: int

class TaskProgressEvent(BaseModel):
    task_id: str
    task_name: str
    progress: float  # 0.0 -> 100.0
    status: str      # pending, running, completed, failed
    message: str
    metadata: dict[str, Any] = Field(default_factory=dict)
