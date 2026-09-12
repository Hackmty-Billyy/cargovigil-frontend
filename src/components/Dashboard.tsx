import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  User,
  BadgeCheck,
  Calendar,
  Layers,
  LogOut,
  Shield,
} from 'lucide-react';

interface DashboardProps {
  onOpenSecurity: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSecurity }) => {
  const { user, logoutAll } = useAuth();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleString()
    : 'N/A';

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Rol: {user?.role_name?.toUpperCase()}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sesión Activa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {user?.email}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Panel de control y seguridad de usuario
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSecurity}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                user?.totp_enabled
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <span>{user?.totp_enabled ? 'Ajustes de 2FA' : 'Activar 2FA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real Account Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Estado 2FA</span>
            {user?.totp_enabled ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className={`text-lg font-bold ${user?.totp_enabled ? 'text-emerald-400' : 'text-amber-400'}`}>
            {user?.totp_enabled ? 'Protegido (TOTP)' : 'Sin Configurar'}
          </div>
          <p className="text-[11px] text-slate-500">
            {user?.totp_enabled ? 'Cifrado AES-256-GCM' : 'Requiere activación'}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Rol del Sistema</span>
            <BadgeCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-white capitalize">
            {user?.role_name}
          </div>
          <p className="text-[11px] text-slate-500">
            Nivel de acceso ID: {user?.role_id}
          </p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Identificador</span>
            <User className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xs font-mono text-white truncate" title={user?.id}>
            {user?.id}
          </div>
          <p className="text-[11px] text-slate-500">UUID único de usuario</p>
        </div>

        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Fecha de Registro</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xs text-white truncate" title={formattedDate}>
            {formattedDate}
          </div>
          <p className="text-[11px] text-slate-500">Creación de cuenta</p>
        </div>
      </div>

      {/* Security & Sessions Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Gestión de Sesión y Credenciales</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Autenticación de Dos Factores (2FA)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {user?.totp_enabled
                ? 'Tu cuenta requiere un código de 6 dígitos cada vez que inicias sesión. Puedes consultar o regenerar tus códigos de emergencia.'
                : 'Protege tu cuenta agregando una capa extra de seguridad mediante Google Authenticator o Authy.'}
            </p>
            <button
              onClick={onOpenSecurity}
              className="mt-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {user?.totp_enabled ? 'Administrar códigos de recuperación →' : 'Configurar 2FA ahora →'}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <LogOut className="w-4 h-4 text-red-400" />
              <span>Cerrar Sesiones Activas</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Revoca todos los tokens de refresco emitidos para tu cuenta en otros dispositivos y navegadores.
            </p>
            <button
              onClick={() => {
                if (window.confirm('¿Deseas revocar todas las sesiones activas en todos los dispositivos?')) {
                  logoutAll();
                }
              }}
              className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-medium transition cursor-pointer"
            >
              Revocar todas las sesiones
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
