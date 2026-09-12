import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginForm } from './components/LoginForm';
import { TOTPVerificationModal } from './components/TOTPVerificationModal';
import { SecuritySettingsModal } from './components/SecuritySettingsModal';
import { Dashboard } from './components/Dashboard';

const AppContent: React.FC = () => {
  const { user, pendingMFAToken, loading } = useAuth();
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-400 font-mono">Iniciando motor de seguridad...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Step 2 MFA Modal */}
      {pendingMFAToken && <TOTPVerificationModal />}

      {/* Security & 2FA Modal */}
      {showSecurityModal && (
        <SecuritySettingsModal onClose={() => setShowSecurityModal(false)} />
      )}

      {user ? (
        <>
          <Navbar onOpenSecurity={() => setShowSecurityModal(true)} />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            <Dashboard onOpenSecurity={() => setShowSecurityModal(true)} />
          </main>
        </>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
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
