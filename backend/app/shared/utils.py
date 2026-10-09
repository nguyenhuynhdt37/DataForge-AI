import hashlib
from pathlib import Path
from typing import List, Tuple

# 5 Danh mục Phương tiện Cốt lõi của GreenSM
CLASS_NAMES = ["greensm", "car", "motorcycle", "bus", "truck"]
CLASS_COLORS = {
    0: "#10B981", # GreenSM (Cyan/Emerald lục dạ quang)
    1: "#3B82F6", # Car (Xanh lam)
    2: "#F97316", # Motorcycle (Cam)
    3: "#8B5CF6", # Bus (Tím)
    4: "#F59E0B"  # Truck (Hổ phách)
}

def calculate_file_hash(file_path: Path) -> str:
    """Tính mã băm SHA-256 để đảm bảo tính bất biến của tập dữ liệu"""
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            sha256.update(chunk)
    return sha256.hexdigest()

def yolo_to_xyxy(xc: float, yc: float, w: float, h: float, img_w: int, img_h: int) -> Tuple[int, int, int, int]:
    """Chuyển đổi tọa độ YOLO normalized sang pixel tuyệt đối (x1, y1, x2, y2)"""
    x1 = int((xc - w / 2) * img_w)
    y1 = int((yc - h / 2) * img_h)
    x2 = int((xc + w / 2) * img_w)
    y2 = int((yc + h / 2) * img_h)
    return max(0, x1), max(0, y1), min(img_w, x2), min(img_h, y2)

def xyxy_to_yolo(x1: int, y1: int, x2: int, y2: int, img_w: int, img_h: int) -> Tuple[float, float, float, float]:
    """Chuyển đổi tọa độ pixel sang tọa độ chuẩn YOLO [0, 1]"""
    xc = ((x1 + x2) / 2.0) / img_w
    yc = ((y1 + y2) / 2.0) / img_h
    w = (x2 - x1) / float(img_w)
    h = (y2 - y1) / float(img_h)
    return round(xc, 5), round(yc, 5), round(w, 5), round(h, 5)
