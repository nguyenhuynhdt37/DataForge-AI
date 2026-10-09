from pydantic import BaseModel, Field
from typing import List, Dict

class SliceMetric(BaseModel):
    slice_name: str       # Night, Blur, Small Object, Occlusion, Dense Traffic
    image_count: int
    percentage: float
    map_score: float

class DataLabStats(BaseModel):
    total_raw_images: int
    unlabeled_pool_count: int
    duplicates_removed: int
    dedup_ratio_percent: float
    slices: List[SliceMetric]

class DedupCluster(BaseModel):
    cluster_id: str
    representative_image: str
    duplicates_count: int
    similarity_score: float
