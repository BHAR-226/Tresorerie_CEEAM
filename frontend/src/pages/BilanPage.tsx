import React, { useState, useEffect } from 'react';
import {
  PieChart as PieIcon,
  Download,
  AlertTriangle,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { bilanService, exerciceService } from '../services/api';
import type { Bilan, Exercice } from '../types';

const COLORS = [
  '#0B1B3D',
  '#F58220',
  '#162C5B',
  '#E07114',
  '#2563EB',
  '#10B981',
  '#8B5CF6',
  '#F43F5E',
  '#64748B',
];

export const BilanPage: React.FC = () => {
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [exercice, setExercice] = useState<Exercice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [activeDetailedChart, setActiveDetailedChart] = useState<'budget' | 'categories' | 'mensuel'>('budget');

  const fetchData = async () => {
    try {
      setLoading(true);
      const activeEx = await exerciceService.getActif();
      setExercice(activeEx);
      if (activeEx) {
        const data = await bilanService.getBilan(activeEx.id);
        setBilan(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du bilan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadPdf = async () => {
    if (!exercice) return;
    try {
      setDownloadingPdf(true);
      await bilanService.downloadPdf(exercice.id, exercice.libelle);
    } catch (err) {
      console.error('Erreur de téléchargement PDF:', err);
      alert('Impossible de générer le rapport PDF pour le moment.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-[#0B1B3D] border-t-[#F58220] rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-600">Calcul du bilan financier en temps réel...</p>
      </div>
    );
  }

  if (!bilan || !exercice) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 shadow-xs max-w-xl mx-auto my-12">
        <AlertTriangle className="mx-auto text-[#F58220] mb-3" size={48} />
        <h3 className="text-lg font-bold text-slate-800">Aucun exercice actif trouvé</h3>
        <p className="text-sm text-slate-500 mt-1 mb-6">
          Veuillez configurer un exercice budgétaire actif pour consulter le bilan financier de la CEEAM.
        </p>
        <button
          onClick={fetchData}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-[#0B1B3D] text-white rounded-xl text-sm font-medium hover:bg-[#162C5B] transition shadow-xs"
        >
          <RefreshCw size={16} />
          <span>Réessayer</span>
        </button>
      </div>
    );
  }

  // Trier les pays par cotisation décroissante pour le BarChart horizontal
  const sortedCountries = [...(bilan.repartition_pays || [])].sort(
    (a, b) => b.total_cotise - a.total_cotise
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================ */}
      {/* 1. EN-TÊTE DU BILAN AVEC ACTION PDF                          */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Exercice {bilan.exercice_statut}</span>
            </span>
            <span className="text-xs text-slate-500 font-medium flex items-center space-x-1">
              <Calendar size={14} className="text-slate-400" />
              <span>Année Académique {bilan.exercice_libelle}</span>
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] mt-2">
            Tableau de Bord & Bilan Financier
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5">
            Synthèse comptable consolidée de la Communauté des Étudiants et Stagiaires Africains au Maroc
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={fetchData}
            title="Rafraîchir les calculs"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#0B1B3D] hover:bg-slate-50 transition"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#0B1B3D] hover:bg-[#162C5B] active:scale-[0.98] transition shadow-md shadow-[#0B1B3D]/10 disabled:opacity-60"
          >
            {downloadingPdf ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download size={18} className="text-[#F58220]" />
            )}
            <span>Télécharger Rapport PDF</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CARTES KPI PRINCIPALES                                    */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Solde Net Disponible */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-[#F58220]/40 transition">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Solde Net Disponible
          </span>
          <div className="mt-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#0B1B3D] tracking-tight">
              {bilan.solde_disponible.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm font-semibold text-[#F58220]">DH</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
              <span>Report antérieur:</span>
              <span className="font-semibold text-slate-700">
                {bilan.solde_initial.toLocaleString('fr-FR')} DH
              </span>
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0B1B3D] to-[#F58220]" />
        </div>

        {/* Total Cotisations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Cotisations Récoltées
          </span>
          <div className="mt-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-emerald-700 tracking-tight">
              +{bilan.total_cotise.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm font-semibold text-emerald-600">DH</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {bilan.top_contributeurs.length} pays contributeurs
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Total Dépenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-rose-300 transition">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dépenses Engagées
          </span>
          <div className="mt-3">
            <h2 className="text-2xl md:text-3xl font-extrabold text-rose-700 tracking-tight">
              -{bilan.total_depense.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
              <span className="text-sm font-semibold text-rose-600">DH</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Sur l'ensemble des activités de l'exercice
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Activité la plus budgétivore */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Activité Majeure
          </span>
          <div className="mt-3">
            <h2 className="text-lg md:text-xl font-bold text-[#0B1B3D] truncate tracking-tight" title={bilan.activite_plus_budgetivore?.activite_nom || 'Aucune'}>
              {bilan.activite_plus_budgetivore?.activite_nom || 'Aucune activité'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {bilan.activite_plus_budgetivore ? (
                <>
                  <span className="font-bold text-amber-600">
                    {bilan.activite_plus_budgetivore.total_depense.toLocaleString('fr-FR')} DH
                  </span>{' '}
                  ({bilan.activite_plus_budgetivore.pourcentage_des_depenses}% des dépenses)
                </>
              ) : (
                'Pas de dépenses enregistrées'
              )}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. GRAPHES GÉNÉRAUX IMMÉDIATS (AUTOMATIQUES AU CHARGEMENT)   */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1: Répartition des Cotisations par Pays (BarChart Horizontal) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B1B3D]">
                Cotisations par Pays Membre
              </h3>
              <p className="text-xs text-slate-500">
                Classement décroissant des contributions ({sortedCountries.length} pays)
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/20 rounded-lg text-xs font-bold">
              Automatique
            </span>
          </div>

          <div className="w-full h-[480px]">
            {sortedCountries.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedCountries}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#F1F5F9" />
                  <XAxis type="number" tickFormatter={(val) => `${val} DH`} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <YAxis
                    dataKey="pays_nom"
                    type="category"
                    interval={0}
                    tick={{ fill: '#0B1B3D', fontSize: 11, fontWeight: 500 }}
                    width={115}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} DH`, 'Cotisations']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total_cotise" fill="#0B1B3D" radius={[0, 6, 6, 0]}>
                    {sortedCountries.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index < 3 ? '#F58220' : '#0B1B3D'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Aucune cotisation enregistrée pour cet exercice
              </div>
            )}
          </div>
        </div>

        {/* Graphique 2: Dépenses Globales par Activité */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-[#0B1B3D]">
                Dépenses Réalisées par Activité
              </h3>
              <p className="text-xs text-slate-500">
                Poids financier de chaque manifestation CEEAM
              </p>
            </div>
            <span className="px-2.5 py-1 bg-[#FFF7ED] text-[#F58220] border border-[#F58220]/20 rounded-lg text-xs font-bold">
              Automatique
            </span>
          </div>

          <div className="w-full h-[480px]">
            {bilan.comparaison_activites && bilan.comparaison_activites.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bilan.comparaison_activites}
                  margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="nom"
                    tick={{ fill: '#0B1B3D', fontSize: 11 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={70}
                  />
                  <YAxis tickFormatter={(val) => `${val} DH`} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString('fr-FR')} DH`, 'Dépense Totale']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total_depense" fill="#F58220" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Aucune activité enregistrée avec des dépenses
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. GRAPHES DÉTAILLÉS INTERACTIFS (SUR CLIC EXPLICITE)        */}
      {/* ============================================================ */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold text-[#0B1B3D]">
                Analyses Graphiques Détaillées & Approfondies
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-[#0B1B3D] text-white">
                Interactif
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cliquez sur un des onglets ci-dessous pour afficher le graphique d'analyse approfondie correspondant.
            </p>
          </div>

          {/* Boutons d'onglets pour switcher les graphes explicites */}
          <div className="flex items-center space-x-2 p-1 bg-slate-100/80 rounded-xl shrink-0">
            <button
              onClick={() => setActiveDetailedChart('budget')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeDetailedChart === 'budget'
                  ? 'bg-white text-[#0B1B3D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 size={15} className={activeDetailedChart === 'budget' ? 'text-[#F58220]' : ''} />
              <span>Budget vs Réel</span>
            </button>

            <button
              onClick={() => setActiveDetailedChart('categories')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeDetailedChart === 'categories'
                  ? 'bg-white text-[#0B1B3D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon size={15} className={activeDetailedChart === 'categories' ? 'text-[#F58220]' : ''} />
              <span>Par Catégorie</span>
            </button>

            <button
              onClick={() => setActiveDetailedChart('mensuel')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeDetailedChart === 'mensuel'
                  ? 'bg-white text-[#0B1B3D] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon size={15} className={activeDetailedChart === 'mensuel' ? 'text-[#F58220]' : ''} />
              <span>Évolution Cash-flow</span>
            </button>
          </div>
        </div>

        {/* Contenu dynamique selon l'onglet cliqué */}
        <div className="pt-6">
          {/* ONGLET 1 : Budget Prévu vs Dépenses Réelles */}
          {activeDetailedChart === 'budget' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500">
                <p>
                  Comparaison du budget prévisionnel alloué avec les dépenses réelles enregistrées par activité.
                </p>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#0B1B3D]" />
                    <span>Budget Prévu</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-xs bg-[#F58220]" />
                    <span>Dépensé Réel</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-88 pt-2">
                {bilan.comparaison_activites && bilan.comparaison_activites.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={bilan.comparaison_activites}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis
                        dataKey="nom"
                        tick={{ fill: '#0B1B3D', fontSize: 11, fontWeight: 500 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                        height={70}
                      />
                      <YAxis tickFormatter={(val) => `${val} DH`} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${Number(val).toLocaleString('fr-FR')} DH`,
                          name === 'budget_prevu' ? 'Budget Prévu' : 'Dépense Réelle',
                        ]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="budget_prevu" name="budget_prevu" fill="#0B1B3D" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="total_depense" name="total_depense" fill="#F58220" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Aucune donnée comparative d'activité disponible
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ONGLET 2 : Répartition par Catégorie (Donut Chart) */}
          {activeDetailedChart === 'categories' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-slate-500">
                Ventilation de toutes les dépenses par catégorie transversale (Restauration, Logistique, Communication, etc.).
              </p>

              <div className="w-full h-88 pt-2 flex flex-col md:flex-row items-center justify-center">
                {bilan.repartition_categories && bilan.repartition_categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={bilan.repartition_categories}
                        dataKey="total"
                        nameKey="categorie_nom"
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={110}
                        paddingAngle={3}
                      >
                        {bilan.repartition_categories.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any, _: any, item: any) => [
                          `${Number(val).toLocaleString('fr-FR')} DH (${item.payload.pourcentage}%)`,
                          item.payload.categorie_nom,
                        ]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Aucune catégorie de dépense enregistrée
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ONGLET 3 : Évolution Chronologique du Cash-Flow */}
          {activeDetailedChart === 'mensuel' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500">
                <p>
                  Suivi temporel des flux financiers mensuels : entrées (cotisations), sorties (dépenses) et solde net.
                </p>
                <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-medium">
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span>Cotisations</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span>Dépenses</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#0B1B3D]" />
                    <span>Solde Net</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-88 pt-2">
                {bilan.evolution_mensuelle && bilan.evolution_mensuelle.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={bilan.evolution_mensuelle}
                      margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="mois" tick={{ fill: '#0B1B3D', fontSize: 12, fontWeight: 500 }} />
                      <YAxis tickFormatter={(val) => `${val} DH`} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          `${Number(val).toLocaleString('fr-FR')} DH`,
                          name === 'cotisations' ? 'Cotisations' : name === 'depenses' ? 'Dépenses' : 'Solde Net',
                        ]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Line type="monotone" dataKey="cotisations" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="depenses" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="solde" stroke="#0B1B3D" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                    Données temporelles insuffisantes pour tracer le flux
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
