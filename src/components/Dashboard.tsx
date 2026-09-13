import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PlatformCompaniesView } from './catalog/PlatformCompaniesView';
import { VehiclesManager } from './catalog/VehiclesManager';
import { RoutesManager } from './catalog/RoutesManager';
import { ClientsManager } from './catalog/ClientsManager';
import { ContractsManager } from './catalog/ContractsManager';
import { TeammatesManager } from './catalog/TeammatesManager';
import { TreasuryDashboard } from './treasury/TreasuryDashboard';
import { FuelDashboard } from './fuel/FuelDashboard';
import { RouteCostDashboard } from './routecost/RouteCostDashboard';
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
  Compass,
  Landmark,
  Flame,
  Timer,
} from 'lucide-react';
import { LogisticsLiveRadarView } from './logistics/LogisticsLiveRadarView';

interface DashboardProps {
  onOpenSecurity: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenSecurity }) => {
  const { user, logoutAll } = useAuth();
  const isPlatformAdmin = user?.role_name === 'platform_admin';
  const isAdmin = user?.role_name === 'admin';
  const isFinance = user?.role_name === 'finance';
  const isOperations = user?.role_name === 'operations';
  const canAccessTreasury = isAdmin || isFinance;
  const canAccessFuel = isAdmin || isFinance || isOperations || isPlatformAdmin;

  // Active Tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (isPlatformAdmin) return 'platform';
    if (isFinance) return 'treasury';
    return 'radar';
  });

  React.useEffect(() => {
    if (isPlatformAdmin) {
      if (activeTab !== 'platform' && activeTab !== 'security') {
        setActiveTab('platform');
      }
    } else if (isFinance && !isAdmin) {
      if (activeTab === 'platform' || activeTab === 'teammates') {
        setActiveTab('treasury');
      }
    } else {
      if (activeTab === 'platform') {
        setActiveTab('radar');
      }
    }
  }, [isPlatformAdmin, isFinance, isAdmin]);

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleString()
    : 'N/A';

  const getRoleBadgeInfo = () => {
    switch (user?.role_name) {
      case 'platform_admin':
        return {
          label: 'Platform Admin',
          color: 'bg-indigo-900/30 text-indigo-300 border-indigo-800/50',
        };
      case 'admin':
        return {
          label: 'Administrador',
          color: 'bg-purple-900/30 text-purple-300 border-purple-800/50',
        };
      case 'operations':
        return {
          label: 'Operaciones',
          color: 'bg-cyan-900/30 text-cyan-300 border-cyan-800/50',
        };
      case 'finance':
        return {
          label: 'Finanzas',
          color: 'bg-emerald-900/30 text-emerald-300 border-emerald-800/50',
        };
      default:
        return {
          label: user?.role_name || 'Usuario',
          color: 'bg-gray-800 text-gray-300 border-gray-700',
        };
    }
  };

  const roleInfo = getRoleBadgeInfo();

  return (
    <div className="space-y-5 pb-16 max-w-7xl mx-auto">
      {/* Flowbite Minimalist Top Tenant / Identity Banner */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={`px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider rounded-md border ${roleInfo.color}`}
              >
                {roleInfo.label}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Sesión Activa
              </span>
              {user?.company_id && (
                <span className="text-xs font-mono text-gray-400 bg-gray-800 px-2 py-0.5 rounded-md border border-gray-700">
                  Tenant: {user.company_id.slice(0, 8)}...
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {user?.email}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {isPlatformAdmin
                ? 'Plataforma Global CargoVigil — Administración de Infraestructura y Clientes'
                : 'Panel Operativo Multi-Tenant — Catálogo y Gestión Logística'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenSecurity}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer border ${
              user?.totp_enabled
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700'
                : 'bg-amber-900/20 hover:bg-amber-900/30 text-amber-300 border-amber-800/50'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-400" />
            <span>{user?.totp_enabled ? 'Ajustes de 2FA' : 'Activar 2FA'}</span>
          </button>
        </div>
      </div>

      {/* Flowbite Minimalist Navigation Tabs */}
      <div className="border-b border-gray-800 pb-2.5 flex items-center gap-1.5 overflow-x-auto">
        {isPlatformAdmin ? (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('platform')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'platform'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Gestión de Empresas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Seguridad &amp; Cuenta</span>
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('radar')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'radar'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Radar &amp; Mapas</span>
            </button>

            {canAccessTreasury && (
              <button
                type="button"
                onClick={() => setActiveTab('treasury')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'treasury'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>Tesorería &amp; Flujo 30D</span>
              </button>
            )}

            {canAccessFuel && (
              <button
                type="button"
                onClick={() => setActiveTab('fuel')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'fuel'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Combustible</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('routecost')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'routecost'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Timer className="w-3.5 h-3.5" />
              <span>Fricciones &amp; Costos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vehicles')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'vehicles'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Flotas / Vehículos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('routes')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'routes'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Rutas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'clients'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Clientes</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'contracts'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Contratos</span>
            </button>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setActiveTab('teammates')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                  activeTab === 'teammates'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Equipo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'security'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Seguridad</span>
            </button>
          </>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="transition-all duration-200">
        {activeTab === 'radar' && !isPlatformAdmin && <LogisticsLiveRadarView />}
        {activeTab === 'treasury' && canAccessTreasury && <TreasuryDashboard />}
        {activeTab === 'fuel' && canAccessFuel && (
          <FuelDashboard
            isPlatformAdmin={isPlatformAdmin}
            isAdmin={isAdmin}
            isFinance={isFinance}
            isOperations={isOperations}
          />
        )}
        {activeTab === 'routecost' && !isPlatformAdmin && <RouteCostDashboard />}
        {activeTab === 'platform' && isPlatformAdmin && <PlatformCompaniesView />}
        {activeTab === 'vehicles' && !isPlatformAdmin && <VehiclesManager />}
        {activeTab === 'routes' && !isPlatformAdmin && <RoutesManager />}
        {activeTab === 'clients' && !isPlatformAdmin && <ClientsManager />}
        {activeTab === 'contracts' && !isPlatformAdmin && <ContractsManager />}
        {activeTab === 'teammates' && isAdmin && <TeammatesManager />}

        {activeTab === 'security' && (
          <div className="space-y-5">
            {/* Flowbite Account Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-gray-400 mb-1.5">
                  <span className="text-xs font-medium">Estado 2FA</span>
                  {user?.totp_enabled ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div
                  className={`text-base font-bold ${
                    user?.totp_enabled ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  {user?.totp_enabled ? 'Protegido (TOTP)' : 'Sin Configurar'}
                </div>
                <p className="text-[11px] text-gray-500">
                  {user?.totp_enabled ? 'Cifrado AES-256-GCM' : 'Requiere activación'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-gray-400 mb-1.5">
                  <span className="text-xs font-medium">Rol del Sistema</span>
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-base font-bold text-white capitalize">
                  {user?.role_name}
                </div>
                <p className="text-[11px] text-gray-500">
                  Nivel de acceso ID: {user?.role_id}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-gray-400 mb-1.5">
                  <span className="text-xs font-medium">Identificador</span>
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xs font-mono text-white truncate" title={user?.id}>
                  {user?.id}
                </div>
                <p className="text-[11px] text-gray-500">UUID en base de datos</p>
              </div>

              <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-gray-400 mb-1.5">
                  <span className="text-xs font-medium">Fecha de Registro</span>
                  <Calendar className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xs text-white truncate" title={formattedDate}>
                  {formattedDate}
                </div>
                <p className="text-[11px] text-gray-500">Creación de cuenta</p>
              </div>
            </div>

            {/* Security & Sessions Section */}
            <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Gestión de Sesión y Credenciales
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-200">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span>Autenticación de Dos Factores (2FA)</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {user?.totp_enabled
                      ? 'Tu cuenta requiere un código de 6 dígitos cada vez que inicias sesión. Puedes consultar o regenerar tus códigos de emergencia.'
                      : 'Protege tu cuenta agregando una capa extra de seguridad mediante Google Authenticator o Authy.'}
                  </p>
                  <button
                    type="button"
                    onClick={onOpenSecurity}
                    className="mt-1 text-xs font-medium text-blue-400 hover:text-blue-300 underline cursor-pointer"
                  >
                    {user?.totp_enabled
                      ? 'Administrar códigos de recuperación →'
                      : 'Configurar 2FA ahora →'}
                  </button>
                </div>

                <div className="p-4 rounded-lg bg-gray-800/40 border border-gray-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-200">
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Cerrar Sesiones Activas</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Revoca todos los tokens de refresco emitidos para tu cuenta en otros
                    dispositivos y navegadores.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          '¿Deseas revocar todas las sesiones activas en todos los dispositivos?'
                        )
                      ) {
                        logoutAll();
                      }
                    }}
                    className="mt-1 px-3 py-1.5 rounded-lg bg-red-900/20 hover:bg-red-900/30 text-red-300 border border-red-800/50 text-xs font-medium transition cursor-pointer"
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
