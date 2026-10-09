from pydantic import BaseModel
from typing import List

class PcaPoint(BaseModel):
    id: str
    x: float
    y: float
    active_score: float
    slice_tag: str
    image_url: str

class PcaScatterResponse(BaseModel):
    points: List[PcaPoint]
    total_points: int
    variance_explained: float

class WeightConfig(BaseModel):
    uncertainty_weight: float = 1.0  # U_i
    slice_weight: float = 1.0        # W_i
    diversity_weight: float = 1.0    # A_i
    ease_of_label_weight: float = 1.0# E_i
