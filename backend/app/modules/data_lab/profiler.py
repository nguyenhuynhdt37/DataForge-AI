import cv2
import numpy as np
from pathlib import Path

class ImageProfiler:
    """Tự động phân loại 5 lát cắt khó (Slices) của bối cảnh giao thông GreenSM"""
    
    @staticmethod
    def is_night(image_bgr: np.ndarray, thresh: float = 65.0) -> bool:
        """Đo độ sáng trung bình kênh L (Lab) để gán tag Night Slice"""
        lab = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2LAB)
        l_channel, _, _ = cv2.split(lab)
        return float(np.mean(l_channel)) < thresh

    @staticmethod
    def is_blurred(image_bgr: np.ndarray, thresh: float = 100.0) -> bool:
        """Đo phương sai Laplacian để phát hiện ảnh mờ nhoè tốc độ cao"""
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        variance = cv2.Laplacian(gray, cv2.CV_64F).var()
        return float(variance) < thresh
