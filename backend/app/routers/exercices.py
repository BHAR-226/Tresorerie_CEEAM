from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.users import User
from app.models.exercices_annuels import ExerciceAnnuel
from app.core.security import get_current_admin
from app.schemas.exercice import ExerciceCreate, ExerciceResponse, ExerciceUpdate
from app.services.exercice_service import (
    get_exercice_actif,
    cloturer_exercice as service_cloturer_exercice,
    ouvrir_nouvel_exercice,
)

router = APIRouter(prefix="/exercices", tags=["Exercices Annuels"])


@router.get("", response_model=List[ExerciceResponse])
def lister_exercices(db: Session = Depends(get_db)):
    """Liste tous les exercices académiques enregistrés (en cours et clôturés)."""
    return db.scalars(
        select(ExerciceAnnuel).where(
            ExerciceAnnuel.deleted_at.is_(None)
        ).order_by(ExerciceAnnuel.date_debut.desc())
    ).all()


@router.get("/actif", response_model=ExerciceResponse)
def obtenir_exercice_actif(db: Session = Depends(get_db)):
    """Récupère l'exercice académique actif en cours."""
    exercice = get_exercice_actif(db)
    if not exercice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun exercice actif trouvé"
        )
    return exercice


@router.get("/{exercice_id}", response_model=ExerciceResponse)
def obtenir_exercice(exercice_id: str, db: Session = Depends(get_db)):
    """Récupère les détails d'un exercice spécifique."""
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exercice non trouvé"
        )
    return exercice


@router.post("", response_model=ExerciceResponse, status_code=status.HTTP_201_CREATED)
def creer_exercice(
    data: ExerciceCreate,
    reporter_solde: bool = Query(True, description="Reporter le solde du dernier exercice clôturé"),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Ouvre une nouvelle année académique (Réservé au Trésorier).
    Reporte automatiquement le solde disponible de l'exercice précédent.
    """
    return ouvrir_nouvel_exercice(
        db=db,
        libelle=data.libelle,
        date_debut=data.date_debut,
        date_fin=data.date_fin,
        reporter_solde=reporter_solde
    )


@router.post("/{exercice_id}/cloturer", response_model=ExerciceResponse)
def cloturer_exercice_route(
    exercice_id: str,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Clôture officiellement un exercice annuel (Réservé au Trésorier).
    Les comptes de cette année sont désormais figés.
    """
    return service_cloturer_exercice(db=db, exercice_id=exercice_id)
