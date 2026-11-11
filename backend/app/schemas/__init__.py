from app.schemas.common import ORMModel, UUIDModel
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    Token,
    TokenPayload,
)
from app.schemas.exercice import (
    ExerciceBase,
    ExerciceCreate,
    ExerciceUpdate,
    ExerciceResponse,
)
from app.schemas.pays import (
    PaysBase,
    PaysCreate,
    PaysUpdate,
    PaysRead,
)
from app.schemas.etudiant import (
    EtudiantBase,
    EtudiantCreate,
    EtudiantUpdate,
    EtudiantRead,
)
from app.schemas.cotisation import (
    PaysResponse,
    PaysStatsResponse,
    EtudiantResponse,
    CotisationBase,
    CotisationCreate,
    CotisationUpdate,
    CotisationResponse,
)
from app.schemas.depense import (
    DepenseBase,
    DepenseCreate,
    DepenseUpdate,
    DepenseResponse,
    CategorieDepenseBase,
    CategorieDepenseCreate,
    CategorieDepenseUpdate,
    CategorieDepenseResponse,
    ActiviteBase,
    ActiviteCreate,
    ActiviteUpdate,
    ActiviteResponse,
)
from app.schemas.bilan import (
    TopContributeur,
    ActiviteBudgetivore,
    RepartitionCategorie,
    EvolutionMensuelle,
    BilanResponse,
    ExerciceHistoriqueSummary,
    HistoriqueComparatifResponse,
)

__all__ = [
    # Common
    "ORMModel",
    "UUIDModel",
    # User & Auth
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "Token",
    "TokenPayload",
    # Exercice
    "ExerciceBase",
    "ExerciceCreate",
    "ExerciceUpdate",
    "ExerciceResponse",
    # Pays & Étudiants
    "PaysBase",
    "PaysCreate",
    "PaysUpdate",
    "PaysRead",
    "PaysResponse",
    "PaysStatsResponse",
    "EtudiantBase",
    "EtudiantCreate",
    "EtudiantUpdate",
    "EtudiantRead",
    "EtudiantResponse",
    # Cotisations
    "CotisationBase",
    "CotisationCreate",
    "CotisationUpdate",
    "CotisationResponse",
    # Dépenses
    "DepenseBase",
    "DepenseCreate",
    "DepenseUpdate",
    "DepenseResponse",
    "CategorieDepenseBase",
    "CategorieDepenseCreate",
    "CategorieDepenseUpdate",
    "CategorieDepenseResponse",
    "ActiviteBase",
    "ActiviteCreate",
    "ActiviteUpdate",
    "ActiviteResponse",
    # Bilan & Historique
    "TopContributeur",
    "ActiviteBudgetivore",
    "RepartitionCategorie",
    "EvolutionMensuelle",
    "BilanResponse",
    "ExerciceHistoriqueSummary",
    "HistoriqueComparatifResponse",
]
