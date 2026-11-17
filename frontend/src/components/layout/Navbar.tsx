import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Receipt,
  History,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export type TabType = 'bilan' | 'cotisations' | 'depenses' | 'historique';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
}) => {
  const { user, isAdmin, logout } = useAuth();

  const navItems = [
    { id: 'bilan' as TabType, label: 'Bilan', icon: LayoutDashboard },
    { id: 'cotisations' as TabType, label: 'Cotisations', icon: Users },
    { id: 'depenses' as TabType, label: 'Dépenses', icon: Receipt },
    { id: 'historique' as TabType, label: 'Historique', icon: History },
  ];

  return (
    <>
      {/* ============================================================ */}
      {/* 1. SIDEBAR DESKTOP (Visible à partir de md:)                */}
      {/* ============================================================ */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B1B3D] text-white shrink-0 min-h-screen border-r border-[#162C5B]">
        {/* Logo & Titre */}
        <div className="p-6 border-b border-[#162C5B] flex items-center space-x-3.5">
          <img
            src="/logo.jpg"
            alt="Logo CEEAM"
            className="w-12 h-12 rounded-full border-2 border-[#F58220] object-cover shadow-md shadow-black/30"
          />
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-tight text-white">
              CEEAM
            </h1>
            <p className="text-xs text-[#F58220] font-medium tracking-wide uppercase">
              Trésorerie
            </p>
          </div>
        </div>

        {/* Menu de navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#F58220] text-white shadow-lg shadow-[#F58220]/25 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Carte Utilisateur / Authentification (Bas de Sidebar) */}
        <div className="p-4 border-t border-[#162C5B]">
          {isAdmin ? (
            <div className="bg-[#162C5B]/80 p-3.5 rounded-xl border border-[#F58220]/30 space-y-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F58220] flex items-center justify-center text-white shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">
                    {user?.prenom} {user?.nom}
                  </p>
                  <p className="text-[10px] text-[#F58220] font-semibold uppercase tracking-wider">
                    Trésorier Général
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white hover:bg-red-500/20 rounded-lg transition"
              >
                <LogOut size={14} />
                <span>Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-white/10 hover:bg-[#F58220] hover:text-white transition shadow-xs"
            >
              <LogIn size={16} />
              <span>Connexion Trésorier</span>
            </button>
          )}
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 2. HEADER TOP MOBILE (Visible uniquement sur mobile < md:)   */}
      {/* ============================================================ */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0B1B3D] text-white px-4 py-3 border-b border-[#162C5B] flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.jpg"
            alt="Logo CEEAM"
            className="w-9 h-9 rounded-full border-2 border-[#F58220] object-cover"
          />
          <div>
            <h1 className="font-extrabold text-sm text-white leading-none">CEEAM</h1>
            <p className="text-[10px] text-[#F58220] font-medium uppercase tracking-wider">Trésorerie</p>
          </div>
        </div>

        <div>
          {isAdmin ? (
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-white/10 text-slate-200 hover:text-white flex items-center space-x-1.5 text-xs font-medium"
            >
              <UserCheck size={16} className="text-[#F58220]" />
              <span>Trésorier</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="py-1.5 px-3 rounded-lg bg-[#F58220] text-white text-xs font-semibold flex items-center space-x-1 shadow-xs"
            >
              <LogIn size={14} />
              <span>Connexion</span>
            </button>
          )}
        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. BOTTOM NAVIGATION MOBILE (Barre ergonomique en bas)       */}
      {/* ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-2 py-1.5 flex justify-around items-center shadow-2xl safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-3 rounded-xl text-[10px] font-medium transition ${
                isActive
                  ? 'text-[#F58220] font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-[#F58220]' : 'text-slate-500'} />
              <span className="mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
