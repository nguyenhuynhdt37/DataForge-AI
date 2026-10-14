import sys
from app.modules.projects import models as _projects_models

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.core.config import settings
from app.core.logger import setup_logging
from app.modules.auth.router import router as auth_router
from app.modules.projects.router import router as projects_router, integrations_router

from app.core.database import engine, Base, AsyncSessionLocal
from app.core.storage import storage_service
from app.modules.auth.service import AuthService

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"🚀 Khởi động {settings.APP_NAME} v{settings.VERSION}")
    
    # 1. Tự động khởi tạo bảng DB và cập nhật cột mới nếu chưa có (An toàn, không xóa dữ liệu cũ)
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(text("""
                DO $$ BEGIN
                    -- Users columns
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_token VARCHAR(500);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_user_id INTEGER;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_username VARCHAR(100);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_email VARCHAR(255);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_first_name VARCHAR(100);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_last_name VARCHAR(100);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_groups VARCHAR(255);
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS cvat_is_staff BOOLEAN DEFAULT FALSE;
                    ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_login BOOLEAN DEFAULT TRUE;

                    -- Projects columns
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'PUBLIC';
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50) DEFAULT 'ACTIVE_LEARNING_V3';
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'INITIALIZING';
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_frames INTEGER DEFAULT 0;
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS annotated_frames INTEGER DEFAULT 0;
                    ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

                    -- Project members columns
                    ALTER TABLE project_members ADD COLUMN IF NOT EXISTS invited_by_id UUID REFERENCES users(id) ON DELETE SET NULL;
                    ALTER TABLE project_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

                    -- Tasks columns
                    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES users(id) ON DELETE SET NULL;
                    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

                    -- Jobs columns
                    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS annotated_frames INTEGER DEFAULT 0;
                    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cvat_job_id INTEGER;
                    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cvat_url VARCHAR(500);
                    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
                    ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
                EXCEPTION WHEN OTHERS THEN
                    NULL;
                END $$;
            """))
        logger.info("✅ Database tables & schema migrations đã được đồng bộ hóa thành công.")
    except Exception as e:
        logger.error(f"❌ Lỗi đồng bộ database tables: {e}")

    # 2. Khởi tạo MinIO Buckets cho Storage
    try:
        storage_service.init_buckets()
    except Exception as e:
        logger.warning(f"⚠️ Chưa thể kết nối MinIO: {e}")

    # 3. Khởi tạo tài khoản Admin mặc định (nếu hệ thống chưa có user nào)
    try:
        async with AsyncSessionLocal() as session:
            await AuthService.bootstrap_initial_admin(session)
    except Exception as e:
        logger.warning(f"⚠️ Chưa thể tạo Admin mặc định: {e}")

    yield
    logger.info("🛑 Tắt hệ thống, dọn dẹp bộ nhớ...")


from app.shared.exceptions import setup_global_exception_handlers

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Đăng ký bộ xử lý lỗi toàn cục chuẩn hóa ApiResponse
setup_global_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn module Auth và Projects vào prefix /api/v1
app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(projects_router, prefix=settings.API_V1_PREFIX)
app.include_router(integrations_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root_healthcheck():
    return {
        "success": True, 
        "app": settings.APP_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1": settings.API_V1_PREFIX
    }

@app.get("/api/v1")
@app.get("/api/v1/")
async def api_v1_root():
    return {
        "success": True,
        "message": "GreenSM MLOps API v1 đang hoạt động ổn định.",
        "version": settings.VERSION,
        "docs": "/docs",
        "endpoints": {
            "auth": f"{settings.API_V1_PREFIX}/auth",
            "websocket": f"{settings.API_V1_PREFIX}/auth/ws"
        }
    }

# Hỗ trợ cả đường dẫn /api/v1/docs chuyển hướng mượt sang /docs
@app.get("/api/v1/docs", include_in_schema=False)
async def redirect_api_v1_docs():
    return RedirectResponse(url="/docs")
