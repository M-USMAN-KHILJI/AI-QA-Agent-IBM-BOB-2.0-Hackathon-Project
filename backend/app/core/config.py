"""
config.py — Application-wide settings loaded from environment variables / .env

Settings:
  UPLOAD_DIR          Directory where incoming zip files are stored temporarily.
  SANDBOX_RUNS_DIR    Directory where per-run evidence and reports are stored.
  MAX_ZIP_BYTES       Maximum allowed compressed zip size (default 200 MB).
  CONTAINER_IMAGE     Docker image name for the sandbox (qa-sandbox-base:latest).
  BOB_API_KEY         IBM Bob vision LLM API key.
  OPENAI_API_KEY      OpenAI GPT-4o fallback API key.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    UPLOAD_DIR: str = "uploads"
    SANDBOX_RUNS_DIR: str = "sandbox-runs"
    MAX_ZIP_BYTES: int = 200 * 1024 * 1024  # 200 MB
    CONTAINER_IMAGE: str = "qa-sandbox-base:latest"
    BOB_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
