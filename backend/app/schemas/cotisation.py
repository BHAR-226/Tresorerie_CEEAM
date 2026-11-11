import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# PAYS SCHEMAS
# ==========================================
class PaysBase(BaseModel):
    nom: str
    code_iso: Optional[str] = Field(None, max_length=5, description="Ex: SN, CI, ML, GA")


class PaysCreate(PaysBase):
    pass


class PaysUpdate(BaseModel):
    nom: Optional[str] = None
    code_iso: Optional[str] = None


class PaysResponse(PaysBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaysStatsResponse(PaysResponse):
    nombre_etudiants: int = 0
    total_cotise: Decimal = Decimal("0.00")
    taux_participation: float = 0.0  # Pourcentage d'étudiants ayant cotisé


# ==========================================
# ETUDIANT SCHEMAS
# ==========================================
class EtudiantBase(BaseModel):
    pays_id: uuid.UUID
    nom: str
    prenom: str
    niveau: str = Field(..., description="Ex: 1ère année, 2ème année, etc.")
    actif: bool = True


class EtudiantCreate(EtudiantBase):
    pass


class EtudiantUpdate(BaseModel):
    pays_id: Optional[uuid.UUID] = None
    nom: Optional[str] = None
    prenom: Optional[str] = None
    niveau: Optional[str] = None
    actif: Optional[bool] = None


class EtudiantResponse(EtudiantBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    pays: Optional[PaysResponse] = None
    total_cotise: Optional[Decimal] = Decimal("0.00")

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# COTISATION SCHEMAS
# ==========================================
class CotisationBase(BaseModel):
    etudiant_id: uuid.UUID
    exercice_id: uuid.UUID
    montant: Decimal = Field(..., gt=0, description="Montant versé en MAD")
    date_paiement: date
    commentaire: Optional[str] = Field(None, description="Ex: Tranche 1, Paiement total")


class CotisationCreate(CotisationBase):
    pass


class CotisationUpdate(BaseModel):
    montant: Optional[Decimal] = Field(None, gt=0)
    date_paiement: Optional[date] = None
    commentaire: Optional[str] = None


class CotisationResponse(CotisationBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    etudiant: Optional[EtudiantResponse] = None

    model_config = ConfigDict(from_attributes=True)
