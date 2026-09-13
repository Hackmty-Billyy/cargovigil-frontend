import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingNavbar } from './components/LandingNavbar';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Navbar } from './components/Navbar';
import { TOTPVerificationModal } from './components/TOTPVerificationModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { Dashboard } from './components/Dashboard';
import { LogisticsLiveRadarView } from './components/logistics/LogisticsLiveRadarView';

const AppContent: React.FC = () => {
  const { user, pendingMFAToken, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Sync with browser URL (popstate for Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-2 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium text-gray-400">Cargando CargoVigil...</p>
      </div>
    );
  }

  // 1. If user is authenticated, render either /radar or /dashboard
  if (user) {
    const isRadarRoute = currentPath === '/radar';

    return (
      <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-[#776de8] selection:text-white font-sans">
        {showSecurityModal && (
          <SecuritySettingsModal onClose={() => setShowSecurityModal(false)} />
        )}
        <Navbar onOpenSecurity={() => setShowSecurityModal(true)} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          {isRadarRoute ? (
            <LogisticsLiveRadarView />
          ) : (
            <Dashboard onOpenSecurity={() => setShowSecurityModal(true)} />
          )}
        </main>
      </div>
    );
  }

  // 2. Unauthenticated views: Check URL path (/login vs /)
  const isLoginPage = currentPath === '/login';

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 font-sans">
      {/* Step 2 MFA Modal if login requires TOTP */}
      {pendingMFAToken && <TOTPVerificationModal />}

      {isLoginPage ? (
        <LoginPage onBackToHome={() => navigateTo('/')} />
      ) : (
        <div className="min-h-screen flex flex-col bg-gray-950">
          <LandingNavbar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            onOpenLogin={() => navigateTo('/login')}
          />
          <LandingPage onOpenLogin={() => navigateTo('/login')} />
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
