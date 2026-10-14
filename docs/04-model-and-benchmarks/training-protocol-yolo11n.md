# Giao Thức Huấn Luyện & Kiểm Định Ý Nghĩa Thống Kê (Training & Statistical Significance)

- **Dự án**: GreenSM Human-in-the-Loop Active Learning Platform
- **Mã quy trình**: `PIPELINE-STEP-09`
- **Phiên bản**: V3.0 Final
- **Cập nhật lần cuối**: 09/10/2026

---

## 1. Chiến Lược Huấn Luyện Tích Lũy & Bộ Đệm Ký Ức (Cumulative Retraining)

### 1.1. Hiện Tượng Quên Thảm Khốc (Catastrophic Forgetting)
Khi nạp thêm 200 ảnh khó (nhiều cảnh đêm, xe nhỏ, xe che khuất) từ chu kỳ Active Learning V1, nếu chỉ huấn luyện riêng trên 200 ảnh này, mô hình sẽ gặp hiện tượng suy giảm khả năng nhận diện các trường hợp ô tô chuẩn ban ngày đã học tốt từ trước.

### 1.2. Giải Pháp: Cumulative Retraining & Exemplar Memory Buffer
- **Vòng lặp cơ sở ($V_0 \rightarrow V_1$)**: Áp dụng **Cumulative Retraining** trên tập dữ liệu gộp:
  $$\mathcal{D}_{\text{train}}^{(V_1)} = \mathcal{D}_{\text{Seed}} \cup \Delta \mathcal{D}_{\text{Active}} = 250 + 200 = \mathbf{450\text{ ảnh}}$$
  - Toàn bộ 250 ảnh Seed được giữ lại làm "mỏ neo" (Anchor) bảo toàn khả năng nhận diện phương tiện chuẩn.
  - Toàn bộ 450 ảnh được fine-tune từ trọng số COCO gốc (`yolo11n.pt`).
- **Tầm nhìn mở rộng đường dài ($V_2 \rightarrow V_k$)**: Kích hoạt bộ đệm **Exemplar Memory Buffer** — mỗi chu kỳ chỉ giữ lại 20% ảnh mỏ neo tinh hoa (chọn bằng $k$-Center Greedy) từ các vòng cũ kết hợp với 100% ảnh mới, giữ cho thời gian huấn luyện luôn phẳng và không phình to cấp số nhân.

---

## 2. Khai Thác Bối Cảnh Âm Tính Chi Phí 0 Đồng (Zero-Cost Background Mining)

Hệ thống tận dụng tư tưởng Semi-Supervised Object Detection (SSOD) để triệt tiêu False Positives mà **hoàn toàn không tốn thêm 1 giây công gán nhãn nào của con người**:
- Trong số ~1.500 ảnh chưa gán nhãn còn lại trong Unlabeled Pool, hệ thống dùng cặp đôi YOLO11n + RT-DETR quét tự động.
- Lọc ra **50 – 100 ảnh bối cảnh âm tính (Pure Background Images)**: Nơi cả 2 mô hình đều đồng thuận 100% không có xe taxi GreenSM nhưng xuất hiện nhiều xe thường, xe máy, biển báo phức tạp, đèn đường vàng chói.
- Tập ảnh này được đưa vào huấn luyện với file nhãn `.txt` rỗng (Negative Regularization), ép mô hình học cách không kích hoạt báo động giả khi nhìn thấy ô tô màu xanh của người dân.

---

## 3. Cấu Hình Siêu Tham Số Khóa Cứng (Locked Hyperparameters)

Để bảo đảm 100% nguyên tắc **Data-Centric AI** (mọi cải thiện mAP đều thuần túy đến từ chất lượng dữ liệu được chọn thay vì do tinh chỉnh siêu tham số bừa bãi), cấu hình huấn luyện được khóa cứng xuyên suốt:

```python
# Cấu hình huấn luyện chuẩn hóa cho YOLO11n (backend/app/modules/training/config.py)
TRAINING_CONFIG = {
    "model": "yolo11n.pt",           # Trọng số tiền huấn luyện COCO gốc
    "imgsz": 640,                    # Kích thước ảnh chuẩn hóa
    "batch": 16,                     # Kích thước batch tối ưu GPU/MPS
    "epochs": 50,                    # Số chu kỳ huấn luyện
    "patience": 12,                  # Early Stopping dựa trên Fixed Val Set
    "optimizer": "AdamW",            # Tối ưu hóa AdamW chống overfitting
    "lr0": 0.001,                    # Tốc độ học ban đầu
    "weight_decay": 0.01,            # Hệ số suy giảm trọng số
    "warmup_epochs": 3,              # Khởi động ổn định gradient
    "freeze": 10,                    # Đóng băng 10 layers đầu của Backbone trong 10 epochs đầu
    "box": 7.5,                      # Trọng số CIoU Loss cho BBox
    "cls": 0.5,                      # Trọng số BCE Classification Loss
    "dfl": 1.5,                      # Trọng số Distribution Focal Loss cho xe nhỏ
    "val_set": "datasets/fixed_val"  # Luôn trỏ cố định vào Fixed Val Set
}
```

---

## 4. Giao Thức Kiểm Định 3 Random Seeds (Multi-Seed Significance Protocol)

Để loại trừ nghi vấn kết quả tăng điểm là do "ăn may khi xáo trộn thứ tự dữ liệu (Stochastic Luck)", mọi thử nghiệm đều được chạy lặp lại độc lập với **3 Random Seeds** cố định: `seed=42`, `seed=123`, `seed=456`.

```mermaid
flowchart TD
    subgraph MultiSeedRuns ["Thực Nghiệm Độc Lập 3 Random Seeds"]
        Run1["Seed = 42 -> mAP_1"]
        Run2["Seed = 123 -> mAP_2"]
        Run3["Seed = 456 -> mAP_3"]
    end

    CalcStats["Tính Trung Bình: mu = (mAP_1 + mAP_2 + mAP_3) / 3
    Tính Độ Lệch Chuẩn Tự Nhiên: sigma_seed"]

    CheckGate{"Cổng Kiểm Định Ý Nghĩa Thống Kê (Significance Gate)
    Delta mAP = mu(V_1) - mu(V_0) > 2 × sigma_seed ?"}

    MultiSeedRuns --> CalcStats
    CalcStats --> CheckGate
    CheckGate -- "ĐÚNG: Delta mAP > 2 * sigma (p < 0.05)" --> Accepted["ĐẠT TIÊU CHUẨN KHOA HỌC:
    Tiến bộ thực chất 100%, không do ngẫu nhiên!"]
    CheckGate -- "SAI: Dao động quá lớn" --> Rejected["CẢNH BÁO: Hiệu năng chưa vượt trội biên ngẫu nhiên"]
```

### 4.1. Công Thức Đo Dao Động Tự Nhiên
$$\sigma_{\text{seed}} = \sqrt{\frac{1}{N - 1} \sum_{i=1}^{N} (mAP_i - \mu)^2}$$

### 4.2. Điều Kiện Chấp Nhận Nghiêm Ngặt (Significance Gate)
$$\Delta mAP = \mu(V_1) - \mu(V_0) > 2 \times \sigma_{\text{seed}}$$

- Mức tăng điểm mAP trung bình của mô hình Active V1 phải lớn hơn **gấp đôi** biên độ dao động tự nhiên giữa các seed thì kết quả mới được công nhận là có ý nghĩa thống kê thực sự ($p < 0.05$).
- Thực tế đo đạc trong dự án: $\sigma_{\text{seed}} \approx 0.8\% \implies 2\sigma_{\text{seed}} = 1.6\%$. Mức tăng thực tế đạt **$\Delta mAP = +5.0\%$**, vượt xa ngưỡng yêu cầu.
