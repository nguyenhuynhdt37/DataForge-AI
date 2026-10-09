from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    APP_NAME: str = "GreenSM HITL Active Learning Lab"
    VERSION: str = "3.0.0"
    API_V1_PREFIX: str = "/api/v1"
    DEBUG: bool = True
    
    # Host & Port
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]
    
    # Thư mục dữ liệu & runs (tương đối theo repo root)
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent.parent
    DATASETS_DIR: Path = BASE_DIR / "datasets"
    RUNS_DIR: Path = BASE_DIR / "runs"
    DOCS_DIR: Path = BASE_DIR / "docs"
    GUIDELINE_PATH: Path = BASE_DIR / "ANNOTATION_GUIDELINE.md"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
