import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, LogOut, KeyRound, Truck, UserCircle } from 'lucide-react';

interface NavbarProps {
  onOpenSecurity: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSecurity }) => {
  const { user, logout, logoutAll } = useAuth();

  const getRoleBadge = (role?: string) => {
    switch (role?.toLowerCase()) {
      case 'platform_admin':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#776de8]/20 text-[#bbb3ff] border border-[#776de8]/40">
            Platform Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Administrador
          </span>
        );
      case 'finance':
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Finanzas
          </span>
        );
      case 'operations':
      default:
        return (
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Operaciones
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#776de8] to-[#bbb3ff] flex items-center justify-center shadow-lg shadow-[#776de8]/25 ring-1 ring-white/10">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">CargoVigil</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                Fintech v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Logistics & Asset Security Engine</p>
          </div>
        </div>

        {/* View switcher navigation */}
        {user && (
          <nav className="hidden sm:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                if (window.location.pathname !== '/dashboard') {
                  window.history.pushState({}, '', '/dashboard');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                window.location.pathname !== '/radar'
                  ? 'bg-[#776de8] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Catálogo & Control
            </button>
            <button
              onClick={() => {
                if (window.location.pathname !== '/radar') {
                  window.history.pushState({}, '', '/radar');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                window.location.pathname === '/radar'
                  ? 'bg-[#776de8] text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Radar & Mapas</span>
            </button>
          </nav>
        )}

        {/* User profile & Controls */}
        {user && (
          <div className="flex items-center gap-3">
            {/* 2FA Status indicator */}
            <button
              onClick={onOpenSecurity}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                user.totp_enabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse'
              }`}
              title="Configuración de seguridad 2FA"
            >
              {user.totp_enabled ? (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>2FA Activo</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>2FA Inactivo</span>
                </>
              )}
            </button>

            {/* User Info */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 border border-slate-700/60 rounded-xl">
              <UserCircle className="w-5 h-5 text-slate-400" />
              <div className="text-left text-xs">
                <p className="font-medium text-slate-200">{user.email}</p>
              </div>
              {getRoleBadge(user.role_name)}
            </div>

            {/* Security Settings button */}
            <button
              onClick={onOpenSecurity}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 rounded-xl transition"
              title="Gestionar Seguridad y 2FA"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout Options */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-red-500/20 hover:text-red-300 border border-slate-700/60 hover:border-red-500/30 rounded-xl transition"
                title="Cerrar sesión actual"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Deseas revocar todas las sesiones activas en todos los dispositivos?')) {
                    logoutAll();
                  }
                }}
                className="hidden lg:inline-flex text-[11px] text-slate-400 hover:text-red-400 px-2 py-1.5 rounded-lg transition"
                title="Revocar todas las sesiones en otros dispositivos"
              >
                Cerrar todas
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
