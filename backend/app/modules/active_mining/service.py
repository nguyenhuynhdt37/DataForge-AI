import random
from app.modules.active_mining.schemas import PcaScatterResponse, PcaPoint, WeightConfig
from app.modules.active_mining.scorer import ActiveScorer

class ActiveMiningService:
    @staticmethod
    def generate_mock_pca_points(weights: WeightConfig) -> PcaScatterResponse:
        points = []
        tags = ["Night", "Small Object", "Occlusion", "Dense Traffic", "Normal"]
        
        # Tạo 500 điểm ngẫu nhiên biểu diễn không gian 2D cho Canvas Frontend
        for i in range(500):
            # Tọa độ phân tán quanh tâm (0,0) độ lệch chuẩn 10
            x = random.gauss(0, 10)
            y = random.gauss(0, 10)
            tag = random.choice(tags)
            
            # Tính mock score bị ảnh hưởng bởi thanh trượt trọng số
            base_u = random.uniform(0.1, 0.9)
            base_w = 1.5 if tag != "Normal" else 1.0
            base_a = random.uniform(0.5, 1.0)
            base_e = random.uniform(0.5, 1.5)
            
            score = ActiveScorer.compute_score(
                base_u * weights.uncertainty_weight,
                base_w * weights.slice_weight,
                base_a * weights.diversity_weight,
                base_e * weights.ease_of_label_weight
            )
            
            points.append(PcaPoint(
                id=f"img_{i:04d}",
                x=round(x, 2),
                y=round(y, 2),
                active_score=round(score, 3),
                slice_tag=tag,
                image_url=f"/datasets/pool_unlabeled/img_{i:04d}.jpg"
            ))
            
        return PcaScatterResponse(
            points=points,
            total_points=500,
            variance_explained=0.785
        )

active_mining_service = ActiveMiningService()
