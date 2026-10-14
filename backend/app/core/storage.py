import io
import json
import uuid
from typing import Optional
from minio import Minio
from minio.error import S3Error
from fastapi import HTTPException, status
from loguru import logger
from app.core.config import settings

class StorageService:
    def __init__(self):
        self._client: Optional[Minio] = None

    @property
    def client(self) -> Minio:
        if self._client is None:
            self._client = Minio(
                settings.MINIO_ENDPOINT,
                access_key=settings.MINIO_ACCESS_KEY,
                secret_key=settings.MINIO_SECRET_KEY,
                secure=settings.MINIO_SECURE
            )
        return self._client

    def init_buckets(self):
        """Khởi tạo các bucket cần thiết và thiết lập quyền truy cập công khai nếu cần."""
        try:
            client = self.client
            bucket_name = settings.MINIO_BUCKET_AVATARS
            if not client.bucket_exists(bucket_name):
                client.make_bucket(bucket_name)
                logger.info(f"✅ Đã tạo MinIO bucket: '{bucket_name}'")

            # Thiết lập chính sách Public Read cho bucket avatars
            policy = {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{bucket_name}/*"]
                    }
                ]
            }
            client.set_bucket_policy(bucket_name, json.dumps(policy))
            logger.info(f"✅ Đã cấu hình Public Read policy cho bucket: '{bucket_name}'")
        except Exception as e:
            logger.warning(f"⚠️ Chưa thể kết nối MinIO lúc startup ({e}). Sẽ thử lại khi có request.")

    def validate_image_file(self, content: bytes, content_type: str) -> str:
        """Kiểm tra kích thước và Magic Bytes để ngăn chặn mã độc giả mạo đuôi ảnh."""
        max_size = 3 * 1024 * 1024 # 3 MB
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Kích thước ảnh đại diện vượt quá giới hạn tối đa 3 MB."
            )

        # Kiểm tra Magic Bytes
        if content.startswith(b"\xff\xd8\xff"):
            return ".jpg"
        elif content.startswith(b"\x89PNG\r\n\x1a\n"):
            return ".png"
        elif content.startswith(b"RIFF") and len(content) > 12 and content[8:12] == b"WEBP":
            return ".webp"
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng ảnh không hợp lệ. Chỉ chấp nhận JPG, PNG hoặc WebP nguyên bản."
        )

    def upload_avatar(self, user_id: uuid.UUID, content: bytes, content_type: str) -> str:
        """Upload avatar lên MinIO với tên UUID ngẫu nhiên an toàn và trả về URL."""
        ext = self.validate_image_file(content, content_type)
        filename = f"{user_id}/{uuid.uuid4().hex}{ext}"
        bucket_name = settings.MINIO_BUCKET_AVATARS

        try:
            # Đảm bảo bucket tồn tại
            if not self.client.bucket_exists(bucket_name):
                self.init_buckets()

            data_stream = io.BytesIO(content)
            self.client.put_object(
                bucket_name=bucket_name,
                object_name=filename,
                data=data_stream,
                length=len(content),
                content_type=content_type
            )
            # URL truy cập công khai
            public_url = f"{settings.MINIO_PUBLIC_URL}/{bucket_name}/{filename}"
            logger.info(f"📸 Đã upload avatar thành công cho user {user_id}: {public_url}")
            return public_url
        except S3Error as e:
            logger.error(f"❌ Lỗi MinIO khi upload avatar: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Lỗi hệ thống lưu trữ hình ảnh: {e.message}"
            )

    def delete_file_by_url(self, file_url: str):
        """Xóa file cũ trên MinIO khi người dùng thay đổi avatar mới."""
        if not file_url:
            return
        bucket_name = settings.MINIO_BUCKET_AVATARS
        prefix = f"{settings.MINIO_PUBLIC_URL}/{bucket_name}/"
        if file_url.startswith(prefix):
            object_name = file_url[len(prefix):]
            try:
                self.client.remove_object(bucket_name, object_name)
                logger.info(f"🗑️ Đã xóa file cũ trên MinIO: {object_name}")
            except Exception as e:
                logger.warning(f"⚠️ Không thể xóa file cũ trên MinIO: {e}")

storage_service = StorageService()
