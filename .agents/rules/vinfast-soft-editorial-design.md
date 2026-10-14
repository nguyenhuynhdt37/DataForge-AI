# QUY CHUẨN THIẾT KẾ VINFAST SOFT EDITORIAL PASTEL (DESIGN SYSTEM RULES)

> [!IMPORTANT]
> Quy chuẩn thiết kế bắt buộc áp dụng cho toàn bộ giao diện Frontend (`frontend/`). AI và các lập trình viên bắt buộc tuân thủ 100% để đảm bảo tính đồng bộ, tinh tế và phong cách biên tập cao cấp của thương hiệu VinFast & GreenSM.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE DESIGN PRINCIPLES)

1. **PHONG CÁCH SOFT EDITORIAL PASTEL**:
   - Giao diện mang hơi thở tạp chí công nghệ cao cấp (Editorial Tech): Thanh lịch, nhã nhặn, tối giản và nhiều khoảng thở.
   - Tránh xa phong cách "dashboard đồ chơi", cấm tuyệt đối màu neon chói mắt, cấm dải màu gradient sặc sỡ hoặc các đường viền phát sáng quá lố.

2. **CẤM DẢI MÀU CẮT NGANG TRÊN MODAL / CARD (ZERO TOP ACCENT STRIPS)**:
   - **TUYỆT ĐỐI CẤM** đặt các thanh gradient, vệt màu phân cách (`h-1`, `h-1.5`, `bg-gradient-to-r...`) ở mép trên cùng của Modal, Dialog, Popup hay Card.
   - Header của Modal/Card phải liền khối, bo góc tự nhiên (`rounded-2xl`, `rounded-3xl`), viền mảnh 1px đồng nhất (`border-[#ECEAE2]` hoặc `border-[#E5E3DC]`).

3. **CẤM TUYỆT ĐỐI ICON AI (ZERO AI / SPARKLES ICONS)**:
   - Nghiêm cấm sử dụng các icon gợi cảm giác ma thuật ảo giác như `Sparkles`, `Wand`, `Bot`, `Sparkle`, `Brain` ngớ ngẩn.
   - Thay thế bằng các icon kỹ thuật công nghiệp chuẩn xác (Lucide Icons):
     - Dữ liệu / Kho: `Database`, `Layers`, `FolderSync`, `HardDrive`
     - Bảo mật / Xác thực: `ShieldCheck`, `KeyRound`, `Lock`
     - Hệ thống / Kết nối: `Server`, `Cpu`, `Terminal`, `CheckCircle2`
     - Điều hướng / Thông tin: `ArrowRight`, `ExternalLink`, `Info`

4. **CHỐNG LỖI DARK MODE ÉP MÀU (DARK MODE SAFETY)**:
   - Cấu hình Tailwind bắt buộc: `darkMode: "class"`.
   - Tuyệt đối không chèn class `dark:` tùy tiện vào các component dùng nền cố định (như `#FDFCFA` hay `#FAF9F5`), tránh hiện tượng hệ điều hành bật Dark Mode biến màu chữ thành trắng trên nền trắng (tàng hình văn bản).

---

## 2. BẢNG MÀU CHUẨN MỰC (COLOR SYSTEM)

| Thành phần | Mã màu Hex | Ý nghĩa & Ứng dụng |
| :--- | :--- | :--- |
| **Nền chính (Canvas)** | `#F8F7F2` | Màu kem giấy ấm (Editorial Warm Cream) cho trang chính |
| **Nền khối phụ / Header** | `#FAF9F5` | Màu ngà dịu nhẹ cho header modal, panel bên trái, thanh công cụ |
| **Nền Modal / Surface** | `#FDFCFA` | Trắng sứ tinh khiết cho bề mặt tương tác nổi |
| **Đường viền (Borders)** | `#ECEAE2`, `#E5E3DC` | Viền mảnh 1px thanh lịch, nhã nhặn |
| **Chữ tiêu đề (Heading)** | `#1F2627` | Màu than đá đậm (Deep Slate), font có chân Editorial Georgia khi cần |
| **Chữ nội dung (Body)** | `#5A6466` | Màu xám đá dịu mắt (Muted Slate), dễ đọc, không gây mỏi |
| **Xanh Pastel Mint (Tag/Badge)**| `#E8F0EA` | Nền tag trạng thái dịu mát, badge thông tin |
| **Xanh Sage (Viền điểm nhấn)** | `#B7CDBB`, `#CDE0D1` | Viền badge, đường nét tinh tế |
| **Xanh VinFast / GreenSM** | `#2D5A34` | Xanh rừng sâu (Deep Forest Green) cho nút chính, icon chính, highlight |
| **Nút bấm Hover** | `#234729` | Xanh đậm hơn khi hover nút chính |

---

## 3. TẬN DỤNG REACT BITS HIỆU QUẢ VÀ TINH TẾ
- **AnimatedContent**: Dùng để bọc Modal, form và các khối nội dung xuất hiện mượt mà khi mount.
- **SplitText / BlurText**: Dùng cho các tiêu đề chính mang tính biên tập sang trọng.
- **SpotlightCard**: Dùng cho các thẻ giới thiệu tính năng, tương tác chuột tạo quầng sáng màu pastel mềm mại.
- **DecryptedText**: Dùng cho các đoạn mã kỹ thuật, token hash hoặc thông số hệ thống.
