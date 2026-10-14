# Hướng Dẫn Cài Đặt & Triển Khai Hệ Thống (Quickstart & Deployment)

- **Dự án**: GreenSM Human-in-the-Loop Active Learning Platform
- **Mã tài liệu**: `OPS-QUICKSTART-GUIDE`
- **Phiên bản**: V3.0 Final
- **Cập nhật lần cuối**: 09/10/2026

---

## 1. Yêu Cầu Môi Trường (System Prerequisites)

Hệ thống được thiết kế để chạy mượt mà trên cả macOS (Apple Silicon M-Series) và các máy chủ Linux (Ubuntu 22.04 LTS):
- **Docker Engine**: Phiên bản 24.0+ kèm Docker Compose v2+.
- **Node.js**: v20.x LTS hoặc mới hơn (kèm `pnpm` v9.x).
- **Python**: 3.11+ (kèm `pip` và môi trường ảo `venv`).
- **RAM tối thiểu**: 8 GB (khuyến nghị 16 GB để chạy mô hình AI mượt mà).

---

## 2. Triển Khai Tự Động Bằng Docker Compose (Khuyên Dùng)

Toàn bộ ngăn xếp hệ thống (Giao diện Next.js, Backend API, Cơ sở dữ liệu PostgreSQL, Bộ đệm Redis, Giao diện quản trị Adminer) được đóng gói và liên kết tự động trong [`docker-compose.yml`](file:///Users/huynh/projects/h20k_vinuni/lv2-3/projects/project-hackathon-greenSM/docker-compose.yml).

### 2.1. Cấu Hình Biến Môi Trường
Khởi tạo tệp `.env` cho backend:
```bash
cp backend/.env.example backend/.env
```
Nội dung cấu hình tối thiểu trong `backend/.env`:
```ini
ENVIRONMENT=development
FASTAPI_PORT=8000
DATABASE_URL=postgresql+asyncpg://greensm_admin:SecretPassword2026!@postgres:5432/greensm_mlops
REDIS_URL=redis://redis:6379/0
SECRET_KEY=greensm_hackathon_super_secret_jwt_key_2026_secure!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### 2.2. Khởi Chạy Toàn Bộ Hệ Thống
Chạy lệnh khởi động 5 dịch vụ đồng thời ở chế độ nền:
```bash
docker compose up -d --build
```

Kiểm tra trạng thái các container:
```bash
docker compose ps
```

| Tên Dịch Vụ | Cổng Truy Cập (Port) | Mục Đích Sử Dụng | URL Truy Cập Trực Tiếp |
| :--- | :---: | :--- | :--- |
| **Frontend** | `3000` | Giao diện Next.js 15 (5 workspaces) | `http://localhost:3000` |
| **Backend API** | `8000` | API FastAPI & OpenAPI Docs | `http://localhost:8000/docs` |
| **PostgreSQL** | `5432` | CSDL lưu trữ Metadata & Annotations | `localhost:5432` |
| **Redis** | `6379` | Quản lý Token Session & Cache | `localhost:6379` |
| **Adminer** | `8080` | Web GUI quản trị CSDL trực quan | `http://localhost:8080` |

---

## 3. Khởi Chạy Cục Bộ Dành Cho Phát Triển (Local Development)

Nếu bạn muốn chỉnh sửa mã nguồn trực tiếp ngoài container:

### 3.1. Chạy Backend FastAPI Cục Bộ
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python init_db.py  # Tạo bảng và tài khoản Admin mặc định
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3.2. Chạy Frontend Next.js Cục Bộ
```bash
cd frontend
pnpm install
pnpm dev
```
Truy cập `http://localhost:3000` để bắt đầu làm việc.

---

## 4. Kiểm Tra Sức Khỏe Hệ Thống (Health Checks)

- **API Health Check**:
  ```bash
  curl -i http://localhost:8000/health
  # Trả về: {"status": "ok", "database": "connected", "redis": "connected"}
  ```
- **Postgres Readiness**:
  ```bash
  docker compose exec postgres pg_isready -U greensm_admin -d greensm_mlops
  ```
- **Redis Ping**:
  ```bash
  docker compose exec redis redis-cli ping
  # Trả về: PONG
  ```
