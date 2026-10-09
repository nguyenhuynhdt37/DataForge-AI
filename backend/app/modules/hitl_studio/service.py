from app.modules.hitl_studio.schemas import LabelTask, AnnotationBox
from app.modules.hitl_studio.rag_guideline import GuidelineRagAssistant
from app.core.config import settings

class HitlStudioService:
    @staticmethod
    def get_current_task() -> LabelTask:
        # Cung cấp 1 task mẫu trực quan có sẵn BBoxes mồi
        return LabelTask(
            image_id="frame_0492",
            image_url="/datasets/pool_unlabeled/frame_0492.jpg",
            image_width=1280,
            image_height=720,
            slice_tag="Night Slice",
            iou_consensus=0.88,
            boxes=[
                AnnotationBox(
                    id="b1",
                    class_id=0,
                    class_name="greensm",
                    xc=0.345,
                    yc=0.520,
                    w=0.180,
                    h=0.140,
                    confidence=0.92,
                    is_auto_verified=True
                ),
                AnnotationBox(
                    id="b2",
                    class_id=2,
                    class_name="motorcycle",
                    xc=0.510,
                    yc=0.580,
                    w=0.065,
                    h=0.110,
                    confidence=0.87,
                    is_auto_verified=True
                ),
                AnnotationBox(
                    id="b3",
                    class_id=1,
                    class_name="car",
                    xc=0.720,
                    yc=0.490,
                    w=0.150,
                    h=0.120,
                    confidence=0.64,
                    is_auto_verified=False # Cần con người kiểm tra (Review Needed)
                )
            ]
        )

    @staticmethod
    def save_annotation(image_id: str, boxes: list[AnnotationBox]) -> bool:
        # Ghi file YOLO format vào datasets/splits/train_v1
        output_dir = settings.DATASETS_DIR / "splits" / "train_v1"
        output_dir.mkdir(parents=True, exist_ok=True)
        txt_path = output_dir / f"{image_id}.txt"
        with open(txt_path, "w") as f:
            for b in boxes:
                f.write(f"{b.class_id} {b.xc:.6f} {b.yc:.6f} {b.w:.6f} {b.h:.6f}\n")
        return True

hitl_studio_service = HitlStudioService()
