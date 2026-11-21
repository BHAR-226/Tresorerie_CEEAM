import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Globe2,
  ShieldAlert,
  Trash2,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { paysService, cotisationService, exerciceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Pays, Cotisation, Exercice } from '../types';

interface CotisationsPageProps {
  onOpenLogin: () => void;
}

export const CotisationsPage: React.FC<CotisationsPageProps> = ({ onOpenLogin }) => {
  const { isAdmin } = useAuth();
  const [paysList, setPaysList] = useState<Pays[]>([]);
  const [cotisations, setCotisations] = useState<Cotisation[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPaysId, setSelectedPaysId] = useState<string>('ALL');
  const [selectedNiveau, setSelectedNiveau] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'MONTANT_DESC' | 'MONTANT_ASC' | 'DATE_DESC'>('DEFAULT');

  // Modal Enregistrement Cotisation Directe
  const [isCotisationModalOpen, setIsCotisationModalOpen] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formPrenom, setFormPrenom] = useState('');
  const [formPaysId, setFormPaysId] = useState('');
  const [formNiveau, setFormNiveau] = useState('1ère année');
  const [formMontant, setFormMontant] = useState<number>(100);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [submittingCotisation, setSubmittingCotisation] = useState(false);

  // Modal Gestion des Pays
  const [isPaysModalOpen, setIsPaysModalOpen] = useState(false);
  const [newPaysNom, setNewPaysNom] = useState('');
  const [newPaysCode, setNewPaysCode] = useState('');
  const [editingPaysId, setEditingPaysId] = useState<string | null>(null);
  const [editingPaysNom, setEditingPaysNom] = useState('');
  const [editingPaysCode, setEditingPaysCode] = useState('');
  const [submittingPays, setSubmittingPays] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paysRes, exActif] = await Promise.all([
        paysService.getAll(),
        exerciceService.getActif().catch(() => null),
      ]);
      setPaysList(paysRes);
      setExerciceActif(exActif);

      const cotisRes = await cotisationService.getAll(
        exActif ? { exercice_id: exActif.id } : undefined
      );
      setCotisations(cotisRes);
    } catch (err) {
      console.error('Erreur chargement cotisations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Map des pays par ID pour résolution rapide
  const paysMap = useMemo(() => {
    const map = new Map<string, Pays>();
    paysList.forEach((p) => map.set(p.id, p));
    return map;
  }, [paysList]);

  // Filtrage et Tri des cotisations
  const filteredAndSortedCotisations = useMemo(() => {
    let list = cotisations.filter((c) => {
      // Filtre Pays
      const etudiantPaysId = c.etudiant?.pays_id || c.etudiant?.pays?.id;
      if (selectedPaysId !== 'ALL' && etudiantPaysId !== selectedPaysId) {
        return false;
      }

      // Filtre Année / Niveau
      if (selectedNiveau !== 'ALL' && c.etudiant?.niveau !== selectedNiveau) {
        return false;
      }

      // Filtre Recherche Nom ou Prénom
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const nom = (c.etudiant?.nom || '').toLowerCase();
        const prenom = (c.etudiant?.prenom || '').toLowerCase();
        if (!nom.includes(q) && !prenom.includes(q)) {
          return false;
        }
      }

      return true;
    });

    // Tri
    list.sort((a, b) => {
      if (sortBy === 'MONTANT_DESC') {
        return Number(b.montant) - Number(a.montant);
      }
      if (sortBy === 'MONTANT_ASC') {
        return Number(a.montant) - Number(b.montant);
      }
      if (sortBy === 'DATE_DESC') {
        return b.date_paiement.localeCompare(a.date_paiement);
      }

      // Ordre par défaut : ordre alphabétique des pays, puis ordre alphabétique des noms
      const paysA = (a.etudiant?.pays?.nom || paysMap.get(a.etudiant?.pays_id || '')?.nom || '').toLowerCase();
      const paysB = (b.etudiant?.pays?.nom || paysMap.get(b.etudiant?.pays_id || '')?.nom || '').toLowerCase();
      const compPays = paysA.localeCompare(paysB, 'fr');
      if (compPays !== 0) return compPays;

      const nomA = (a.etudiant?.nom || '').toLowerCase();
      const nomB = (b.etudiant?.nom || '').toLowerCase();
      const compNom = nomA.localeCompare(nomB, 'fr');
      if (compNom !== 0) return compNom;

      const prenomA = (a.etudiant?.prenom || '').toLowerCase();
      const prenomB = (b.etudiant?.prenom || '').toLowerCase();
      return prenomA.localeCompare(prenomB, 'fr');
    });

    return list;
  }, [cotisations, selectedPaysId, selectedNiveau, searchQuery, sortBy, paysMap]);

  // Total des cotisations filtrées
  const totalFiltre = useMemo(() => {
    return filteredAndSortedCotisations.reduce((acc, c) => acc + Number(c.montant), 0);
  }, [filteredAndSortedCotisations]);

  // Enregistrer une cotisation directe (Création de l'étudiant à la volée + paiement)
  const handleCreateCotisationDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciceActif || !formPaysId || !formNom.trim() || !formPrenom.trim()) return;

    try {
      setSubmittingCotisation(true);
      await cotisationService.createDirect({
        exercice_id: exerciceActif.id,
        pays_id: formPaysId,
        nom: formNom.trim(),
        prenom: formPrenom.trim(),
        niveau: formNiveau,
        montant: Number(formMontant),
        date_paiement: formDate,
      });

      setIsCotisationModalOpen(false);
      setFormNom('');
      setFormPrenom('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de l’enregistrement de la cotisation');
    } finally {
      setSubmittingCotisation(false);
    }
  };

  // Supprimer une cotisation (Admin)
  const handleDeleteCotisation = async (id: string) => {
    if (!confirm('Confirmez-vous la suppression de cette ligne de cotisation ?')) return;
    try {
      await cotisationService.delete(id);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  // Gestion des Pays : Ajouter un pays
  const handleAddPays = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPaysNom.trim()) return;
    try {
      setSubmittingPays(true);
      await paysService.create({
        nom: newPaysNom.trim(),
        code_iso: newPaysCode.trim().toUpperCase() || undefined,
      });
      setNewPaysNom('');
      setNewPaysCode('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de l’ajout du pays');
    } finally {
      setSubmittingPays(false);
    }
  };

  // Gestion des Pays : Modifier un pays
  const handleUpdatePays = async (paysId: string) => {
    if (!editingPaysNom.trim()) return;
    try {
      await paysService.update(paysId, {
        nom: editingPaysNom.trim(),
        code_iso: editingPaysCode.trim().toUpperCase() || undefined,
      });
      setEditingPaysId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la mise à jour du pays');
    }
  };

  // Gestion des Pays : Supprimer un pays
  const handleDeletePays = async (paysId: string, paysNom: string) => {
    if (!confirm(`Confirmez-vous la suppression du pays "${paysNom}" du répertoire ?`)) return;
    try {
      await paysService.delete(paysId);
      if (selectedPaysId === paysId) {
        setSelectedPaysId('ALL');
      }
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression du pays');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B1B3D] border-t-[#F58220] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Chargement des cotisations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* 1. HEADER PAGE & ACTIONS TRÉSORIER                          */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-50 text-[#F58220] border border-[#F58220]/20 flex items-center space-x-1.5">
              <Globe2 size={13} />
              <span>{paysList.length} Pays Membres</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Gestion des Cotisations
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Suivi des versements par communauté nationale (conformité feuille de caisse)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <>
              <button
                onClick={() => setIsPaysModalOpen(true)}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-xs text-[#0B1B3D] hover:bg-slate-50 transition"
              >
                <Globe2 size={15} className="text-[#F58220]" />
                <span>Gérer les Pays</span>
              </button>

              <button
                onClick={() => {
                  if (paysList.length > 0 && !formPaysId) {
                    setFormPaysId(paysList[0].id);
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
      {/* 2. BARRE D'OUTILS : RECHERCHE + FILTRES MULTI-CRITÈRES       */}
      {/* ============================================================ */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Recherche Nom / Prénom */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher nom ou prénom..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/20 outline-hidden transition bg-slate-50/50"
            />
          </div>

          {/* Filtre par Pays */}
          <div className="relative">
            <select
              value={selectedPaysId}
              onChange={(e) => setSelectedPaysId(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:border-[#F58220] outline-hidden bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="ALL">🌍 Tous les pays ({paysList.length})</option>
              {paysList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} {p.code_iso ? `(${p.code_iso})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Filtre par Année / Niveau */}
          <div className="relative">
            <select
              value={selectedNiveau}
              onChange={(e) => setSelectedNiveau(e.target.value)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:border-[#F58220] outline-hidden bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="ALL">🎓 Toutes les années</option>
              <option value="1ère année">1ère année</option>
              <option value="2ème année">2ème année</option>
              <option value="3ème année">3ème année</option>
              <option value="4ème année">4ème année</option>
              <option value="5ème année">5ème année</option>
            </select>
          </div>

          {/* Tri par Cotisation / Ordre par défaut */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs md:text-sm rounded-xl border border-slate-200 focus:border-[#F58220] outline-hidden bg-slate-50/50 text-slate-700 font-medium"
            >
              <option value="DEFAULT">🔤 Ordre alphabétique (Pays &gt; Nom)</option>
              <option value="MONTANT_DESC">💰 Cotisation décroissante (Max ➔ Min)</option>
              <option value="MONTANT_ASC">💰 Cotisation croissante (Min ➔ Max)</option>
              <option value="DATE_DESC">📅 Date la plus récente</option>
            </select>
          </div>
        </div>

        {/* Ligne récapitulative des résultats */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
          <span>
            <strong className="text-[#0B1B3D] font-bold">{filteredAndSortedCotisations.length}</strong> ligne(s) affichée(s)
          </span>
          <span>
            Total cotisé filtré :{' '}
            <strong className="text-[#0B1B3D] font-bold text-sm">
              {totalFiltre.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
            </strong>
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TABLEAU DES COTISATIONS (EXACTEMENT COMME FEUILLE EXCEL)  */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0B1B3D] text-white text-[12px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4 md:px-6">Nom</th>
                <th className="py-3.5 px-4 md:px-6">Prénoms</th>
                <th className="py-3.5 px-4 text-center">Année</th>
                <th className="py-3.5 px-4">Pays</th>
                <th className="py-3.5 px-4 text-right">Montant</th>
                <th className="py-3.5 px-4 text-center">Date</th>
                {isAdmin && <th className="py-3.5 px-4 text-center w-16">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAndSortedCotisations.length > 0 ? (
                filteredAndSortedCotisations.map((cotisation) => {
                  const etudiant = cotisation.etudiant;
                  const pays = etudiant?.pays || paysMap.get(etudiant?.pays_id || '');
                  const montantNum = Number(cotisation.montant) || 0;

                  return (
                    <tr key={cotisation.id} className="hover:bg-slate-50/70 transition">
                      {/* Nom */}
                      <td className="py-3 px-4 md:px-6 font-bold text-[#0B1B3D] uppercase">
                        {etudiant?.nom || '—'}
                      </td>

                      {/* Prénoms */}
                      <td className="py-3 px-4 md:px-6 font-medium text-slate-800">
                        {etudiant?.prenom || '—'}
                      </td>

                      {/* Année */}
                      <td className="py-3 px-4 text-center text-xs font-semibold text-slate-600">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                          {etudiant?.niveau || '1ère année'}
                        </span>
                      </td>

                      {/* Pays */}
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <span>{pays?.nom || 'Inconnu'}</span>
                          {pays?.code_iso && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded-xs">
                              {pays.code_iso}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Montant */}
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {montantNum.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 text-center text-xs text-slate-600 font-medium">
                        {cotisation.date_paiement}
                      </td>

                      {/* Action (Admin) */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteCotisation(cotisation.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Supprimer ce versement"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-slate-400 text-sm">
                    Aucune cotisation trouvée correspondant à vos filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL ENREGISTRER UNE COTISATION (Saisie directe)         */}
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

            <form onSubmit={handleCreateCotisationDirect} className="p-6 space-y-4">
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
                    placeholder="Ex: Traoré"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden uppercase font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Prénoms
                  </label>
                  <input
                    type="text"
                    required
                    value={formPrenom}
                    onChange={(e) => setFormPrenom(e.target.value)}
                    placeholder="Ex: Mamadou"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Année d'étude
                  </label>
                  <select
                    value={formNiveau}
                    onChange={(e) => setFormNiveau(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden bg-white"
                  >
                    <option value="1ère année">1ère année</option>
                    <option value="2ème année">2ème année</option>
                    <option value="3ème année">3ème année</option>
                    <option value="4ème année">4ème année</option>
                    <option value="5ème année">5ème année</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Pays d'origine
                  </label>
                  <select
                    required
                    value={formPaysId}
                    onChange={(e) => setFormPaysId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden bg-white font-medium"
                  >
                    <option value="">Sélectionner un pays...</option>
                    {paysList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} {p.code_iso ? `(${p.code_iso})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
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
      {/* 5. MODAL GESTION DES PAYS (Ajouter / Modifier)              */}
      {/* ============================================================ */}
      {isPaysModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-lg">Répertoire des Pays Membres</h3>
                <p className="text-xs text-[#F58220]">Liste préenregistrée et personnalisable</p>
              </div>
              <button
                onClick={() => setIsPaysModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Formulaire Ajouter un pays */}
              <form onSubmit={handleAddPays} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-[#0B1B3D] uppercase tracking-wider">
                  Ajouter un nouveau pays membre
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Nom du pays (ex: Burundi)"
                      value={newPaysNom}
                      onChange={(e) => setNewPaysNom(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="Code (BI)"
                      value={newPaysCode}
                      onChange={(e) => setNewPaysCode(e.target.value)}
                      className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white uppercase"
                    />
                  </div>
                </div>
                <div className="text-right">
                  <button
                    type="submit"
                    disabled={submittingPays}
                    className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#F58220] hover:bg-[#E07114] transition disabled:opacity-50"
                  >
                    {submittingPays ? 'Ajout...' : '+ Ajouter au répertoire'}
                  </button>
                </div>
              </form>

              {/* Liste des pays avec bouton modifier */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Pays actuels ({paysList.length})
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  {paysList.map((p) => {
                    const isEditing = editingPaysId === p.id;
                    return (
                      <div key={p.id} className="p-2.5 flex items-center justify-between bg-white text-xs hover:bg-slate-50">
                        {isEditing ? (
                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={editingPaysNom}
                              onChange={(e) => setEditingPaysNom(e.target.value)}
                              className="p-1 text-xs border rounded-sm flex-1 font-semibold"
                            />
                            <input
                              type="text"
                              maxLength={5}
                              value={editingPaysCode}
                              onChange={(e) => setEditingPaysCode(e.target.value)}
                              className="p-1 text-xs border rounded-sm w-16 uppercase"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdatePays(p.id)}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-sm"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPaysId(null)}
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded-sm"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-[#0B1B3D]">{p.nom}</span>
                              {p.code_iso && (
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm">
                                  {p.code_iso}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => {
                                  setEditingPaysId(p.id);
                                  setEditingPaysNom(p.nom);
                                  setEditingPaysCode(p.code_iso || '');
                                }}
                                className="p-1 text-slate-400 hover:text-[#0B1B3D] hover:bg-slate-100 rounded-md transition"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeletePays(p.id, p.nom)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                title="Supprimer ce pays"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-right shrink-0">
              <button
                onClick={() => setIsPaysModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
