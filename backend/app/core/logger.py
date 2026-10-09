import sys
import logging
from loguru import logger

class InterceptHandler(logging.Handler):
    """Bắt các log của hệ thống chuẩn (Uvicorn/FastAPI) đẩy sang Loguru"""
    def emit(self, record):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())

def setup_logging():
    # Xóa cấu hình mặc định
    logger.remove()
    
    # Format log console màu mè đẹp mắt chuẩn 2026
    fmt = "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
    logger.add(sys.stdout, colorize=True, format=fmt, level="DEBUG")
    
    # Chặn log mặc định của Uvicorn
    logging.getLogger("uvicorn.access").handlers = [InterceptHandler()]
    logging.getLogger("uvicorn.error").handlers = [InterceptHandler()]
    logging.getLogger("fastapi").handlers = [InterceptHandler()]
