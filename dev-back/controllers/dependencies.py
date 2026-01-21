from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt
from datetime import datetime, timedelta, UTC
from typing import Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from config import settings
from database import get_db, AsyncSessionLocal
from models import User as UserModel


class Token(BaseModel):
    access_token: str
    token_type: str


class User(BaseModel):
    id: int
    login: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    email: Optional[str] = None


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    else:
        expire = datetime.now(UTC) + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


async def get_token_from_header(authorization: Optional[str] = Header(None)) -> Optional[str]:
    if not authorization:
        return None
    if authorization.startswith("Bearer "):
        return authorization[7:]
    return None


async def get_current_user(token: Optional[str] = Depends(get_token_from_header)) -> Optional[User]:
    if not token:
        return None
    payload = verify_token(token)
    if not payload:
        return None
    return User(**payload)

