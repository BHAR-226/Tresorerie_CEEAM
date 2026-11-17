import axios from 'axios';
import type {
  AuthResponse,
  Exercice,
  Pays,
  Etudiant,
  Cotisation,
  Activite,
  Bilan,
  ExerciceHistorique,
  User,
} from '../types';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Intercepteur pour injecter automatiquement le token JWT du Trésorier
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ceeam_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercepteur de réponse pour gérer l'expiration de session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ceeam_token');
      localStorage.removeItem('ceeam_user');
    }
    return Promise.reject(error);
  }
);

// ==========================================
// AUTHENTIFICATION
// ==========================================
export const authService = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const res = await api.post<AuthResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

// ==========================================
// EXERCICES
// ==========================================
export const exerciceService = {
  getActif: async (): Promise<Exercice> => {
    const res = await api.get<Exercice>('/exercices/actif');
    return res.data;
  },
  getAll: async (): Promise<Exercice[]> => {
    const res = await api.get<Exercice[]>('/exercices');
    return res.data;
  },
  create: async (data: { libelle: string; date_debut: string; date_fin?: string; reporter_solde?: boolean }): Promise<Exercice> => {
    const { reporter_solde = true, ...body } = data;
    const res = await api.post<Exercice>(`/exercices?reporter_solde=${reporter_solde}`, body);
    return res.data;
  },
  cloturer: async (exerciceId: string): Promise<Exercice> => {
    const res = await api.post<Exercice>(`/exercices/${exerciceId}/cloturer`);
    return res.data;
  },
};

// ==========================================
// BILAN & RAPPORTS
// ==========================================
export const bilanService = {
  getBilan: async (exerciceId: string): Promise<Bilan> => {
    const res = await api.get<Bilan>(`/bilan/${exerciceId}`);
    return res.data;
  },
  getHistorique: async (): Promise<{ exercices: ExerciceHistorique[] }> => {
    const res = await api.get<{ exercices: ExerciceHistorique[] }>('/bilan/historique');
    return res.data;
  },
  downloadPdf: async (exerciceId: string, libelle: string) => {
    const res = await api.get(`/bilan/${exerciceId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Rapport_Financier_CEEAM_${libelle.replace('/', '_')}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

// ==========================================
// PAYS & ÉTUDIANTS
// ==========================================
export const paysService = {
  getAll: async (): Promise<Pays[]> => {
    const res = await api.get<Pays[]>('/pays');
    return res.data;
  },
  create: async (data: { nom: string; code_iso?: string }): Promise<Pays> => {
    const res = await api.post<Pays>('/pays', data);
    return res.data;
  },
};

export const etudiantService = {
  getAll: async (paysId?: string): Promise<Etudiant[]> => {
    const url = paysId ? `/etudiants?pays_id=${paysId}` : '/etudiants';
    const res = await api.get<Etudiant[]>(url);
    return res.data;
  },
  create: async (data: { pays_id: string; nom: string; prenom: string; niveau: string }): Promise<Etudiant> => {
    const res = await api.post<Etudiant>('/etudiants', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Etudiant>): Promise<Etudiant> => {
    const res = await api.put<Etudiant>(`/etudiants/${id}`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/etudiants/${id}`);
  },
};

// ==========================================
// COTISATIONS
// ==========================================
export const cotisationService = {
  getAll: async (params?: { exercice_id?: string; etudiant_id?: string; pays_id?: string }): Promise<Cotisation[]> => {
    const query = new URLSearchParams();
    if (params?.exercice_id) query.append('exercice_id', params.exercice_id);
    if (params?.etudiant_id) query.append('etudiant_id', params.etudiant_id);
    if (params?.pays_id) query.append('pays_id', params.pays_id);
    const res = await api.get<Cotisation[]>(`/cotisations?${query.toString()}`);
    return res.data;
  },
  create: async (data: { etudiant_id: string; exercice_id: string; montant: number; date_paiement: string; commentaire?: string }): Promise<Cotisation> => {
    const res = await api.post<Cotisation>('/cotisations', data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/cotisations/${id}`);
  },
};

// ==========================================
// ACTIVITÉS & DÉPENSES
// ==========================================
export const depenseService = {
  getActivites: async (exerciceId?: string): Promise<Activite[]> => {
    const url = exerciceId ? `/activites?exercice_id=${exerciceId}` : '/activites';
    const res = await api.get<Activite[]>(url);
    return res.data;
  },
  createActivite: async (data: { exercice_id: string; nom: string; date_activite: string; budget_prevu?: number; description?: string }): Promise<Activite> => {
    const res = await api.post<Activite>('/activites', data);
    return res.data;
  },
  deleteActivite: async (id: string): Promise<void> => {
    await api.delete(`/activites/${id}`);
  },
  createCategorie: async (data: { activite_id: string; nom: string }) => {
    const res = await api.post('/categories', data);
    return res.data;
  },
  deleteCategorie: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
  createDepense: async (data: { categorie_id: string; nom: string; prix: number; date_depense: string; justificatif_url?: string }) => {
    const res = await api.post('/depenses', data);
    return res.data;
  },
  deleteDepense: async (id: string): Promise<void> => {
    await api.delete(`/depenses/${id}`);
  },
};
