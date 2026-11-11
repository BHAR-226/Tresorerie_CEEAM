import uuid
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel


# ==========================================
# ELEMENTS D'ANALYSE & GRAPHIQUES
# ==========================================
class TopContributeur(BaseModel):
    pays_id: uuid.UUID
    pays_nom: str
    code_iso: Optional[str] = None
    total_cotise: Decimal
    taux_participation: float
    nombre_etudiants: int


class ActiviteBudgetivore(BaseModel):
    activite_id: uuid.UUID
    activite_nom: str
    total_depense: Decimal
    pourcentage_des_depenses: float


class RepartitionCategorie(BaseModel):
    categorie_nom: str
    total: Decimal
    pourcentage: float


class EvolutionMensuelle(BaseModel):
    mois: str  # Ex: "10/2026"
    cotisations: Decimal
    depenses: Decimal
    solde: Decimal


# ==========================================
# BILAN GLOBAL DE L'EXERCICE
# ==========================================
class BilanResponse(BaseModel):
    exercice_id: uuid.UUID
    exercice_libelle: str
    exercice_statut: str
    solde_initial: Decimal
    total_cotise: Decimal
    total_depense: Decimal
    solde_disponible: Decimal  # solde_initial + total_cotise - total_depense
    activite_plus_budgetivore: Optional[ActiviteBudgetivore] = None
    top_contributeurs: List[TopContributeur] = []
    repartition_pays: List[TopContributeur] = []
    repartition_categories: List[RepartitionCategorie] = []
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
    solde_initial: Decimal
    total_cotise: Decimal
    total_depense: Decimal
    solde_final: Decimal
    nombre_etudiants_cotisants: int


class HistoriqueComparatifResponse(BaseModel):
    exercices: List[ExerciceHistoriqueSummary]
