from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    """Base pour les schémas de sortie lus depuis un objet SQLAlchemy."""
    model_config = ConfigDict(from_attributes=True)


class UUIDModel(ORMModel):
    """Ajoute id (str) et les timestamps d'audit."""
    id: str
    created_at: datetime
    updated_at: datetime


class AmountFieldMixin(BaseModel):
    """Validateur réutilisable pour les montants en MAD (positifs, 2 décimales max)."""
    # on ne met pas de champ ici, juste un placeholder pour la doc
    pass