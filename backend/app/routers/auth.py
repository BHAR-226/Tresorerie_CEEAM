from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User, UserRole
from app.core.security import verify_password, create_access_token, get_current_user
from app.schemas.user import Token, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Connexion sécurisée pour le Trésorier (Administrateur).
    Accepte email (dans le champ username) et mot de passe.
    """
    user = db.scalars(
        select(User).where(
            User.email == form_data.username,
            User.deleted_at.is_(None)
        )
    ).first()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ce compte utilisateur est désactivé"
        )

    access_token = create_access_token(subject=user.id, role=user.role.value)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_nom": user.nom,
        "user_prenom": user.prenom,
    }


@router.get("/me", response_model=UserResponse)
def get_mon_profil(current_user: User = Depends(get_current_user)):
    """Récupère le profil de l'utilisateur actuellement authentifié."""
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non authentifié")
    return current_user
