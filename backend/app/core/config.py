"""
ClassPulse AI — Backend Configuration.
Reads from environment variables and .env file with safe production defaults.
"""
import os
from functools import lru_cache
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server / Render configuration
    host: str = "0.0.0.0"
    port: int = int(os.environ.get("PORT", 8000))

    # YOLO Model
    yolo_model: str = "yolov8n.pt"
    confidence_threshold: float = 0.40

    # Image validation limits
    max_upload_size_bytes: int = 5 * 1024 * 1024  # 5 MB
    min_image_dim: int = 32
    max_image_dim: int = 4096

    # Inference concurrency limit (serialize on single-core / low-RAM tiers)
    max_concurrent_inferences: int = 1

    # In-memory rate limiting (requests per minute per client IP)
    rate_limit_per_minute: int = 60

    # CORS configuration
    cors_origins: Union[str, List[str]] = ["*"]

    @field_validator("cors_origins", mode="before")
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
