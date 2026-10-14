from datetime import datetime
from typing import Any
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from loguru import logger

class AppBaseException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST, error_code: str = "BAD_REQUEST"):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code

class DatasetNotFoundError(AppBaseException):
    def __init__(self, detail: str = "Tập dữ liệu không tồn tại"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND, error_code="DATASET_NOT_FOUND")

class ModelCheckpointNotFoundError(AppBaseException):
    def __init__(self, detail: str = "Checkpoint mô hình chưa được huấn luyện"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND, error_code="CHECKPOINT_NOT_FOUND")

class RateLimitException(HTTPException):
    def __init__(
        self,
        detail: str = "Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.",
        retry_after: int = 60,
        error_code: str = "RATE_LIMIT_EXCEEDED"
    ):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            headers={"Retry-After": str(retry_after)}
        )
        self.retry_after = retry_after
        self.error_code = error_code

def setup_global_exception_handlers(app: FastAPI) -> None:
    """Đăng ký các bộ xử lý lỗi toàn cục để chuẩn hóa mọi phản hồi theo schema ApiResponse."""

    @app.exception_handler(RateLimitException)
    async def rate_limit_handler(request: Request, exc: RateLimitException) -> JSONResponse:
        logger.warning(f"⚠️ [RATE_LIMIT] {request.method} {request.url.path} - {exc.detail} (Retry-After: {exc.retry_after}s)")
        headers = {"Retry-After": str(exc.retry_after)}
        content = {
            "success": False,
            "message": exc.detail,
            "data": None,
            "error_code": exc.error_code,
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
        return JSONResponse(status_code=status.HTTP_429_TOO_MANY_REQUESTS, content=content, headers=headers)

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        logger.warning(f"⚠️ [VALIDATION_ERROR] {request.method} {request.url.path} - {len(exc.errors())} lỗi")
        err_msgs: list[str] = []
        for err in exc.errors():
            loc = [str(x) for x in err.get("loc", []) if x != "body"]
            field_name = ".".join(loc)
            msg = err.get("msg", "Dữ liệu không hợp lệ")
            if field_name:
                err_msgs.append(f"{field_name}: {msg}")
            else:
                err_msgs.append(msg)

        combined_message = "Dữ liệu yêu cầu không hợp lệ"
        if err_msgs:
            combined_message = f"Dữ liệu không hợp lệ: {'; '.join(err_msgs)}"

        content = {
            "success": False,
            "message": combined_message,
            "data": None,
            "error_code": "VALIDATION_ERROR",
            "detail": exc.errors(),
            "timestamp": datetime.utcnow().isoformat()
        }
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content)

    @app.exception_handler(StarletteHTTPException)
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        status_code = exc.status_code
        status_code_map = {
            status.HTTP_400_BAD_REQUEST: "BAD_REQUEST",
            status.HTTP_401_UNAUTHORIZED: "UNAUTHORIZED",
            status.HTTP_403_FORBIDDEN: "FORBIDDEN",
            status.HTTP_404_NOT_FOUND: "NOT_FOUND",
            status.HTTP_405_METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
            status.HTTP_409_CONFLICT: "CONFLICT",
            status.HTTP_422_UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
            status.HTTP_429_TOO_MANY_REQUESTS: "RATE_LIMIT_EXCEEDED",
            status.HTTP_500_INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
        }
        error_code = getattr(exc, "error_code", None) or status_code_map.get(status_code, f"HTTP_{status_code}")
        message = exc.detail if isinstance(exc.detail, str) else "Lỗi xử lý yêu cầu"

        content = {
            "success": False,
            "message": message,
            "data": None,
            "error_code": error_code,
            "detail": exc.detail,
            "timestamp": datetime.utcnow().isoformat()
        }
        headers = getattr(exc, "headers", None)
        return JSONResponse(status_code=status_code, content=content, headers=headers)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(f"❌ [INTERNAL_SERVER_ERROR] {request.method} {request.url.path} - Exception: {exc}")
        content = {
            "success": False,
            "message": "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng liên hệ quản trị viên.",
            "data": None,
            "error_code": "INTERNAL_SERVER_ERROR",
            "detail": "Đã xảy ra sự cố không mong muốn trong quá trình xử lý hệ thống.",
            "timestamp": datetime.utcnow().isoformat()
        }
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=content)
