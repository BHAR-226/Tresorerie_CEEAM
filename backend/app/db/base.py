import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import DateTime, Uuid
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Classe de base déclarative pour tous les modèles SQLAlchemy."""
    pass


class BaseModelMixin:
    """
    Mixin commun intégrant les standards requis :
    - Identifiant unique UUIDv4 pour éviter les conflits hors-ligne (Offline-First).
    - Horodatages UTC d'audit (created_at, updated_at).
    - Soft delete (deleted_at) indispensable pour la synchronisation bidirectionnelle.
    """
    id: Mapped[uuid.UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    deleted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None
    )
