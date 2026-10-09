from pydantic import BaseModel, Field
from typing import List, Optional

class AnnotationBox(BaseModel):
    id: str
    class_id: int          # 0: greensm, 1: car, 2: motorcycle, 3: bus, 4: truck
    class_name: str
    xc: float              # 0.0 -> 1.0 (YOLO Normalized)
    yc: float
    w: float
    h: float
    confidence: float = 1.0
    is_auto_verified: bool = False # Thuộc Tier 1 (IoU >= 0.7) hay Tier 2

class LabelTask(BaseModel):
    image_id: str
    image_url: str
    image_width: int = 1280
    image_height: int = 720
    slice_tag: str
    iou_consensus: float   # Độ đồng thuận giữa YOLO11n và RT-DETR
    boxes: List[AnnotationBox]

class SaveAnnotationRequest(BaseModel):
    image_id: str
    boxes: List[AnnotationBox]

class ChatPromptRequest(BaseModel):
    question: str

class ChatPromptResponse(BaseModel):
    answer: str
    source_clause: Optional[str] = None
