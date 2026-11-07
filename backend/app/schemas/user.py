import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    nom: str
    prenom: str
    email: EmailStr
    role: UserRole = UserRole.ADMIN
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Schémas pour l'authentification JWT
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_nom: str
    user_prenom: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None  # user_id
    role: Optional[str] = None
