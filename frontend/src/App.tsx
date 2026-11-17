import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar, type TabType } from './components/layout/Navbar';
import { LoginModal } from './components/auth/LoginModal';
import { BilanPage } from './pages/BilanPage';
import { CotisationsPage } from './pages/CotisationsPage';
import { DepensesPage } from './pages/DepensesPage';
import { HistoriquePage } from './pages/HistoriquePage';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('bilan');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row text-slate-900">
      {/* Navigation (Sidebar Desktop + Header Mobile + Bottom Nav Mobile) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Conteneur de Contenu Principal Responsive */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 flex-1">
          {activeTab === 'bilan' && <BilanPage />}
          {activeTab === 'cotisations' && (
            <CotisationsPage onOpenLogin={() => setIsLoginModalOpen(true)} />
          )}
          {activeTab === 'depenses' && (
            <DepensesPage onOpenLogin={() => setIsLoginModalOpen(true)} />
          )}
          {activeTab === 'historique' && (
            <HistoriquePage onOpenLogin={() => setIsLoginModalOpen(true)} />
          )}
        </div>
      </main>

      {/* Modal d'authentification Trésorier */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
