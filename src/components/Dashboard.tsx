import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlatformCompaniesView } from './catalog/PlatformCompaniesView';
import { VehiclesManager } from './catalog/VehiclesManager';
import { RoutesManager } from './catalog/RoutesManager';
import { ClientsManager } from './catalog/ClientsManager';
import { ContractsManager } from './catalog/ContractsManager';
import { TeammatesManager } from './catalog/TeammatesManager';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  User,
  Calendar,
  Layers,
  LogOut,
  Shield,
  Truck,
  Navigation,
  Users,
  FileText,
  Building2,
} from 'lucide-react';

interface DashboardProps {
  onOpenSecurity: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSecurity }) => {
  const { user, logoutAll } = useAuth();
  const isPlatformAdmin = user?.role_name === 'platform_admin';
  const isAdmin = user?.role_name === 'admin';

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>(
    isPlatformAdmin ? 'platform' : 'vehicles'
  );

  React.useEffect(() => {
    if (isPlatformAdmin) {
      if (activeTab !== 'platform' && activeTab !== 'security') {
        setActiveTab('platform');
      }
    } else {
      if (activeTab === 'platform') {
        setActiveTab('vehicles');
      }
    }
  }, [isPlatformAdmin]);

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleString()
    : 'N/A';

  const getRoleBadgeInfo = () => {
    switch (user?.role_name) {
      case 'platform_admin':
        return {
          label: 'Platform Admin',
          color: 'bg-[#776de8]/20 text-[#bbb3ff] border-[#776de8]/40',
        };
      case 'admin':
        return {
          label: 'Administrador (Admin)',
          color: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        };
      case 'operations':
        return {
          label: 'Operaciones (Operations)',
          color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
        };
      case 'finance':
        return {
          label: 'Finanzas (Finance)',
          color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        };
      default:
        return {
          label: user?.role_name || 'Usuario',
          color: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const roleInfo = getRoleBadgeInfo();

  return (
    <div className="space-y-6 pb-16">
      {/* Top Tenant / Identity Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md border ${roleInfo.color}`}
              >
                {roleInfo.label}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sesión Activa
              </span>
              {user?.company_id && (
                <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                  Tenant: {user.company_id.slice(0, 8)}...
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {user?.email}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPlatformAdmin
                ? 'Plataforma Global CargoVigil — Administración de Infraestructura y Clientes'
                : 'Panel Operativo Multi-Tenant — Catálogo y Gestión Logística'}
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
              <KeyRound className="w-4 h-4 text-[#776de8]" />
              <span>{user?.totp_enabled ? 'Ajustes de 2FA' : 'Activar 2FA'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {isPlatformAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('platform')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'platform'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Gestión de Empresas</span>
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'security'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Seguridad & Cuenta</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'vehicles'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Flotas / Vehículos</span>
            </button>

            <button
              onClick={() => setActiveTab('routes')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'routes'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>Rutas</span>
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'clients'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Clientes</span>
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'contracts'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Contratos</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('teammates')}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'teammates'
                    ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Users className="w-4 h-4 text-purple-400" />
                <span>Equipo</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'security'
                  ? 'bg-[#776de8] text-white shadow-lg shadow-[#776de8]/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Seguridad</span>
            </button>
          </>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="transition-all duration-200">
        {activeTab === 'platform' && isPlatformAdmin && <PlatformCompaniesView />}
        {activeTab === 'vehicles' && !isPlatformAdmin && <VehiclesManager />}
        {activeTab === 'routes' && !isPlatformAdmin && <RoutesManager />}
        {activeTab === 'clients' && !isPlatformAdmin && <ClientsManager />}
        {activeTab === 'contracts' && !isPlatformAdmin && <ContractsManager />}
        {activeTab === 'teammates' && isAdmin && <TeammatesManager />}

        {activeTab === 'security' && (
          <div className="space-y-6">
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
                <div
                  className={`text-lg font-bold ${
                    user?.totp_enabled ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {user?.totp_enabled ? 'Protegido (TOTP)' : 'Sin Configurar'}
                </div>
                <p className="text-[11px] text-slate-500">
                  {user?.totp_enabled ? 'Cifrado AES-256-GCM' : 'Requiere activación'}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-1">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-medium">Rol del Sistema</span>
                  <Shield className="w-4 h-4 text-[#bbb3ff]" />
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
                  <span className="text-xs font-medium">Identificador de Usuario</span>
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xs font-mono text-white truncate" title={user?.id}>
                  {user?.id}
                </div>
                <p className="text-[11px] text-slate-500">UUID único en base de datos</p>
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
                  <h3 className="text-sm font-bold text-white">
                    Gestión de Sesión y Credenciales
                  </h3>
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
                    {user?.totp_enabled
                      ? 'Administrar códigos de recuperación →'
                      : 'Configurar 2FA ahora →'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Cerrar Sesiones Activas</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Revoca todos los tokens de refresco emitidos para tu cuenta en otros
                    dispositivos y navegadores.
                  </p>
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          '¿Deseas revocar todas las sesiones activas en todos los dispositivos?'
                        )
                      ) {
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
        )}
      </div>
    </div>
  );
};
