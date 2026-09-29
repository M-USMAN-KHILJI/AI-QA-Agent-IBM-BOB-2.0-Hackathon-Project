"""
auth.py — Authentication API endpoints (Register, Login, Me)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    hash_password,
    require_current_user,
    verify_password,
)
from app.models.auth_schemas import AuthResponse, UserLoginRequest, UserRegisterRequest, UserResponse
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Registers a new user account into PostgreSQL database aidb."""
    cleaned_username = req.username.strip()
    cleaned_email = req.email.strip().lower()

    if not cleaned_email or "@" not in cleaned_email or "." not in cleaned_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address.",
        )

    # Check for existing username
    existing_user = db.query(User).filter(User.username.ilike(cleaned_username)).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken. Please choose another.",
        )

    # Check for existing email
    existing_email = db.query(User).filter(User.email.ilike(cleaned_email)).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered. Please sign in instead.",
        )

    # Hash password & create user
    hashed_pw = hash_password(req.password)
    user = User(
        username=cleaned_username,
        email=cleaned_email,
        hashed_password=hashed_pw,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue token
    token = create_access_token(data={"sub": str(user.id), "username": user.username})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
@router.post("/signin", response_model=AuthResponse)
async def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticates user credentials and issues a signed JWT token."""
    identifier = req.email_or_username.strip().lower()

    # Query by username OR email
    user = db.query(User).filter(
        or_(
            User.email.ilike(identifier),
            User.username.ilike(identifier),
        )
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please verify your email/username and password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue token
    token = create_access_token(data={"sub": str(user.id), "username": user.username})

    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(require_current_user)):
    """Returns the profile of the currently logged-in user."""
    return UserResponse.model_validate(current_user)
