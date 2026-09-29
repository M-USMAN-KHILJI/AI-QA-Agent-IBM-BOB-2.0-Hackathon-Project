"""
auth_schemas.py — Pydantic models for authentication requests and responses
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)")


class UserLoginRequest(BaseModel):
    email_or_username: str = Field(..., description="User email or username")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
