from fastapi import APIRouter
from app.shared.schemas import ApiResponse
from pydantic import BaseModel

router = APIRouter(prefix="/training", tags=["Training"])

class TrainStatus(BaseModel):
    is_training: bool
    current_epoch: int
    total_epochs: int
    latest_loss: float
    mAP: float

@router.post("/start", response_model=ApiResponse[str])
async def start_training():
    # Trong thực tế sẽ đẩy vào Background Task chạy YOLO11n với config Class-weighted Loss
    return ApiResponse(message="Đã kích hoạt tiến trình huấn luyện mô hình V1 qua Background Worker", data="task_id_12345")

@router.get("/status", response_model=ApiResponse[TrainStatus])
async def get_training_status():
    return ApiResponse(
        message="Trạng thái huấn luyện hiện tại",
        data=TrainStatus(is_training=True, current_epoch=24, total_epochs=50, latest_loss=1.84, mAP=0.68)
    )
