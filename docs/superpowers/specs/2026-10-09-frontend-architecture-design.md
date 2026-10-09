# Đặc Tả Thiết Kế Kiến Trúc Frontend: GreenSM HITL Active Learning Platform

- **Ngày lập:** 2026-10-09
- **Dự án:** GreenSM HITL Active Learning Monorepo
- **Trạng thái:** Chờ phê duyệt (Pending Approval)

---

## 1. Mục Tiêu & Phạm Vi (Goals & Scope)

### 1.1 Mục Tiêu Nghiệp Vụ
Xây dựng phân hệ giao diện người dùng (Frontend) chuẩn mực, mượt mà và trực quan phục vụ toàn diện cho quy trình Human-in-the-Loop (HITL) Active Learning:
1. **Executive Overview (`/`)**: Theo dõi trực quan tiến độ pipeline 4 Phase (10 khâu), ma trận dữ liệu và chỉ số ROI bài toán gán nhãn taxi GreenSM.
2. **Data Lab (`/data-lab`)**: Lọc và thống kê 5 lát cắt khó (Night, Blur, Small Object, Occlusion, Dense Traffic), tỷ lệ loại bỏ trùng lặp (pHash BK-Tree).
3. **Active Mining (`/active-mining`)**: Trực quan hóa không gian đặc trưng Deep Embedding trên đồ thị phân tán 2D PCA bằng HTML5 Canvas, điều chỉnh trọng số điểm Active Score $S_i = \frac{U_i \cdot W_i \cdot A_i}{E_i}$ thời gian thực.
4. **HITL Studio (`/hitl-studio`)**: Bàn làm việc gán nhãn khép kín hiệu năng cao:
   - Canvas 2D đạt 60 FPS hỗ trợ zoom mượt (con lăn chuột), pan (kéo chuột phải/chuột giữa), chỉnh sửa 8 anchor điểm của Bounding Box.
   - Hiển thị trực quan mức độ đồng thuận (IoU Consensus) giữa 2 mô hình YOLO11n và RT-DETR.
   - Hệ thống phím tắt tốc độ cao (`Space` duyệt & lưu, `G` GreenSM, `C` Car, `B` Bus, `T` Truck, `M` Moto, `Delete` xóa box).
   - RAG Copilot Chatbot tại chỗ hỗ trợ tra cứu quy chuẩn gán nhãn từ `ANNOTATION_GUIDELINE.md`.
5. **Benchmark Center (`/benchmark`)**: Bảng so sánh ma trận thực nghiệm A/B 4 nhánh và hiệu năng tăng tốc suy luận Edge Inference (PyTorch FP32 vs OpenVINO INT8 CPU).

---

## 2. Ngăn Xếp Công Nghệ (Technology Stack)

- **Framework**: Next.js 15 (App Router, React 19).
- **Styling**: Tailwind CSS v3.4 (LTS) kết hợp CSS Variables, `clsx`, `tailwind-merge`.
- **State Management**:
  - `zustand`: Quản lý client state cục bộ cho HITL Canvas (danh sách boxes, active tool, zoom/pan transform, undo/redo stack).
  - React Context / Server-Sent Events (SSE): Lắng nghe tiến trình xử lý từ FastAPI backend.
- **Icons**: `lucide-react`.
- **Graphics & Visualization**:
  - HTML5 Canvas 2D Context API thuần: Đạt 60 FPS cho Canvas gán nhãn và đồ thị phân tán PCA (không phụ thuộc thư viện nặng của bên thứ ba).
- **Package Manager**: `pnpm` (chuẩn monorepo, hiệu năng cao).

---

## 3. Cấu Trúc Thư Mục Chi Tiết (`frontend/`)

```text
frontend/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── next.config.ts
├── .env.local.example
└── src/
    ├── app/
    │   ├── layout.tsx                     # Root Layout: Sidebar cố định, Top Status Bar
    │   ├── page.tsx                       # Executive Overview Dashboard
    │   ├── globals.css                    # Tailwind directives & design tokens
    │   ├── data-lab/
    │   │   └── page.tsx                   # Data Lab: 5 Slices & Dedup Stats
    │   ├── active-mining/
    │   │   └── page.tsx                   # Active Mining: 2D PCA Scatter & Weight Tuning
    │   ├── hitl-studio/
    │   │   └── page.tsx                   # HITL Labeling Studio & Guideline Chatbot
    │   └── benchmark/
    │       └── page.tsx                   # A/B Benchmark & OpenVINO Metrics
    │
    ├── modules/                           # Feature-Driven Architecture
    │   ├── data-lab/
    │   │   ├── components/
    │   │   │   ├── SliceFilterBar.tsx     # Bộ lọc tab 5 lát cắt khó
    │   │   │   ├── SliceMetricCard.tsx    # Card số liệu lát cắt
    │   │   │   └── ImageGridPreview.tsx   # Lưới hiển thị ảnh
    │   │   └── types/index.ts
    │   ├── active-mining/
    │   │   ├── components/
    │   │   │   ├── PcaScatterPlot.tsx     # Canvas 2D vẽ 2.000+ điểm embedding
    │   │   │   ├── WeightSliderPanel.tsx  # Thanh trượt chỉnh trọng số U, W, A, E
    │   │   │   └── CandidateList.tsx      # Danh sách ứng viên theo Core-Set
    │   │   └── types/index.ts
    │   ├── hitl-studio/
    │   │   ├── components/
    │   │   │   ├── CanvasEngine.tsx       # Bàn vẽ Canvas 2D tương tác
    │   │   │   ├── LabelToolbar.tsx       # Thanh chọn class (GreenSM, Car,...)
    │   │   │   ├── GuidelineChat.tsx      # Chatbot drawer hỗ trợ quy chuẩn
    │   │   │   └── ConsensusBadge.tsx     # Huy hiệu hiển thị trạng thái IoU Consensus
    │   │   ├── hooks/
    │   │   │   ├── useCanvasTransform.ts  # Logic zoom con lăn, pan kéo thả
    │   │   │   └── useHotkeys.ts          # Lắng nghe phím tắt Space, G, C, Delete
    │   │   ├── store/
    │   │   │   └── hitlStore.ts           # Zustand store: boxes, history, selection
    │   │   └── types/index.ts
    │   └── benchmarks/
    │       ├── components/
    │       │   ├── MatrixTable.tsx        # Bảng ma trận A/B 4 nhánh
    │       │   └── LatencyChart.tsx       # Biểu đồ so sánh FPS CPU OpenVINO
    │       └── types/index.ts
    │
    └── shared/                            # Hạ tầng & Components dùng chung
        ├── components/
        │   ├── layout/
        │   │   ├── AppSidebar.tsx         # Sidebar điều hướng 5 workspace
        │   │   └── TopHeader.tsx          # Thanh trạng thái backend SSE kết nối
        │   └── ui/                        # Button, Card, Badge, Slider, Modal
        ├── hooks/
        │   └── useSseTask.ts              # Hook kết nối SSE theo dõi task chạy ngầm
        ├── lib/
        │   ├── apiClient.ts               # HTTP client chuẩn hóa
        │   └── utils.ts                   # cn (clsx + twMerge)
        └── types/
            └── common.ts
```

---

## 4. Đặc Tả Chi Tiết Các Thành Phần Cốt Lõi

### 4.1 Canvas Engine 2D (HITL Studio)
- **Tọa độ & Chuẩn hóa**: Tự động chuyển đổi giữa tọa độ hiển thị (Screen/Viewport pixels) và tọa độ chuẩn YOLO gốc ($x_{center}, y_{center}, w, h \in [0, 1]$).
- **Hệ màu nhận diện 5 Class**:
  - `greensm`: Xanh lục dạ quang (`#10B981` / `#059669`) - Nổi bật nhất.
  - `car`: Xanh lam (`#3B82F6`).
  - `motorcycle`: Cam (`#F97316`).
  - `bus`: Tím (`#8B5CF6`).
  - `truck`: Hổ phách (`#F59E0B`).
- **Chỉ báo Dual-Model Consensus**:
  - Consensus $\ge 0.70$: Viền nét liền, nhãn ghi `[Auto-Verified]`.
  - Consensus $< 0.70$: Viền nét đứt cảnh báo, nhãn ghi `[Review Needed: Discrepancy]`.

### 4.2 Zustand State Store (`hitlStore.ts`)
- Quản lý danh sách Bounding Boxes hiện tại.
- Ngăn xếp Undo/Redo (tối đa 30 bước).
- Trạng thái con trỏ (Hovering, Dragging, Resizing anchor 0-7, Creating new box).
- Tọa độ biến đổi Transform ($scale, offsetX, offsetY$).

### 4.3 Luồng Dữ Liệu Thời Gian Thực (SSE Task Manager)
- Lắng nghe sự kiện từ `/api/v1/tasks/{task_id}/events`.
- Cập nhật thanh tiến độ toàn cục trên `TopHeader.tsx` khi Backend đang chạy BK-Tree Dedup, Profiling hoặc Training.

---

## 5. Kế Hoạch Xác Minh (Verification Strategy)
1. **Kiểm tra Scaffolding**: Chạy `pnpm build` hoặc `pnpm lint` thành công không có lỗi type error.
2. **Kiểm tra Layout & Navigation**: Điều hướng giữa 5 route chính trên Sidebar mượt mà, Active route đổi màu chính xác.
3. **Kiểm tra Canvas Rendering**: Render thử 1 ảnh mẫu kèm 3 bounding box, thao tác zoom/pan và di chuyển hộp thành công.
