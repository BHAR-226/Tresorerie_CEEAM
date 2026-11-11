import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# DEPENSE INDIVIDUELLE SCHEMAS
# ==========================================
class DepenseBase(BaseModel):
    categorie_id: uuid.UUID
    nom: str = Field(..., description="Ex: Location de bus, Pain, Café")
    prix: Decimal = Field(..., gt=0, description="Montant en MAD")
    date_depense: date
    justificatif_url: Optional[str] = Field(None, description="URL ou chemin du reçu/facture")


class DepenseCreate(DepenseBase):
    pass


class DepenseUpdate(BaseModel):
    categorie_id: Optional[uuid.UUID] = None
    nom: Optional[str] = None
    prix: Optional[Decimal] = Field(None, gt=0)
    date_depense: Optional[date] = None
    justificatif_url: Optional[str] = None


class DepenseResponse(DepenseBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# CATEGORIE DE DEPENSE SCHEMAS
# ==========================================
class CategorieDepenseBase(BaseModel):
    activite_id: uuid.UUID
    nom: str = Field(..., description="Ex: Bus, Nourriture, Logistique")


class CategorieDepenseCreate(CategorieDepenseBase):
    pass


class CategorieDepenseUpdate(BaseModel):
    nom: Optional[str] = None


class CategorieDepenseResponse(CategorieDepenseBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    total_categorie: Decimal = Decimal("0.00")
    depenses: List[DepenseResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# ACTIVITE SCHEMAS
# ==========================================
class ActiviteBase(BaseModel):
    exercice_id: uuid.UUID
    nom: str = Field(..., description="Ex: Sortie Ifrane, Journée d'intégration")
    description: Optional[str] = None
    date_activite: date
    budget_prevu: Optional[Decimal] = Field(None, ge=0, description="Budget prévisionnel optionnel")


class ActiviteCreate(ActiviteBase):
    pass


class ActiviteUpdate(BaseModel):
    nom: Optional[str] = None
    description: Optional[str] = None
    date_activite: Optional[date] = None
    budget_prevu: Optional[Decimal] = None


class ActiviteResponse(ActiviteBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    total_depense: Decimal = Decimal("0.00")
    depassement_budget: bool = False
    categories: List[CategorieDepenseResponse] = []

    model_config = ConfigDict(from_attributes=True)
