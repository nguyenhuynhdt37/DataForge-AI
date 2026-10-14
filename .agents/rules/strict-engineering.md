# QUY TẮC KỸ THUẬT NGHIÊM NGẶT DỰ ÁN (PROJECT STRICT ENGINEERING RULES)

> [!IMPORTANT]
> Áp dụng cho toàn bộ codebase thuộc dự án `project-hackathon-greenSM` bao gồm cả `backend/` và `frontend/`. Không có ngoại lệ.

---

## 1. NGUYÊN TẮC ZERO PLACEHOLDER & CODE SẴN SÀNG PRODUCTION
- **Không bao giờ dùng code giả định**: Tuyệt đối không viết `// TODO`, `/* to be implemented */`, `... (other code)`, hoặc `pass` trong thân hàm nghiệp vụ.
- **Tính đầy đủ (Completeness)**: Mỗi file hoặc hàm khi được tạo mới hoặc chỉnh sửa phải có đầy đủ:
  - Kiểu dữ liệu đầu vào và đầu ra rõ ràng.
  - Xử lý các trường hợp biên: mảng rỗng, dữ liệu null/undefined, lỗi mạng, lỗi database.
  - Khối xử lý ngoại lệ (try-catch trong TypeScript, try-except trong Python) với logging/thông báo lỗi có nghĩa.

---

## 2. QUY CHUẨN BACKEND (FastAPI / Python)
- **Kiểu dữ liệu (Type Annotations)**: 100% các route, service, repository functions phải có type hint đầy đủ.
- **Pydantic Validation**: Dùng Pydantic model cho mọi request body, query params và response schema. Không truyền `dict` vô định hình qua các tầng logic.
- **Async & Session**: Đảm bảo mở/đóng database session đúng cách, không để leak connection.
- **Kiểm tra cú pháp & Type**: Trước khi kết thúc nhiệm vụ, phải đảm bảo Python code không có lỗi cú pháp hoặc import vòng lặp.

---

## 3. QUY CHUẨN FRONTEND (Next.js / TypeScript / Tailwind)
- **TypeScript Strict**: Cấm tuyệt đối kiểu `any` lười biếng. Bắt buộc định nghĩa interface/type chính xác tương thích với schema backend.
- **State Management & UX**: Mọi hành động bất đồng bộ (API call, form submit) bắt buộc phải có đủ 3 trạng thái giao diện:
  1. Trạng thái tải (Loading state / Skeleton)
  2. Trạng thái thành công (Success state / UI update)
  3. Trạng thái lỗi (Error state / Toast / Banner thông báo thân thiện)
- **Thiết kế VinFast Soft Editorial Pastel** (Xem chi tiết tại `.agents/rules/vinfast-soft-editorial-design.md`):
  + Tuyệt đối cấm dải màu phân cách/gradient trên mép Modal/Card (`bg-gradient-to-r`, accent bar).
  + Tuyệt đối cấm icon AI (`Sparkles`, magic wand, robot). Dùng icon kỹ thuật chuẩn.
  + Tuân thủ bảng màu Pastel: Nền kem `#F8F7F2` / `#FAF9F5` / `#FDFCFA`, viền `#ECEAE2` / `#E5E3DC`, xanh dịu `#E8F0EA` / `#B7CDBB` / `#2D5A34`.
  + Chống lỗi Dark Mode: Cấu hình `darkMode: "class"`, không để class `dark:` gây lỗi text trắng trên nền sáng.
- **Tailwind & Responsive**: Code giao diện phải chuẩn responsive (mobile & desktop), dùng biến theme nhất quán.

---

## 4. QUY TRÌNH VERIFICATION BẮT BUỘC TRƯỚC KHI BÀN GIAO
1. Chạy typecheck / linter tương ứng:
   - Frontend: `pnpm --filter frontend build` hoặc `pnpm --filter frontend lint` / `tsc --noEmit`
   - Backend: Kiểm tra syntax và import không bị crash.
2. Không bàn giao kết quả khi vẫn còn cảnh báo đỏ hoặc gãy logic phụ thuộc.
