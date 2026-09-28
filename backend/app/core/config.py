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
    OPENAI_BASE_URL: str = "https://integrate.api.nvidia.com/v1"
    OPENAI_API_KEY: str = "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"
    OPENAI_MODEL: str = "openai/gpt-oss-20b"
    BOB_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
