from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SyncMixin, TimestampMixin, UUIDMixin
from sqlalchemy import CheckConstraint, Date, ForeignKey, Numeric, String


class Depense(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "depenses"
    __table_args__ = (CheckConstraint("prix > 0", name="ck_depense_prix_positif"),)


    categorie_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("categories_depenses.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nom: Mapped[str] = mapped_column(String(150), nullable=False)
    prix: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    date_depense: Mapped[date] = mapped_column(Date, nullable=False)
    justificatif_url: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relations
    categorie = relationship("CategorieDepense", back_populates="depenses")