from pydantic import BaseModel, Field
from decimal import Decimal

from app.schemas.common import UUIDModel


class EtudiantBase(BaseModel):
    pays_id: str
    nom: str = Field(..., min_length=1, max_length=100)
    prenom: str = Field(..., min_length=1, max_length=100)
    niveau: str = Field(..., min_length=1, max_length=50, examples=["3ème année"])
    actif: bool = True


class EtudiantCreate(EtudiantBase):
    pass


class EtudiantUpdate(BaseModel):
    pays_id: str | None = None
    nom: str | None = Field(None, min_length=1, max_length=100)
    prenom: str | None = Field(None, min_length=1, max_length=100)
    niveau: str | None = Field(None, min_length=1, max_length=50)
    actif: bool | None = None


class EtudiantRead(UUIDModel):
    pays_id: str
    nom: str
    prenom: str
    niveau: str
    actif: bool
    # Champs calculés optionnels
    total_cotise: Decimal | None = None