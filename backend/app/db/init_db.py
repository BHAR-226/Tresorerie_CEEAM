from datetime import date
from decimal import Decimal
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import engine
import app.models  # Charge tous les modèles
from app.models.user import User, UserRole
from app.models.exercice import ExerciceAnnuel, ExerciceStatut
from app.models.cotisation import Pays

# Liste par défaut des pays membres de la CEEAM
PAYS_MEMBRES_CEEAM = [
    {"nom": "Bénin", "code_iso": "BJ"},
    {"nom": "Burkina Faso", "code_iso": "BF"},
    {"nom": "Cameroun", "code_iso": "CM"},
    {"nom": "Centrafrique", "code_iso": "CF"},
    {"nom": "Comores", "code_iso": "KM"},
    {"nom": "Congo (Brazzaville)", "code_iso": "CG"},
    {"nom": "RD Congo", "code_iso": "CD"},
    {"nom": "Côte d'Ivoire", "code_iso": "CI"},
    {"nom": "Gabon", "code_iso": "GA"},
    {"nom": "Guinée", "code_iso": "GN"},
    {"nom": "Madagascar", "code_iso": "MG"},
    {"nom": "Mali", "code_iso": "ML"},
    {"nom": "Mauritanie", "code_iso": "MR"},
    {"nom": "Niger", "code_iso": "NE"},
    {"nom": "Sénégal", "code_iso": "SN"},
    {"nom": "Tchad", "code_iso": "TD"},
    {"nom": "Togo", "code_iso": "TG"},
]


def init_db(db: Session) -> None:
    """
    Initialise la base de données :
    1. Crée les tables si inexistantes.
    2. Crée l'administrateur / Trésorier par défaut.
    3. Injecte les pays membres de la CEEAM.
    4. Initialise l'exercice en cours si absent.
    """
    # 1. Création des tables physiques
    Base.metadata.create_all(bind=engine)

    # 2. Création de l'administrateur par défaut
    admin = db.query(User).filter(User.email == settings.FIRST_SUPERUSER_EMAIL).first()
    if not admin:
        admin = User(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password_hash=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
            nom=settings.FIRST_SUPERUSER_NOM,
            prenom=settings.FIRST_SUPERUSER_PRENOM,
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)

    # 3. Injection des pays membres
    for pays_data in PAYS_MEMBRES_CEEAM:
        existing = db.query(Pays).filter(Pays.nom == pays_data["nom"]).first()
        if not existing:
            pays = Pays(nom=pays_data["nom"], code_iso=pays_data["code_iso"])
            db.add(pays)

    # 4. Création de l'exercice par défaut (ex: 2026-2027)
    exercice_actif = db.query(ExerciceAnnuel).filter(ExerciceAnnuel.statut == ExerciceStatut.EN_COURS).first()
    if not exercice_actif:
        exercice_actif = ExerciceAnnuel(
            libelle="2026-2027",
            date_debut=date(2026, 9, 1),
            statut=ExerciceStatut.EN_COURS,
            solde_initial=Decimal("0.00")
        )
        db.add(exercice_actif)

    db.commit()
