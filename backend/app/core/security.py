import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Any
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models import User, UserRole
from app.schemas.user import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifie la correspondance entre un mot de passe en clair et son empreinte bcrypt."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    """Génère l'empreinte bcrypt sécurisée d'un mot de passe."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def create_access_token(subject: str | Any, role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Génère un jeton JWT signé avec expiration."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role,
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[TokenPayload]:
    """Décode et valide un jeton JWT."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(
            sub=payload.get("sub"),
            role=payload.get("role")
        )
        return token_data
    except (jwt.PyJWTError, Exception):
        return None


def get_current_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme)
) -> Optional[User]:
    """
    Récupère l'utilisateur actuellement connecté si un token valide est fourni.
    Renvoie None pour un visiteur non authentifié.
    """
    if not token:
        return None

    token_data = decode_access_token(token)
    if not token_data or not token_data.sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton d'authentification invalide ou expiré",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_uuid = uuid.UUID(token_data.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant de jeton invalide",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == str(user_uuid), User.deleted_at.is_(None)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur introuvable"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Compte utilisateur inactif"
        )
    return user


def get_current_admin(
    current_user: Optional[User] = Depends(get_current_user)
) -> User:
    """
    Dépendance stricte pour les actions réservées au Trésorier (Administrateur).
    Bloque les visiteurs et les requêtes non authentifiées.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentification requise pour cette action",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits d'administrateur (Trésorier) requis"
        )
    return current_user
