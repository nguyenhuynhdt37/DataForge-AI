---
name: react-bits
description: >-
  Use this skill whenever building, adding, or modifying UI components, text animations, interactive cards, cursor effects, or backgrounds using React Bits (reactbits.dev).
  Enforces using live registry definitions, zero hallucination of component props, and harmonious integration with the VinFast Soft Editorial design system.
---

# React Bits UI Architecture & Skill Guide

Tài liệu hướng dẫn và chuẩn hóa cách sử dụng thư viện **React Bits** (reactbits.dev) trong toàn bộ dự án DataForge AI / GreenSM MLOps.

---

## 1. Nguyên Tắc Cốt Lõi (Core Directives)

1. **Tuyệt đối không đoán code hoặc bịa đặt props (Zero Hallucination)**:
   - React Bits cung cấp 165+ animated components được viết bằng Tailwind CSS và Framer Motion/CSS thuần.
   - Luôn sử dụng nguồn component chính thức từ registry:
     `https://reactbits.dev/r/<ComponentName>-TS-TW.json`
2. **Tuân thủ bảng màu Soft Editorial Tech**:
   - Màu nền giấy ấm: `#F8F7F2` (Warm White / Editorial Cream).
   - Màu văn bản chính: `#1F2627` (Deep Slate / Dark Charcoal).
   - Màu văn bản phụ: `#5A6466` (Muted Slate).
   - Màu xanh ngọc bích VinFast / GreenSM: `#2D5A34`, `#7FA086`, `#B7CDBB`.
   - Đường viền nhẹ nhàng: `#E5E3DC`, `#ECEAE2`.
   - Tuyệt đối không dùng màu neon chói lóa hoặc các hiệu ứng gây rối mắt.
3. **Kỷ luật Next.js 15 App Router**:
   - Mọi component có chứa tương tác chuột (mouse event, hover, canvas, animation hooks) bắt buộc phải có `"use client";` ở đầu file.
   - Export chuẩn mực qua barrel `src/shared/components/ui/index.ts` và `src/shared/components/react-bits/index.ts`.

---

## 2. Danh Mục Các Thành Phần React Bits Chủ Đạo

### A. Backgrounds (Nền Tương Tác)
- **`Squares`**: Lưới ô vuông tối giản với hiệu ứng hover đổi màu nhẹ nhàng theo phong cách biên tập Soft Editorial.
- **`RetroGrid`**: Lưới phối cảnh 3D tinh tế (thích hợp cho các trang Data Engineering / Active Mining).
- **`Particles`**: Hạt bụi ánh sáng chuyển động chậm rãi, tạo chiều sâu không gian cao cấp.

### B. Typography & Text Effects (Chữ Nghệ Thuật)
- **`SplitText`**: Chia tách từng ký tự và xuất hiện theo nhịp điệu (dùng cho tiêu đề trang, Heading 1).
- **`BlurText`**: Chữ chuyển từ mờ sang rõ nét mượt mà (dùng cho Subtitle, slogan).
- **`ShinyText`**: Hiệu ứng vệt sáng kim loại trượt qua dòng chữ (dùng cho status badges, highlight tags).
- **`TrueFocus`**: Khung tiêu điểm tương tác theo từ khóa (dùng cho điểm nhấn công nghệ).
- **`DecryptedText`**: Chữ giải mã ma trận dữ liệu (dùng cho telemetry, model hash, batch ID).

### C. Components & Interactive Cards (Thẻ & Tương Tác)
- **`SpotlightCard`**: Thẻ giao diện có quầng sáng mềm mại đi theo vị trí con trỏ chuột.
- **`TiltedCard`**: Thẻ phản hồi góc nghiêng 3D khi rê chuột (dùng cho KPI Cards, Feature Showcase).
- **`Magnet`**: Nút bấm hoặc biểu tượng có lực hút từ tính bám theo con trỏ chuột.
- **`StarBorder`**: Viền phát sáng ánh sao chuyển động quanh nút hoặc thẻ đặc biệt.
- **`CountUp`**: Bộ đếm số tăng dần mượt mà (dùng cho các chỉ số ROI, Accuracy rate, số lượng ảnh đã gán).
- **`AnimatedContent`**: Bọc nội dung để tự động xuất hiện với hiệu ứng mượt mà khi mount.

---

## 3. Quy Chuẩn Sử Dụng Trong Dự Án

### Cách Import Chuẩn Mực
Toàn bộ dự án thống nhất import thông qua:
```typescript
import { 
  Button, 
  Card, 
  Badge, 
  SpotlightCard, 
  SplitText, 
  Squares, 
  Magnet, 
  CountUp 
} from '@/shared/components/ui';
```
hoặc
```typescript
import { SpotlightCard, Squares, SplitText } from '@/shared/components/react-bits';
```

### Triển khai UI Primitives
- Mọi `Button` hỗ trợ prop `magnetic={true}` để kích hoạt hiệu ứng hút con trỏ chuột từ React Bits Magnet.
- Mọi `Card` mặc định kích hoạt hiệu ứng `SpotlightCard` của React Bits với màu quầng sáng êm dịu `rgba(183, 205, 187, 0.25)`.
