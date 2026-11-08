from pydantic import BaseModel, Field
from decimal import Decimal
from app.schemas.common import UUIDModel


class PaysBase(BaseModel):
    nom: str = Field(..., min_length=1, max_length=100, examples=["Sénégal"])
    code_iso: str | None = Field(None, min_length=2, max_length=5, examples=["SN"])


class PaysCreate(PaysBase):
    pass


class PaysUpdate(BaseModel):
    nom: str | None = Field(None, min_length=1, max_length=100)
    code_iso: str | None = Field(None, min_length=2, max_length=5)


class PaysRead(UUIDModel):
    nom: str
    code_iso: str | None
    # Champs calculés (remplis par la route) : nb_etudiants, total_cotise
    nb_etudiants: int | None = None
    total_cotise: Decimal | None = None