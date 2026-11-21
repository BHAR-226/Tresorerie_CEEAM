import uuid
from typing import Optional, List
from pydantic import BaseModel


# ==========================================
# ELEMENTS D'ANALYSE & GRAPHIQUES
# ==========================================
class TopContributeur(BaseModel):
    pays_id: uuid.UUID
    pays_nom: str
    code_iso: Optional[str] = None
    total_cotise: float
    taux_participation: float
    nombre_etudiants: int


class ActiviteBudgetivore(BaseModel):
    activite_id: uuid.UUID
    activite_nom: str
    total_depense: float
    pourcentage_des_depenses: float


class RepartitionCategorie(BaseModel):
    categorie_nom: str
    total: float
    pourcentage: float


class EvolutionMensuelle(BaseModel):
    mois: str  # Ex: "10/2026"
    cotisations: float
    depenses: float
    solde: float


class ComparaisonActivite(BaseModel):
    activite_id: uuid.UUID
    nom: str
    date_activite: str
    budget_prevu: Optional[float] = None
    total_depense: float
    depassement: bool
    ecart: float


# ==========================================
# BILAN GLOBAL DE L'EXERCICE
# ==========================================
class BilanResponse(BaseModel):
    exercice_id: uuid.UUID
    exercice_libelle: str
    exercice_statut: str
    solde_initial: float
    total_cotise: float
    total_depense: float
    solde_disponible: float  # solde_initial + total_cotise - total_depense
    activite_plus_budgetivore: Optional[ActiviteBudgetivore] = None
    top_contributeurs: List[TopContributeur] = []
    repartition_pays: List[TopContributeur] = []
    repartition_categories: List[RepartitionCategorie] = []
    comparaison_activites: List[ComparaisonActivite] = []
    evolution_mensuelle: List[EvolutionMensuelle] = []


# ==========================================
# HISTORIQUE PLURIANNUEL
# ==========================================
class ExerciceHistoriqueSummary(BaseModel):
    exercice_id: uuid.UUID
    libelle: str
    statut: str
    date_debut: str
    date_fin: Optional[str] = None
    solde_initial: float
    total_cotise: float
    total_depense: float
    solde_final: float
    nombre_etudiants_cotisants: int


class HistoriqueComparatifResponse(BaseModel):
    exercices: List[ExerciceHistoriqueSummary]
