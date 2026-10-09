class ConsensusEngine:
    """Kiểm tra độ đồng thuận (IoU) giữa 2 mô hình YOLO11n và RT-DETR"""
    @staticmethod
    def calculate_iou(box1: list[float], box2: list[float]) -> float:
        # box: [xc, yc, w, h]
        x1_a, y1_a = box1[0] - box1[2] / 2, box1[1] - box1[3] / 2
        x2_a, y2_a = box1[0] + box1[2] / 2, box1[1] + box1[3] / 2
        x1_b, y1_b = box2[0] - box2[2] / 2, box2[1] - box2[3] / 2
        x2_b, y2_b = box2[0] + box2[2] / 2, box2[1] + box2[3] / 2

        inter_x1 = max(x1_a, x1_b)
        inter_y1 = max(y1_a, y1_b)
        inter_x2 = min(x2_a, x2_b)
        inter_y2 = min(y2_a, y2_b)

        inter_area = max(0, inter_x2 - inter_x1) * max(0, inter_y2 - inter_y1)
        area_a = box1[2] * box1[3]
        area_b = box2[2] * box2[3]
        union_area = area_a + area_b - inter_area

        if union_area <= 0:
            return 0.0
        return inter_area / union_area
