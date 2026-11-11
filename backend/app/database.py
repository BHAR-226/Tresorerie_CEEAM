"""
Module de compatibilité unifiant l'accès à la base de données.
Permet d'importer directement depuis app.database ou app.db.
"""
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal, get_db

__all__ = [
    "settings",
    "Base",
    "engine",
    "SessionLocal",
    "get_db",
]
