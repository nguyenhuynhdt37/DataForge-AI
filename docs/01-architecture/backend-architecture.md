# Đặc Tả Kiến Trúc Backend: FastAPI Micro-Kernel & Clean Architecture

- **Dự án**: GreenSM Human-in-the-Loop Active Learning Platform
- **Mã thành phần**: `BACKEND-CORE-API`
- **Ngôn ngữ & Framework**: Python 3.11+ / FastAPI 0.115+
- **Cập nhật lần cuối**: 09/10/2026

---

## 1. Nguyên Tắc Thiết Kế & Cấu Trúc Phân Tầng (Clean Architecture)

Backend được xây dựng dựa trên nguyên lý **Clean Architecture** kết hợp mô hình **Feature-Driven / Modular Monolith**, giúp phân tách rành mạch giữa các tầng điều hướng (Router), nghiệp vụ cốt lõi (Service), truy cập dữ liệu (Repository / Models) và cấu hình nền tảng (Core / Infrastructure).

```mermaid
flowchart TD
    Client["Clients (Frontend Next.js / External Workers / CVAT)"]
    
    subgraph FastAPI_App ["FastAPI Application (backend/app)"]
        subgraph Presentation_Layer ["Presentation Layer (Routers & Middleware)"]
            CORSMiddleware["CORS & Request Logger Middleware"]
            AuthRouter["/api/v1/auth (JWT Login, Register, Profile)"]
            ProjectRouter["/api/v1/projects (Project & Workspace Management)"]
            DatasetRouter["/api/v1/datasets (Images, Annotations, Uploads)"]
            MiningRouter["/api/v1/mining (Scoring, Core-Set, Candidates)"]
            HITLRouter["/api/v1/hitl (Two-Tier Consensus, Manual Review)"]
            BenchRouter["/api/v1/benchmarks (A/B Test Runs, OpenVINO Metrics)"]
            SSERouter["/api/v1/events/stream (SSE Real-time Progress)"]
        end

        subgraph Business_Layer ["Domain / Service Layer"]
            AuthService["AuthService (Password Hash, Token Minting)"]
            MiningService["ActiveMiningEngine (U, W, A, E Computation)"]
            CoreSetService["CoreSetSelector (PCA 32D, k-Center Greedy)"]
            ConsensusService["ConsensusOracle (YOLO11n + RT-DETR IoU)"]
            ExportService["OpenVINOExportService (POT / NNCF Quantization)"]
        end

        subgraph Data_Layer ["Data Access Layer (SQLAlchemy ORM + Asyncpg)"]
            UserRepo["User & Role Models"]
            ProjectRepo["Project & Dataset Models"]
            AnnotationRepo["Annotation & BoundingBox Models"]
            ExperimentRepo["Experiment Manifest & Checkpoint Models"]
        end

        subgraph Infrastructure_Layer ["Core & Infrastructure Layer"]
            Config["Pydantic Settings (.env)"]
            DBEngine["Async SQLAlchemy Engine"]
            RedisConn["Redis Client (Session, Cache, Pub/Sub)"]
            EventBus["In-Memory / Redis Event Bus"]
        end
    end

    Client <==> |HTTP/2 REST API| Presentation_Layer
    Presentation_Layer --> Business_Layer
    Business_Layer --> Data_Layer
    Data_Layer --> DBEngine
    Business_Layer --> RedisConn
    DBEngine --> Postgres[("PostgreSQL 16")]
    RedisConn --> RedisDB[("Redis 7")]
```

---

## 2. Tổ Chức Thư Mục Mã Nguồn (`backend/app/`)

```text
backend/app/
├── core/                                # Nền tảng hạ tầng dùng chung cho toàn bộ ứng dụng
│   ├── config.py                        # Pydantic BaseSettings: Nạp biến môi trường từ .env
│   ├── database.py                      # Thiết lập Async Engine, AsyncSessionLocal, Base declarative
│   ├── security.py                      # Argon2/Bcrypt hash mật khẩu, JWT encode/decode, token blacklisting
│   ├── logger.py                        # Cấu hình logging chuẩn format JSON structured
│   ├── sse.py                           # Quản lý hàng đợi Server-Sent Events phát tiến độ tác vụ
│   └── websocket.py                     # Quản lý kết nối thời gian thực hai chiều (nếu cần)
│
├── modules/                             # Các domain tính năng độc lập (Feature Modules)
│   ├── auth/                            # Phân hệ Xác thực & Phân quyền
│   │   ├── models.py                    # Bảng User, Role, RefreshToken
│   │   ├── schemas.py                   # Pydantic schemas: UserCreate, UserResponse, Token
│   │   ├── service.py                   # Logic nghiệp vụ login, refresh, hash password
│   │   ├── router.py                    # Endpoints /api/v1/auth/...
│   │   └── dependencies.py              # Dependency Injection: get_current_user, require_role
│   │
│   ├── projects/                        # Phân hệ Quản lý Dự án & Bộ dữ liệu
│   │   ├── models.py                    # Project, Dataset, DatasetSplit, ImageSample
│   │   ├── schemas.py                   # ProjectCreate, DatasetStats, SplitResponse
│   │   ├── service.py                   # Logic nghiệp vụ tạo dự án, phân loại slice
│   │   └── router.py                    # Endpoints /api/v1/projects/...
│   │
│   ├── mining/                          # Phân hệ Thuật toán Active Learning & Core-Set
│   │   ├── schemas.py                   # MiningConfig, ActiveScoreResult, PCAScatterPoint
│   │   ├── service.py                   # Tính điểm U, W, A, E, trích xuất embedding, k-Center Greedy
│   │   └── router.py                    # Endpoints /api/v1/mining/...
│   │
│   ├── hitl/                            # Phân hệ Bàn làm việc Two-Tier HITL & Oracle
│   │   ├── schemas.py                   # BBoxPayload, ConsensusResult, AutoAcceptVerdict
│   │   ├── service.py                   # Tính IoU consensus YOLO11n + RT-DETR, Spot-check QA
│   │   └── router.py                    # Endpoints /api/v1/hitl/...
│   │
│   └── benchmarks/                      # Phân hệ Đánh giá A/B & OpenVINO Edge
│       ├── schemas.py                   # ABMatrixResult, LatencyBenchmarkPayload
│       ├── service.py                   # Đánh giá Fixed Test Set, benchmark latency FPS CPU
│       └── router.py                    # Endpoints /api/v1/benchmarks/...
│
├── shared/                              # Thư viện dùng chung giữa các modules
│   ├── exceptions.py                    # Custom API Exceptions (EntityNotFound, PermissionDenied)
│   ├── schemas.py                       # Chuẩn format phản hồi API: StandardResponse[T], Pagination
│   └── utils.py                         # Helper tính toán IoU, mã hóa base64, hash SHA-256
│
└── main.py                              # Khởi tạo FastAPI App, gán Middleware, nạp Routers
```

---

## 3. Quản Lý Cơ Sở Dữ Liệu Bất Đồng Bộ (Asyncpg + SQLAlchemy 2.0)

Hệ thống sử dụng cơ chế kết nối bất đồng bộ không phong tỏa (non-blocking I/O) giúp đạt thông lượng cao khi xử lý đồng thời hàng ngàn yêu cầu:

### 3.1. Cấu hình Chuỗi Kết Nối & Connection Pooling
- **Engine URL**: `postgresql+asyncpg://greensm_admin:SecretPassword2026!@postgres:5432/greensm_mlops`
- **Pool Size**: `pool_size=20`, `max_overflow=10`, `pool_recycle=1800` (tái tạo kết nối sau 30 phút để tránh kết nối mồ côi).
- **Session Lifecycle**: Sử dụng Dependency Injection `get_db()` với async context manager nhằm tự động `commit()` khi hoàn tất và `rollback()` khi phát sinh lỗi ngoại lệ.

### 3.2. Cấu Trúc Thực Thể Dữ Liệu Trọng Yếu

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : "creates"
    PROJECTS ||--o{ DATASET_SPLITS : "contains"
    DATASET_SPLITS ||--o{ IMAGE_SAMPLES : "stores"
    IMAGE_SAMPLES ||--o{ ANNOTATIONS : "has"
    IMAGE_SAMPLES ||--o{ ACTIVE_SCORES : "evaluated"
    PROJECTS ||--o{ EXPERIMENT_RUNS : "trains"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string role "ADMIN | ML_ENGINEER | QA_LEAD | ANNOTATOR"
        boolean is_active
        datetime created_at
    }

    PROJECTS {
        uuid id PK
        string name
        string description
        string current_model_checkpoint
        datetime created_at
    }

    IMAGE_SAMPLES {
        uuid id PK
        uuid split_id FK
        string file_path
        string file_hash_sha256
        int width
        int height
        jsonb metadata_slices "day/night, blur, small_object, density"
        boolean is_processed
    }

    ANNOTATIONS {
        uuid id PK
        uuid image_id FK
        int class_id "0: greensm, 1: car, 2: moto, 3: bus, 4: truck"
        float x_center
        float y_center
        float width
        float height
        float confidence
        string source "PRE_LABEL | MANUAL | AUTO_ACCEPT"
        uuid annotated_by FK
    }

    EXPERIMENT_RUNS {
        uuid id PK
        string experiment_id UK
        string git_tag
        string dataset_checksum
        float map_50_95
        float map_greensm
        jsonb slice_recalls
        datetime created_at
    }
```

---

## 4. Quản Lý Session, Cache & Sự Kiện Thời Gian Thực

### 4.1. Redis Caching & Phiên Làm Việc
1. **Quản lý Token Phiên**: Token JWT được cấp phát theo cặp `AccessToken` (hạn dùng 30 phút) và `RefreshToken` (hạn dùng 7 ngày). Khi người dùng đăng xuất hoặc đổi mật khẩu, token được đưa vào danh sách đen (Blacklist) trong Redis với thời gian hết hạn tương ứng TTL.
2. **Bộ Nhớ Đệm Trích Xuất Đặc Trưng (Embedding Cache)**: Vector đặc trưng 512D từ backbone YOLO11n của hàng ngàn ảnh được lưu trong Redis dưới dạng binary blob, giúp các tác vụ điều chỉnh trọng số trượt $S_i$ và giảm chiều PCA phản hồi tức thì dưới **50ms**.

### 4.2. Server-Sent Events (SSE) Stream Tiến Độ
Các tác vụ MLOps nặng (lọc trùng lặp pHash, tính điểm Active Mining, chạy đồng thuận Oracle, nén OpenVINO) chạy ngầm dưới dạng background task. Trạng thái và tỷ lệ phần trăm hoàn thành được phát liên tục tới frontend qua giao thức SSE:
- **Endpoint**: `GET /api/v1/events/stream?channel_id={task_id}`
- **Format dữ liệu**:
  ```json
  {
    "task_id": "mining-job-091026-01",
    "status": "PROCESSING",
    "progress_percent": 68.5,
    "current_stage": "Calculating k-Center Greedy Core-Set (137/200)",
    "timestamp": "2026-10-09T22:20:00Z"
  }
  ```

---

## 5. Chuẩn Hóa Phản Hồi & Xử Lý Lỗi (Error Handling)

Tất cả API trả về cấu trúc JSON nhất quán:

```json
{
  "success": true,
  "data": { ... },
  "message": "Chiến dịch tính điểm Active Mining hoàn tất thành công",
  "timestamp": "2026-10-09T22:20:00Z"
}
```

Khi phát sinh lỗi ngoại lệ, hệ thống trả về mã trạng thái HTTP chuẩn kèm mã lỗi nghiệp vụ:
- `400 Bad Request`: Sai lệch tham số hoặc trọng số ngoài biên $[0, 1]$.
- `401 Unauthorized`: Token hết hạn hoặc không hợp lệ.
- `403 Forbidden`: Người gán nhãn cố gắng khóa tập kiểm thử (chỉ QA Lead mới có quyền).
- `404 Not Found`: Không tìm thấy bản ghi ảnh hoặc checkpoint mô hình.
- `422 Unprocessable Entity`: Dữ liệu payload không vượt qua kiểm định Pydantic.
