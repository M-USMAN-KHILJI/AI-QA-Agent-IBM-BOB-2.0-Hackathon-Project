"""
config.py — Application-wide settings loaded from environment variables / .env
"""
from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    UPLOAD_DIR: str = "uploads"
    SANDBOX_RUNS_DIR: str = "sandbox-runs"
    MAX_ZIP_BYTES: int = 50 * 1024 * 1024        # 50 MB compressed cap
    MAX_UNCOMPRESSED_BYTES: int = 200 * 1024 * 1024  # 200 MB uncompressed cap
    CONTAINER_IMAGE: str = "qa-sandbox-base:latest"

    # OpenAI-compatible Vision / LLM API configuration (NVIDIA / OpenAI)
    OPENAI_BASE_URL: str = "OPENAI-BASE-URL"
    OPENAI_API_KEY: str = "OPENAI-API-KEY"
    OPENAI_MODEL: str = "MODEL"
    BOB_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
