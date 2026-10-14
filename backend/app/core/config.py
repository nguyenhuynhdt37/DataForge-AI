from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "GreenSM MLOps Backend"
    VERSION: str = "3.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # JWT Security
    SECRET_KEY: str
    REFRESH_SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # MinIO Storage
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minio_admin"
    MINIO_SECRET_KEY: str = "SecretPassword2026!"
    MINIO_BUCKET_AVATARS: str = "greensm-avatars"
    MINIO_PUBLIC_URL: str = "http://localhost:9000"
    MINIO_SECURE: bool = False

    # Bootstrap Initial Admin
    INITIAL_ADMIN_EMAIL: str = "admin@greensm.vn"
    INITIAL_ADMIN_PASSWORD: str = "AdminSecret2026!"
    INITIAL_ADMIN_NAME: str = "GreenSM System Admin"

    # SMTP Email
    SMTP_ENABLED: bool = True
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_NAME: str = "GreenSM MLOps Hub"
    SMTP_FROM_EMAIL: str = ""
    SMTP_TLS: bool = True
    
    # CVAT Host Integration
    CVAT_BASE_URL: str = "https://cvat.itup.io.vn"
    CVAT_ADMIN_TOKEN: str = ""
    CVAT_WEBHOOK_SECRET: str = "greensm-cvat-secret-2026"
    
    # Dirs
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATASETS_DIR: Path = BASE_DIR / "datasets"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
