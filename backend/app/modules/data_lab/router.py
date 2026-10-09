from fastapi import APIRouter
from app.shared.schemas import ApiResponse
from app.modules.data_lab.schemas import DataLabStats
from app.modules.data_lab.service import data_lab_service

router = APIRouter(prefix="/data-lab", tags=["Data Lab"])

@router.get("/stats", response_model=ApiResponse[DataLabStats])
async def get_data_lab_stats():
    stats = data_lab_service.get_stats()
    return ApiResponse(message="Lấy thống kê Data Lab thành công", data=stats)
