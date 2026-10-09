from app.modules.data_lab.schemas import DataLabStats, SliceMetric
from app.core.config import settings

class DataLabService:
    @staticmethod
    def get_stats() -> DataLabStats:
        # Dữ liệu thống kê dựa trên cấu trúc kho datasets/ và thực nghiệm V4
        return DataLabStats(
            total_raw_images=2450,
            unlabeled_pool_count=1840,
            duplicates_removed=610,
            dedup_ratio_percent=24.9,
            slices=[
                SliceMetric(slice_name="Night Slice", image_count=420, percentage=22.8, map_score=0.642),
                SliceMetric(slice_name="Small Object (<32px)", image_count=510, percentage=27.7, map_score=0.589),
                SliceMetric(slice_name="Occlusion (Che khuất)", image_count=380, percentage=20.6, map_score=0.615),
                SliceMetric(slice_name="Dense Traffic (Ùn ứ)", image_count=320, percentage=17.4, map_score=0.690),
                SliceMetric(slice_name="Motion Blur", image_count=210, percentage=11.4, map_score=0.551),
            ]
        )

data_lab_service = DataLabService()
