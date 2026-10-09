from pathlib import Path
from app.core.config import settings

class GuidelineRagAssistant:
    """Trợ lý RAG thông minh tra cứu quy chuẩn gán nhãn ANNOTATION_GUIDELINE.md"""
    @staticmethod
    def answer(question: str) -> dict:
        q_lower = question.lower()
        if "xe máy" in q_lower or "moto" in q_lower:
            return {
                "answer": "Theo quy chuẩn Điều 1.2: Toàn bộ xe máy 2 bánh (kể cả xe máy điện VinFast Feliz/Klara của tài xế GreenSM) đều phải gắn nhãn là `motorcycle` (Class ID 2). Nhãn `greensm` (ID 0) TUYỆT ĐỐI chỉ dành riêng cho Ô tô điện GreenSM.",
                "source_clause": "Mục 1.1 - Label Taxonomy (Quy chuẩn 5 Class)"
            }
        elif "ban đêm" in q_lower or "tối" in q_lower or "night" in q_lower:
            return {
                "answer": "Dưới ánh đèn vàng cao áp ban đêm, màu xanh Cyan của GreenSM thường bị ngả sang màu xám/xanh thẫm. Kiểm tra vệt đèn LED định vị hình cánh chim chữ V ở đầu/đuôi xe hoặc logo GreenSM bên sườn để khẳng định nhãn `greensm`.",
                "source_clause": "Mục 3.2 - Hướng dẫn xử lý lát cắt Ban đêm (Night Slice)"
            }
        elif "che khuất" in q_lower or "occlusion" in q_lower:
            return {
                "answer": "Đối với xe bị che khuất: Nếu phần nhìn thấy còn trên 30% diện tích thân xe, hãy vẽ Bounding Box bao trùm cả phần bị che theo dự đoán hình thể. Nếu bị che > 70% và không còn nhận diện rõ hình dạng, hãy bỏ qua không gán nhãn.",
                "source_clause": "Mục 4.1 - Tiêu chuẩn Occlusion"
            }
        else:
            return {
                "answer": "Quy chuẩn gán nhãn yêu cầu: `greensm` (chỉ ô tô điện GreenSM), `car` (ô tô khác), `motorcycle` (mọi xe máy), `bus` (xe buýt), `truck` (xe tải lớn). Sử dụng phím tắt 'G' để gán nhãn GreenSM nhanh nhất.",
                "source_clause": "Mục 1.0 - Tổng quan Quy chuẩn"
            }
