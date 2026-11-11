from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import TimestampMixin, UUIDMixin, SyncMixin


class Etudiant(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "etudiants"

    pays_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("pays.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    prenom: Mapped[str] = mapped_column(String(100), nullable=False)
    niveau: Mapped[str] = mapped_column(String(50), nullable=False)
    # statut actif/inactif
    actif: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relations
    pays = relationship("Pays", back_populates="etudiants")
    cotisations = relationship("Cotisation", back_populates="etudiant")