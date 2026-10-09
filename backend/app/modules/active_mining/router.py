from fastapi import APIRouter, Depends
from app.shared.schemas import ApiResponse
from app.modules.active_mining.schemas import PcaScatterResponse, WeightConfig
from app.modules.active_mining.service import active_mining_service

router = APIRouter(prefix="/active-mining", tags=["Active Mining"])

@router.post("/pca-points", response_model=ApiResponse[PcaScatterResponse])
async def get_pca_points(config: WeightConfig):
    # Nhận cấu hình thanh trượt từ Frontend và trả về tọa độ đồ thị
    data = active_mining_service.generate_mock_pca_points(config)
    return ApiResponse(message="Cập nhật biểu đồ PCA thành công", data=data)
