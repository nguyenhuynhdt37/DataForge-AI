from fastapi import HTTPException, status

class AppBaseException(HTTPException):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        super().__init__(status_code=status_code, detail=detail)

class DatasetNotFoundError(AppBaseException):
    def __init__(self, detail: str = "Tập dữ liệu không tồn tại"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)

class ModelCheckpointNotFoundError(AppBaseException):
    def __init__(self, detail: str = "Checkpoint mô hình chưa được huấn luyện"):
        super().__init__(detail=detail, status_code=status.HTTP_404_NOT_FOUND)
