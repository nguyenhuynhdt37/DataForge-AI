import imagehash
from PIL import Image
from pathlib import Path
from loguru import logger

class FastDedupEngine:
    """Thuật toán Intra-video Deduplication sử dụng pHash và ngưỡng Hamming Distance"""
    def __init__(self, hash_size: int = 8, threshold: int = 5):
        self.hash_size = hash_size
        self.threshold = threshold

    def compute_phash(self, image_path: Path) -> str:
        try:
            with Image.open(image_path) as img:
                return str(imagehash.phash(img, hash_size=self.hash_size))
        except Exception as e:
            logger.warning(f"Không thể tính pHash cho {image_path}: {e}")
            return ""

    def is_duplicate(self, hash1: str, hash2: str) -> bool:
        if not hash1 or not hash2:
            return False
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        return (h1 - h2) <= self.threshold
