import numpy as np
from sklearn.decomposition import PCA

class EmbeddingProjector:
    """Giảm chiều Deep Embedding 512D của YOLO xuống 2D PCA để Frontend HTML5 Canvas render"""
    def __init__(self, target_dim: int = 2):
        self.pca = PCA(n_components=target_dim)

    def project_2d(self, embeddings: np.ndarray) -> np.ndarray:
        # Trong thực tế, embeddings lấy từ YOLO backbone feature map
        # Ở môi trường lab, giả lập tọa độ mẫu
        if len(embeddings) < 2:
            return embeddings
        return self.pca.fit_transform(embeddings)
