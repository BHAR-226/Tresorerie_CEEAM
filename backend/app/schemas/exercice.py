import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from app.models.exercice import ExerciceStatut


class ExerciceBase(BaseModel):
    libelle: str = Field(..., description="Ex: 2026-2027")
    date_debut: date
    date_fin: Optional[date] = None
    solde_initial: Decimal = Field(default=Decimal("0.00"), ge=0, description="Report de l'exercice précédent")


class ExerciceCreate(ExerciceBase):
    statut: ExerciceStatut = ExerciceStatut.EN_COURS


class ExerciceUpdate(BaseModel):
    libelle: Optional[str] = None
    date_debut: Optional[date] = None
    date_fin: Optional[date] = None
    statut: Optional[ExerciceStatut] = None
    solde_initial: Optional[Decimal] = None


class ExerciceResponse(ExerciceBase):
    id: uuid.UUID
    statut: ExerciceStatut
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
