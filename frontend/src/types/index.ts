export type UserRole = 'ADMIN' | 'VISITOR';

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: UserRole;
  user_nom: string;
  user_prenom: string;
}

export interface Exercice {
  id: string;
  libelle: string;
  date_debut: string;
  date_fin?: string | null;
  statut: 'EN_COURS' | 'CLOTURE';
  solde_initial: number;
}

export interface Pays {
  id: string;
  nom: string;
  code_iso?: string | null;
  nombre_etudiants?: number;
  nombre_cotisants?: number;
  total_cotise?: number;
  taux_participation?: number;
}

export interface Etudiant {
  id: string;
  pays_id: string;
  nom: string;
  prenom: string;
  niveau: string;
  actif: boolean;
  total_cotise?: number | null;
  pays?: Pays;
}

export interface Cotisation {
  id: string;
  etudiant_id: string;
  exercice_id: string;
  montant: number;
  date_paiement: string;
  commentaire?: string | null;
  etudiant?: Etudiant;
}

export interface Depense {
  id: string;
  categorie_id: string;
  nom: string;
  prix: number;
  date_depense: string;
  justificatif_url?: string | null;
}

export interface CategorieDepense {
  id: string;
  activite_id: string;
  nom: string;
  total_categorie: number;
  depenses: Depense[];
}

export interface Activite {
  id: string;
  exercice_id: string;
  nom: string;
  description?: string | null;
  date_activite: string;
  budget_prevu?: number | null;
  total_depense: number;
  depassement_budget: boolean;
  categories: CategorieDepense[];
}

export interface TopContributeur {
  pays_id: string;
  pays_nom: string;
  code_iso?: string | null;
  total_cotise: number;
  taux_participation: number;
  nombre_etudiants: number;
  nombre_cotisants?: number;
}

export interface ActiviteBudgetivore {
  activite_id: string;
  activite_nom: string;
  total_depense: number;
  pourcentage_des_depenses: number;
}

export interface RepartitionCategorie {
  categorie_nom: string;
  total: number;
  pourcentage: number;
}

export interface ComparaisonActivite {
  activite_id: string;
  nom: string;
  date_activite: string;
  budget_prevu?: number | null;
  total_depense: number;
  depassement: boolean;
  ecart: number;
}

export interface EvolutionMensuelle {
  mois: string;
  cotisations: number;
  depenses: number;
  solde: number;
}

export interface Bilan {
  exercice_id: string;
  exercice_libelle: string;
  exercice_statut: string;
  solde_initial: number;
  total_cotise: number;
  total_depense: number;
  solde_disponible: number;
  activite_plus_budgetivore?: ActiviteBudgetivore | null;
  top_contributeurs: TopContributeur[];
  repartition_pays: TopContributeur[];
  repartition_categories: RepartitionCategorie[];
  comparaison_activites?: ComparaisonActivite[];
  evolution_mensuelle: EvolutionMensuelle[];
}

export interface ExerciceHistorique {
  exercice_id: string;
  libelle: string;
  statut: string;
  date_debut: string;
  date_fin?: string | null;
  solde_initial: number;
  total_cotise: number;
  total_depense: number;
  solde_final: number;
  nombre_etudiants_cotisants: number;
}
