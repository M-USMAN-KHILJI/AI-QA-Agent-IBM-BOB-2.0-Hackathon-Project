"""
database.py — PostgreSQL connection and session management for aidb
"""
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# PostgreSQL Engine (connects to localhost:5432/aidb)
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for thread-safe database sessions with auto-cleanup."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initializes tables in PostgreSQL database aidb."""
    try:
        Base.metadata.create_all(bind=engine)
        print("PostgreSQL aidb tables initialized successfully.")
    except Exception as e:
        print(f"PostgreSQL init warning: {e}")
