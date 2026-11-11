from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.mixins import SyncMixin, TimestampMixin, UUIDMixin


class CategorieDepense(UUIDMixin, TimestampMixin, SyncMixin, Base):
    __tablename__ = "categories_depenses"

    activite_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("activites.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    nom: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relations
    activite = relationship("Activite", back_populates="categories")
    depenses = relationship(
        "Depense", back_populates="categorie"
    )