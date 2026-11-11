from datetime import date
from decimal import Decimal
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ExerciceAnnuel, ExerciceStatut
from app.services.bilan_service import get_kpis_exercice


def get_exercice_actif(db: Session) -> Optional[ExerciceAnnuel]:
    """Récupère l'exercice académique actuellement en cours."""
    return db.scalars(
        select(ExerciceAnnuel).where(
            ExerciceAnnuel.statut == ExerciceStatut.EN_COURS,
            ExerciceAnnuel.deleted_at.is_(None)
        ).order_by(ExerciceAnnuel.date_debut.desc())
    ).first()


def cloturer_exercice(db: Session, exercice_id: str) -> ExerciceAnnuel:
    """
    Clôture officiellement un exercice annuel :
    1. Vérifie son existence et son statut EN_COURS.
    2. Calcule le solde final disponible.
    3. Fige l'exercice en passant le statut à CLOTURE et enregistre la date de fin.
    """
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercice introuvable")

    if exercice.statut == ExerciceStatut.CLOTURE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet exercice est déjà clôturé"
        )

    # Date de fin aujourd'hui si non renseignée
    if not exercice.date_fin:
        exercice.date_fin = date.today()

    exercice.statut = ExerciceStatut.CLOTURE
    db.commit()
    db.refresh(exercice)
    return exercice


def ouvrir_nouvel_exercice(
    db: Session,
    libelle: str,
    date_debut: date,
    date_fin: Optional[date] = None,
    reporter_solde: bool = True
) -> ExerciceAnnuel:
    """
    Ouvre un nouvel exercice académique :
    - Vérifie que le libellé est unique.
    - Si reporter_solde est vrai, reporte automatiquement le solde final du dernier exercice clôturé.
    """
    # Vérification d'unicité
    existant = db.scalars(
        select(ExerciceAnnuel).where(ExerciceAnnuel.libelle == libelle)
    ).first()
    if existant:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Un exercice avec le libellé '{libelle}' existe déjà"
        )

    solde_initial = Decimal("0.00")
    if reporter_solde:
        # Trouver le dernier exercice clôturé
        dernier_cloture = db.scalars(
            select(ExerciceAnnuel).where(
                ExerciceAnnuel.statut == ExerciceStatut.CLOTURE,
                ExerciceAnnuel.deleted_at.is_(None)
            ).order_by(ExerciceAnnuel.date_debut.desc())
        ).first()

        if dernier_cloture:
            kpis = get_kpis_exercice(db, dernier_cloture.id)
            solde_initial = kpis["solde_disponible"]

    nouvel_exercice = ExerciceAnnuel(
        libelle=libelle,
        date_debut=date_debut,
        date_fin=date_fin,
        statut=ExerciceStatut.EN_COURS,
        solde_initial=solde_initial
    )
    db.add(nouvel_exercice)
    db.commit()
    db.refresh(nouvel_exercice)
    return nouvel_exercice
