class ActiveScorer:
    """Tính toán công thức Active Score S_i = (U_i * W_i * A_i) / E_i"""
    @staticmethod
    def compute_score(u: float, w: float, a: float, e: float) -> float:
        # Ngăn chia cho 0
        safe_e = max(e, 0.01)
        return (u * w * a) / safe_e
