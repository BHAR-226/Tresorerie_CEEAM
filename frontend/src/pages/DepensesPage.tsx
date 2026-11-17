import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FileText,
  X,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { depenseService, exerciceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Activite, Exercice } from '../types';

interface DepensesPageProps {
  onOpenLogin: () => void;
}

export const DepensesPage: React.FC<DepensesPageProps> = ({ onOpenLogin }) => {
  const { isAdmin } = useAuth();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedActivites, setExpandedActivites] = useState<Record<string, boolean>>({});

  // Modals state
  const [isActiviteModalOpen, setIsActiviteModalOpen] = useState(false);
  const [isCategorieModalOpen, setIsCategorieModalOpen] = useState(false);
  const [isDepenseModalOpen, setIsDepenseModalOpen] = useState(false);

  // Formulaire Activité
  const [formNomActivite, setFormNomActivite] = useState('');
  const [formBudgetPrevu, setFormBudgetPrevu] = useState<number>(5000);
  const [formDateActivite, setFormDateActivite] = useState(new Date().toISOString().split('T')[0]);
  const [formDescActivite, setFormDescActivite] = useState('');
  const [submittingActivite, setSubmittingActivite] = useState(false);

  // Formulaire Catégorie
  const [targetActiviteId, setTargetActiviteId] = useState('');
  const [formNomCategorie, setFormNomCategorie] = useState('');
  const [submittingCategorie, setSubmittingCategorie] = useState(false);

  // Formulaire Ligne de Dépense
  const [targetCategorieId, setTargetCategorieId] = useState('');
  const [formNomDepense, setFormNomDepense] = useState('');
  const [formPrixDepense, setFormPrixDepense] = useState<number>(200);
  const [formDateDepense, setFormDateDepense] = useState(new Date().toISOString().split('T')[0]);
  const [formJustificatif, setFormJustificatif] = useState('');
  const [submittingDepense, setSubmittingDepense] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const exActif = await exerciceService.getActif();
      setExerciceActif(exActif);
      if (exActif) {
        const actRes = await depenseService.getActivites(exActif.id);
        setActivites(actRes);
        // Déplier la première activité par défaut
        if (actRes.length > 0 && Object.keys(expandedActivites).length === 0) {
          setExpandedActivites({ [actRes[0].id]: true });
        }
      }
    } catch (err) {
      console.error('Erreur chargement dépenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleActivite = (id: string) => {
    setExpandedActivites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Créer une activité
  const handleCreateActivite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciceActif || !formNomActivite) return;
    try {
      setSubmittingActivite(true);
      await depenseService.createActivite({
        exercice_id: exerciceActif.id,
        nom: formNomActivite,
        budget_prevu: Number(formBudgetPrevu),
        date_activite: formDateActivite,
        description: formDescActivite || undefined,
      });
      setIsActiviteModalOpen(false);
      setFormNomActivite('');
      setFormDescActivite('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la création de l’activité');
    } finally {
      setSubmittingActivite(false);
    }
  };

  // Créer une catégorie de dépense
  const handleCreateCategorie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetActiviteId || !formNomCategorie) return;
    try {
      setSubmittingCategorie(true);
      await depenseService.createCategorie({
        activite_id: targetActiviteId,
        nom: formNomCategorie,
      });
      setIsCategorieModalOpen(false);
      setFormNomCategorie('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la création de la catégorie');
    } finally {
      setSubmittingCategorie(false);
    }
  };

  // Créer une ligne de dépense
  const handleCreateDepense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategorieId || !formNomDepense) return;
    try {
      setSubmittingDepense(true);
      await depenseService.createDepense({
        categorie_id: targetCategorieId,
        nom: formNomDepense,
        prix: Number(formPrixDepense),
        date_depense: formDateDepense,
        justificatif_url: formJustificatif || undefined,
      });
      setIsDepenseModalOpen(false);
      setFormNomDepense('');
      setFormJustificatif('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de l’enregistrement de la dépense');
    } finally {
      setSubmittingDepense(false);
    }
  };

  const totalDepensesGlobal = activites.reduce((sum, a) => sum + (a.total_depense || 0), 0);
  const totalBudgetPrevuGlobal = activites.reduce((sum, a) => sum + (a.budget_prevu || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B1B3D] border-t-[#F58220] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Chargement des activités et dépenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* 1. HEADER PAGE & ACTIONS TRÉSORIER                          */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center space-x-1.5">
              <Receipt size={13} />
              <span>Contrôle & Traçabilité Budgétaire</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Gestion des Dépenses CEEAM
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Suivi hiérarchique : Activité &gt; Catégorie &gt; Lignes de dépenses avec justificatifs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <button
              onClick={() => setIsActiviteModalOpen(true)}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0B1B3D] hover:bg-[#162C5B] active:scale-[0.98] transition shadow-md shadow-[#0B1B3D]/10"
            >
              <Plus size={18} className="text-[#F58220]" />
              <span>Nouvelle Activité</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs text-[#0B1B3D] bg-slate-100 hover:bg-slate-200 transition"
            >
              <ShieldAlert size={16} className="text-[#F58220]" />
              <span>Connexion Trésorier pour engager des dépenses</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SYNTHÈSE BUDGÉTAIRE RAPIDE                                */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Budget Global Prévu</span>
          <p className="text-xl md:text-2xl font-extrabold text-[#0B1B3D] mt-1">
            {totalBudgetPrevuGlobal.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-[#F58220]">DH</span>
          </p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Total Dépenses Consommées</span>
          <p className="text-xl md:text-2xl font-extrabold text-rose-700 mt-1">
            {totalDepensesGlobal.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-rose-600">DH</span>
          </p>
        </div>
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-500">Activités Référencées</span>
          <p className="text-xl md:text-2xl font-extrabold text-slate-800 mt-1">
            {activites.length} <span className="text-sm font-semibold text-slate-400">programme(s)</span>
          </p>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. ARBORESCENCE HIÉRARCHIQUE DES ACTIVITÉS                   */}
      {/* ============================================================ */}
      <div className="space-y-4">
        {activites.length > 0 ? (
          activites.map((activite) => {
            const isExpanded = !!expandedActivites[activite.id];
            const budgetPrevu = activite.budget_prevu || 0;
            const totalDepense = activite.total_depense || 0;
            const depasse = budgetPrevu > 0 && totalDepense > budgetPrevu;
            const percentUsed = budgetPrevu > 0 ? Math.round((totalDepense / budgetPrevu) * 100) : 0;

            return (
              <div
                key={activite.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition"
              >
                {/* En-tête de l'activité (Cliquable pour déplier) */}
                <div
                  onClick={() => toggleActivite(activite.id)}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-center space-x-3.5">
                    <button className="text-slate-400 hover:text-[#0B1B3D]">
                      {isExpanded ? <ChevronDown size={22} /> : <ChevronRight size={22} />}
                    </button>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-extrabold text-base md:text-lg text-[#0B1B3D]">
                          {activite.nom}
                        </h3>
                        {depasse ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                            <AlertTriangle size={12} />
                            <span>Dépassement (+{(totalDepense - budgetPrevu).toLocaleString('fr-FR')} DH)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
                            <CheckCircle2 size={12} />
                            <span>Dans le budget</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center space-x-1">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{activite.date_activite}</span>
                        </span>
                        {activite.description && (
                          <span className="text-slate-400 truncate max-w-xs md:max-w-md">
                            • {activite.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Synthèse financière de l'activité */}
                  <div className="flex items-center space-x-6 shrink-0 self-end md:self-auto">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">
                        Budget: <strong>{budgetPrevu.toLocaleString('fr-FR')} DH</strong>
                      </div>
                      <div className="text-sm font-extrabold text-[#0B1B3D]">
                        Dépensé: <span className={depasse ? 'text-red-600' : 'text-slate-800'}>{totalDepense.toLocaleString('fr-FR')} DH</span>
                      </div>
                      <div className="w-28 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${depasse ? 'bg-red-500' : 'bg-[#F58220]'}`}
                          style={{ width: `${Math.min(percentUsed, 100)}%` }}
                        />
                      </div>
                    </div>

                    {isAdmin && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center space-x-1"
                      >
                        <button
                          onClick={() => {
                            setTargetActiviteId(activite.id);
                            setIsCategorieModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0B1B3D] hover:bg-slate-100 transition flex items-center space-x-1"
                        >
                          <FolderPlus size={14} className="text-[#F58220]" />
                          <span className="hidden sm:inline">Ajouter Catégorie</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contenu Déplié : Catégories et Lignes de Dépenses */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50 border-t border-slate-100 space-y-4">
                    {activite.categories && activite.categories.length > 0 ? (
                      activite.categories.map((cat) => (
                        <div
                          key={cat.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
                        >
                          {/* Titre Catégorie */}
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="w-2 h-2 rounded-full bg-[#F58220]" />
                              <h4 className="font-bold text-sm text-[#0B1B3D]">{cat.nom}</h4>
                              <span className="text-xs text-slate-400 font-normal">
                                ({cat.depenses?.length || 0} dépense(s))
                              </span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-xs font-bold text-slate-700">
                                Sous-total: {cat.total_categorie.toLocaleString('fr-FR')} DH
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setTargetCategorieId(cat.id);
                                    setIsDepenseModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 rounded-md bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/20 text-xs font-semibold hover:bg-[#F58220] hover:text-white transition flex items-center space-x-1"
                                >
                                  <Plus size={13} />
                                  <span>Ajouter Dépense</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Liste des Lignes de Dépense */}
                          {cat.depenses && cat.depenses.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                              {cat.depenses.map((dep) => (
                                <div
                                  key={dep.id}
                                  className="py-2.5 flex items-center justify-between text-xs"
                                >
                                  <div className="flex items-center space-x-3">
                                    <FileText size={16} className="text-slate-400" />
                                    <div>
                                      <p className="font-semibold text-slate-800">{dep.nom}</p>
                                      <p className="text-[11px] text-slate-400">{dep.date_depense}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center space-x-3">
                                    {dep.justificatif_url && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                        Reçu vérifié
                                      </span>
                                    )}
                                    <span className="font-bold text-rose-600 text-sm">
                                      -{dep.prix.toLocaleString('fr-FR')} DH
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic py-1">
                              Aucune dépense enregistrée dans cette catégorie.
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        Aucune catégorie n’a encore été ajoutée à cette activité.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
            <Layers size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Aucune activité enregistrée</p>
            <p className="text-xs text-slate-400 mt-1">
              Les activités programmées pour cet exercice apparaîtront ici.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL NOUVELLE ACTIVITÉ                                   */}
      {/* ============================================================ */}
      {isActiviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Nouvelle Activité</h3>
                <p className="text-xs text-[#F58220]">Création d'un événement budgétaire</p>
              </div>
              <button
                onClick={() => setIsActiviteModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateActivite} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de l'activité
                </label>
                <input
                  type="text"
                  required
                  value={formNomActivite}
                  onChange={(e) => setFormNomActivite(e.target.value)}
                  placeholder="Ex: Journée d'Intégration CEEAM"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Budget Prévu (DH)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formBudgetPrevu}
                    onChange={(e) => setFormBudgetPrevu(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date prévue
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateActivite}
                    onChange={(e) => setFormDateActivite(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Objectif (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={formDescActivite}
                  onChange={(e) => setFormDescActivite(e.target.value)}
                  placeholder="Détails sur le déroulement et le public cible..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsActiviteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingActivite}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingActivite ? 'Création...' : 'Créer l’activité'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL NOUVELLE CATÉGORIE                                  */}
      {/* ============================================================ */}
      {isCategorieModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Ajouter une Catégorie</h3>
                <p className="text-xs text-[#F58220]">Poste de dépense interne</p>
              </div>
              <button
                onClick={() => setIsCategorieModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCategorie} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nom de la catégorie
                </label>
                <input
                  type="text"
                  required
                  value={formNomCategorie}
                  onChange={(e) => setFormNomCategorie(e.target.value)}
                  placeholder="Ex: Restauration & Boissons, Sonorisation, Logistique..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCategorieModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingCategorie}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingCategorie ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MODAL ENREGISTRER UNE DÉPENSE                             */}
      {/* ============================================================ */}
      {isDepenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Enregistrer une Ligne de Dépense</h3>
                <p className="text-xs text-[#F58220]">Facture ou débours avec justificatif</p>
              </div>
              <button
                onClick={() => setIsDepenseModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateDepense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Intitulé de la dépense
                </label>
                <input
                  type="text"
                  required
                  value={formNomDepense}
                  onChange={(e) => setFormNomDepense(e.target.value)}
                  placeholder="Ex: Achat eau minérale et jus pour la pause"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Montant / Prix (DH)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrixDepense}
                    onChange={(e) => setFormPrixDepense(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date de la dépense
                  </label>
                  <input
                    type="date"
                    required
                    value={formDateDepense}
                    onChange={(e) => setFormDateDepense(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Référence du justificatif (Optionnel)
                </label>
                <input
                  type="text"
                  value={formJustificatif}
                  onChange={(e) => setFormJustificatif(e.target.value)}
                  placeholder="Ex: Facture Marjane n°89412"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDepenseModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingDepense}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingDepense ? 'Enregistrement...' : 'Enregistrer la dépense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
