from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SyncMixin, TimestampMixin, UUIDMixin


class Activite(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "activites"

    exercice_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("exercices_annuels.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nom: Mapped[str] = mapped_column(String(150), nullable=False)
    date_activite: Mapped[date] = mapped_column(Date, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    budget_prevu: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Relations
    exercice = relationship("ExerciceAnnuel", back_populates="activites")
    categories = relationship(
        "CategorieDepense", back_populates="activite"
    )