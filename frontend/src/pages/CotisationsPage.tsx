import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Globe2,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Filter,
  DollarSign,
  UserPlus,
  X,
} from 'lucide-react';
import { paysService, etudiantService, cotisationService, exerciceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Pays, Etudiant, Cotisation, Exercice } from '../types';

interface CotisationsPageProps {
  onOpenLogin: () => void;
}

export const CotisationsPage: React.FC<CotisationsPageProps> = ({ onOpenLogin }) => {
  const { isAdmin } = useAuth();
  const [paysList, setPaysList] = useState<Pays[]>([]);
  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);

  const [selectedPaysId, setSelectedPaysId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCotisationModalOpen, setIsCotisationModalOpen] = useState(false);
  const [isEtudiantModalOpen, setIsEtudiantModalOpen] = useState(false);

  // Formulaire Cotisation
  const [formEtudiantId, setFormEtudiantId] = useState('');
  const [formMontant, setFormMontant] = useState<number>(100);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCommentaire, setFormCommentaire] = useState('');
  const [submittingCotisation, setSubmittingCotisation] = useState(false);

  // Formulaire Nouvel Étudiant
  const [formNewPaysId, setFormNewPaysId] = useState('');
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formNiveau, setFormNiveau] = useState('Licence 1');
  const [submittingEtudiant, setSubmittingEtudiant] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paysRes, exActif] = await Promise.all([
        paysService.getAll(),
        exerciceService.getActif(),
      ]);
      setPaysList(paysRes);
      setExerciceActif(exActif);

      const [etudiantsRes, cotisationsRes] = await Promise.all([
        etudiantService.getAll(),
        cotisationService.getAll(exActif ? { exercice_id: exActif.id } : undefined),
      ]);
      setEtudiants(etudiantsRes);
      setCotisations(cotisationsRes);
    } catch (err) {
      console.error('Erreur chargement cotisations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculer le total cotisé pour un étudiant dans l'exercice actuel
  const getEtudiantTotalCotise = (etudiantId: string): number => {
    return cotisations
      .filter((c) => c.etudiant_id === etudiantId)
      .reduce((acc, curr) => acc + curr.montant, 0);
  };

  // Filtrer les étudiants
  const filteredEtudiants = etudiants.filter((e) => {
    const matchPays = selectedPaysId === 'ALL' || e.pays_id === selectedPaysId;
    const fullName = `${e.prenom} ${e.nom}`.toLowerCase();
    const matchSearch = fullName.includes(searchQuery.toLowerCase());
    return matchPays && matchSearch;
  });

  // Soumission nouvelle cotisation
  const handleCreateCotisation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciceActif || !formEtudiantId) return;

    try {
      setSubmittingCotisation(true);
      await cotisationService.create({
        exercice_id: exerciceActif.id,
        etudiant_id: formEtudiantId,
        montant: Number(formMontant),
        date_paiement: formDate,
        commentaire: formCommentaire || undefined,
      });
      setIsCotisationModalOpen(false);
      setFormCommentaire('');
      // Recharger
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de l’enregistrement de la cotisation');
    } finally {
      setSubmittingCotisation(false);
    }
  };

  // Soumission nouvel étudiant
  const handleCreateEtudiant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNewPaysId || !formNom || !formPrenom) return;

    try {
      setSubmittingEtudiant(true);
      await etudiantService.create({
        pays_id: formNewPaysId,
        nom: formNom,
        prenom: formPrenom,
        niveau: formNiveau,
      });
      setIsEtudiantModalOpen(false);
      setFormNom('');
      setFormPrenom('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la création de l’étudiant');
    } finally {
      setSubmittingEtudiant(false);
    }
  };

  // Total global cotisé dans cette session
  const totalGlobalCotise = cotisations.reduce((sum, c) => sum + c.montant, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B1B3D] border-t-[#F58220] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Chargement des cotisations et membres...</p>
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
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-[#F58220] border border-[#F58220]/20 flex items-center space-x-1.5">
              <Globe2 size={13} />
              <span>17 Pays Membres CEEAM</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Gestion des Cotisations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Suivi des contributions par communauté nationale et adhésions étudiantes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => {
                  setFormNewPaysId(selectedPaysId !== 'ALL' ? selectedPaysId : (paysList[0]?.id || ''));
                  setIsEtudiantModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-[#0B1B3D] hover:bg-slate-50 transition"
              >
                <UserPlus size={16} className="text-[#F58220]" />
                <span>Nouvel Étudiant</span>
              </button>

              <button
                onClick={() => {
                  if (etudiants.length > 0) {
                    setFormEtudiantId(etudiants[0].id);
                  }
                  setIsCotisationModalOpen(true);
                }}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#F58220] hover:bg-[#E07114] active:scale-[0.98] transition shadow-md shadow-[#F58220]/20"
              >
                <Plus size={18} />
                <span>Enregistrer Cotisation</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs text-[#0B1B3D] bg-slate-100 hover:bg-slate-200 transition"
            >
              <ShieldAlert size={16} className="text-[#F58220]" />
              <span>Connexion Trésorier pour encaisser</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SÉLECTEUR RAPIDE DES PAYS (CARROUSEL HORIZONTAL / BADGES) */}
      {/* ============================================================ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Filter size={14} className="text-[#F58220]" />
            <span>Filtrer par Communauté / Pays</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Total cotisé exercice: <strong className="text-[#0B1B3D]">{totalGlobalCotise.toLocaleString('fr-FR')} DH</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setSelectedPaysId('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition ${
              selectedPaysId === 'ALL'
                ? 'bg-[#0B1B3D] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tous les Pays ({paysList.length})
          </button>
          {paysList.map((p) => {
            const isSelected = selectedPaysId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPaysId(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition flex items-center space-x-2 border ${
                  isSelected
                    ? 'bg-[#F58220] border-[#F58220] text-white shadow-xs font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <span>{p.nom}</span>
                {p.code_iso && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-sm uppercase ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {p.code_iso}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LISTE ET RECHERCHE DES ÉTUDIANTS / COTISATIONS            */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Barre de recherche */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un étudiant par nom ou prénom..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20 outline-hidden transition"
            />
          </div>

          <div className="text-xs font-semibold text-slate-500">
            {filteredEtudiants.length} étudiant(s) affiché(s)
          </div>
        </div>

        {/* Tableau Responsive */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 md:px-6">Étudiant</th>
                <th className="py-3 px-4">Pays d'origine</th>
                <th className="py-3 px-4">Niveau d'études</th>
                <th className="py-3 px-4 text-right">Cotisé (2026-2027)</th>
                <th className="py-3 px-4 text-center">Statut Quota</th>
                {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredEtudiants.length > 0 ? (
                filteredEtudiants.map((etudiant) => {
                  const pays = paysList.find((p) => p.id === etudiant.pays_id);
                  const totalCotise = getEtudiantTotalCotise(etudiant.id);
                  const aCotise = totalCotise > 0;

                  return (
                    <tr key={etudiant.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 md:px-6">
                        <div className="font-bold text-[#0B1B3D]">
                          {etudiant.prenom} {etudiant.nom}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                          <span>{pays?.nom || 'Inconnu'}</span>
                          {pays?.code_iso && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded-sm">
                              {pays.code_iso}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {etudiant.niveau || 'Non précisé'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-[#0B1B3D]">
                        {totalCotise > 0 ? (
                          <span className="text-emerald-700">+{totalCotise} DH</span>
                        ) : (
                          <span className="text-slate-400 font-normal">0 DH</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {aCotise ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={13} />
                            <span>À jour</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={13} />
                            <span>En attente</span>
                          </span>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              setFormEtudiantId(etudiant.id);
                              setIsCotisationModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-[#F58220] hover:bg-[#FFF7ED] transition"
                            title="Ajouter un versement pour cet étudiant"
                          >
                            <DollarSign size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center text-slate-400">
                    Aucun étudiant trouvé correspondant aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL ENREGISTRER UNE COTISATION                          */}
      {/* ============================================================ */}
      {isCotisationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Encaisser une Cotisation</h3>
                <p className="text-xs text-[#F58220]">Exercice {exerciceActif?.libelle || 'Actuel'}</p>
              </div>
              <button
                onClick={() => setIsCotisationModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCotisation} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Étudiant Bénéficiaire
                </label>
                <select
                  required
                  value={formEtudiantId}
                  onChange={(e) => setFormEtudiantId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                >
                  {etudiants.map((et) => {
                    const pays = paysList.find((p) => p.id === et.pays_id);
                    return (
                      <option key={et.id} value={et.id}>
                        {et.prenom} {et.nom} ({pays?.nom || 'Inconnu'})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Montant (en DH)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formMontant}
                    onChange={(e) => setFormMontant(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Date du Paiement
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Commentaire / Reçu / Quittance (Optionnel)
                </label>
                <input
                  type="text"
                  value={formCommentaire}
                  onChange={(e) => setFormCommentaire(e.target.value)}
                  placeholder="Ex: Quota annuel, reçu n°45..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCotisationModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingCotisation}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingCotisation ? 'Enregistrement...' : 'Valider le paiement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL AJOUTER UN ÉTUDIANT                                 */}
      {/* ============================================================ */}
      {isEtudiantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Inscrire un Nouvel Étudiant</h3>
                <p className="text-xs text-[#F58220]">Rattachement à sa communauté nationale</p>
              </div>
              <button
                onClick={() => setIsEtudiantModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEtudiant} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Pays d'origine
                </label>
                <select
                  required
                  value={formNewPaysId}
                  onChange={(e) => setFormNewPaysId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                >
                  {paysList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nom} {p.code_iso ? `(${p.code_iso})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    placeholder="Ex: Diallo"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={formPrenom}
                    onChange={(e) => setFormPrenom(e.target.value)}
                    placeholder="Ex: Mamadou"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Niveau d'études / Filière
                </label>
                <input
                  type="text"
                  required
                  value={formNiveau}
                  onChange={(e) => setFormNiveau(e.target.value)}
                  placeholder="Ex: Master 2 Génie Logiciel"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsEtudiantModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingEtudiant}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingEtudiant ? 'Création...' : 'Créer l’étudiant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
