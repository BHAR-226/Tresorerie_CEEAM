import uuid
from datetime import datetime, timezone
from enum import Enum

from sqlalchemy import DateTime, Enum as SAEnum, String
from sqlalchemy.orm import Mapped, mapped_column


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class SyncStatus(str, Enum):
    SYNCED = "SYNCED"
    PENDING_PUSH = "PENDING_PUSH"


class UUIDMixin:
    """Clé primaire UUIDv4 générée côté client (offline-first)."""

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        index=True,
    )


class TimestampMixin:
    """created_at / updated_at / deleted_at pour audit + sync."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class SyncMixin:
    """Statut de synchronisation pour la stratégie offline-first."""

    sync_status: Mapped[SyncStatus] = mapped_column(
        SAEnum(SyncStatus, name="sync_status_enum"),
        nullable=False,
        default=SyncStatus.PENDING_PUSH,
    )


class BaseModelMixin(UUIDMixin, TimestampMixin, SyncMixin):
    """Mixin complet combinant UUID, Timestamp et Synchronisation."""
    pass
