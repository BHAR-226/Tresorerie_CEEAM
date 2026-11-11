from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SyncMixin, TimestampMixin, UUIDMixin
from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String, Text


class Cotisation(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "cotisations"
    __table_args__ = (CheckConstraint("montant > 0", name="ck_cotisation_montant_positif"),)

    etudiant_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("etudiants.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    exercice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exercices_annuels.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    montant: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    date_paiement: Mapped[date] = mapped_column(Date, nullable=False)
    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relations
    etudiant = relationship("Etudiant", back_populates="cotisations")
    exercice = relationship("ExerciceAnnuel", back_populates="cotisations")