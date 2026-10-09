import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.core.config import settings
from app.core.logger import setup_logging
from app.shared.exceptions import AppBaseException

from app.modules.data_lab.router import router as data_lab_router
from app.modules.active_mining.router import router as active_mining_router
from app.modules.hitl_studio.router import router as hitl_studio_router
from app.modules.training.router import router as training_router
from app.modules.benchmark.router import router as benchmark_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"🚀 Khởi động {settings.APP_NAME} v{settings.VERSION}")
    settings.DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    yield
    logger.info("🛑 Tắt hệ thống, dọn dẹp bộ nhớ...")

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan, docs_url=f"{settings.API_V1_PREFIX}/docs")

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.mount("/datasets", StaticFiles(directory=str(settings.DATASETS_DIR)), name="datasets")

app.include_router(data_lab_router, prefix=settings.API_V1_PREFIX)
app.include_router(active_mining_router, prefix=settings.API_V1_PREFIX)
app.include_router(hitl_studio_router, prefix=settings.API_V1_PREFIX)
app.include_router(training_router, prefix=settings.API_V1_PREFIX)
app.include_router(benchmark_router, prefix=settings.API_V1_PREFIX)

@app.get("/")
async def root_healthcheck():
    return {"success": True, "message": "API Backend hoạt động hoàn hảo!"}
