"""
Module de compatibilité ré-exportant les paramètres depuis app.core.config.
"""
from app.core.config import Settings, get_settings, settings

__all__ = ["Settings", "get_settings", "settings"]
