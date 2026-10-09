from fastapi import APIRouter
from app.shared.schemas import ApiResponse
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/benchmark", tags=["Benchmark"])

class AbMatrixRow(BaseModel):
    branch_name: str
    map_score: float
    map_small: float
    map_night: float
    annotation_cost_hours: float
    roi_score: str

@router.get("/matrix", response_model=ApiResponse[List[AbMatrixRow]])
async def get_benchmark_matrix():
    data = [
        AbMatrixRow(branch_name="Nhánh 1 (V0_Seed)", map_score=0.68, map_small=0.52, map_night=0.58, annotation_cost_hours=15, roi_score="Baseline"),
        AbMatrixRow(branch_name="Nhánh 2 (Random 300)", map_score=0.70, map_small=0.53, map_night=0.60, annotation_cost_hours=18, roi_score="Thấp"),
        AbMatrixRow(branch_name="Nhánh 3 (Active 300)", map_score=0.76, map_small=0.68, map_night=0.71, annotation_cost_hours=18, roi_score="Cao nhất (Đạt mục tiêu)"),
        AbMatrixRow(branch_name="Nhánh 4 (Full Manual 1800)", map_score=0.78, map_small=0.69, map_night=0.72, annotation_cost_hours=110, roi_score="Kém (Quá tốn kém)"),
    ]
    return ApiResponse(message="Lấy kết quả ma trận A/B thành công", data=data)
