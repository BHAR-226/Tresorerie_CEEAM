import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Lock,
  Plus,
  BarChart2,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { bilanService, exerciceService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { ExerciceHistorique, Exercice } from '../types';

interface HistoriquePageProps {
  onOpenLogin: () => void;
}

export const HistoriquePage: React.FC<HistoriquePageProps> = ({ onOpenLogin }) => {
  const { isAdmin } = useAuth();
  const [historique, setHistorique] = useState<ExerciceHistorique[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isClotureModalOpen, setIsClotureModalOpen] = useState(false);
  const [isNewExerciceModalOpen, setIsNewExerciceModalOpen] = useState(false);

  // Formulaire Nouvel Exercice
  const [formLibelle, setFormLibelle] = useState('');
  const [formDateDebut, setFormDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [formReporterSolde, setFormReporterSolde] = useState(true);
  const [submittingNewExercice, setSubmittingNewExercice] = useState(false);
  const [submittingCloture, setSubmittingCloture] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [histRes, actifRes] = await Promise.all([
        bilanService.getHistorique(),
        exerciceService.getActif().catch(() => null),
      ]);
      setHistorique(histRes.exercices || []);
      setExerciceActif(actifRes);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCloturer = async () => {
    if (!exerciceActif) return;
    try {
      setSubmittingCloture(true);
      await exerciceService.cloturer(exerciceActif.id);
      setIsClotureModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de la clôture de l’exercice');
    } finally {
      setSubmittingCloture(false);
    }
  };

  const handleCreateExercice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formLibelle) return;
    try {
      setSubmittingNewExercice(true);
      await exerciceService.create({
        libelle: formLibelle,
        date_debut: formDateDebut,
        reporter_solde: formReporterSolde,
      });
      setIsNewExerciceModalOpen(false);
      setFormLibelle('');
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Erreur lors de l’ouverture du nouvel exercice');
    } finally {
      setSubmittingNewExercice(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B1B3D] border-t-[#F58220] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Chargement de l'historique multi-exercices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* 1. HEADER PAGE & ACTIONS                                     */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 flex items-center space-x-1.5">
              <History size={13} className="text-[#F58220]" />
              <span>Mémoire Financière & Continuité</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Historique Multi-Exercices
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Évolution comparative des mandats annuels et clôture officielle des comptes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            <>
              {exerciceActif && (
                <button
                  onClick={() => setIsClotureModalOpen(true)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-800 font-semibold text-xs hover:bg-amber-100 transition"
                >
                  <Lock size={15} />
                  <span>Clôturer Exercice {exerciceActif.libelle}</span>
                </button>
              )}

              <button
                onClick={() => setIsNewExerciceModalOpen(true)}
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs"
              >
                <Plus size={16} className="text-[#F58220]" />
                <span>Nouvel Exercice Annuel</span>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs text-[#0B1B3D] bg-slate-100 hover:bg-slate-200 transition"
            >
              <ShieldAlert size={16} className="text-[#F58220]" />
              <span>Connexion Trésorier pour clôturer</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. GRAPHIQUE COMPARATIF MULTI-ANNÉES                         */}
      {/* ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0B1B3D] flex items-center space-x-2">
              <BarChart2 size={18} className="text-[#F58220]" />
              <span>Comparaison Annuelle (Cotisations vs Dépenses)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Visualisation de la santé financière sur l'ensemble des exercices enregistrés
            </p>
          </div>
        </div>

        <div className="w-full h-72">
          {historique.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historique} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="libelle" tick={{ fill: '#0B1B3D', fontSize: 12, fontWeight: 600 }} />
                <YAxis tickFormatter={(val) => `${val} DH`} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    `${Number(val).toLocaleString('fr-FR')} DH`,
                    name === 'total_cotise' ? 'Cotisations' : 'Dépenses',
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(val) => (
                    <span className="text-xs font-semibold text-slate-700">
                      {val === 'total_cotise' ? 'Cotisations Récoltées' : 'Dépenses Engagées'}
                    </span>
                  )}
                />
                <Bar dataKey="total_cotise" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_depense" fill="#F43F5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Aucun historique disponible
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. TABLEAU SYNTHÉTIQUE DES EXERCICES                         */}
      {/* ============================================================ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#0B1B3D]">
            Répertoire des Exercices Budgétaires CEEAM
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            {historique.length} exercice(s) comptabilisé(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 md:px-6">Exercice</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Solde Initial</th>
                <th className="py-3 px-4 text-right">Cotisations</th>
                <th className="py-3 px-4 text-right">Dépenses</th>
                <th className="py-3 px-4 text-right">Solde Net Final</th>
                <th className="py-3 px-4 text-center">Cotisants</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {historique.map((ex) => {
                const isActif = ex.statut === 'EN_COURS';
                return (
                  <tr key={ex.exercice_id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 md:px-6">
                      <div className="font-bold text-[#0B1B3D] flex items-center space-x-2">
                        <span>{ex.libelle}</span>
                        {isActif && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{ex.date_debut}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isActif ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} />
                          <span>En cours</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <Lock size={12} />
                          <span>Clôturé</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      {ex.solde_initial.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                      +{ex.total_cotise.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-rose-700">
                      -{ex.total_depense.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-[#0B1B3D]">
                      {ex.solde_final.toLocaleString('fr-FR')} DH
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs font-semibold text-slate-700">
                      {ex.nombre_etudiants_cotisants}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MODAL CLÔTURE D'EXERCICE                                  */}
      {/* ============================================================ */}
      {isClotureModalOpen && exerciceActif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Clôturer l'exercice {exerciceActif.libelle}</h3>
                <p className="text-xs text-[#F58220]">Opération officielle de fin de mandat</p>
              </div>
              <button
                onClick={() => setIsClotureModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5 text-amber-900 text-xs">
                <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-bold">Attention :</p>
                  <p className="mt-0.5">
                    La clôture verrouille définitivement cet exercice. Le solde final net sera calculé et prêt à être reporté lors de la création du prochain exercice.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsClotureModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleCloturer}
                  disabled={submittingCloture}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition shadow-xs disabled:opacity-50"
                >
                  {submittingCloture ? 'Clôture en cours...' : 'Confirmer la Clôture'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. MODAL NOUVEL EXERCICE BUDGÉTAIRE                          */}
      {/* ============================================================ */}
      {isNewExerciceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-[#0B1B3D] text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Ouvrir un Nouvel Exercice</h3>
                <p className="text-xs text-[#F58220]">Nouvelle année académique CEEAM</p>
              </div>
              <button
                onClick={() => setIsNewExerciceModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/10 text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExercice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Libellé de l'exercice
                </label>
                <input
                  type="text"
                  required
                  value={formLibelle}
                  onChange={(e) => setFormLibelle(e.target.value)}
                  placeholder="Ex: 2027-2028"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date de début officielle
                </label>
                <input
                  type="date"
                  required
                  value={formDateDebut}
                  onChange={(e) => setFormDateDebut(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:border-[#F58220] outline-hidden"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formReporterSolde}
                    onChange={(e) => setFormReporterSolde(e.target.checked)}
                    className="w-4 h-4 rounded-sm border-slate-300 text-[#0B1B3D] focus:ring-[#F58220]"
                  />
                  <span className="text-xs font-medium text-slate-700">
                    Reporter automatiquement le solde final de l'exercice précédent
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsNewExerciceModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingNewExercice}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0B1B3D] hover:bg-[#162C5B] transition shadow-xs disabled:opacity-50"
                >
                  {submittingNewExercice ? 'Création...' : 'Ouvrir l’exercice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
