import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { CashAlert } from '../../types/treasury';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  RefreshCw,
  Check,
  RotateCcw,
} from 'lucide-react';

interface LiquidityAlertsBannerProps {
  alerts: CashAlert[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const LiquidityAlertsBanner: React.FC<LiquidityAlertsBannerProps> = ({
  alerts,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showResolved, setShowResolved] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(val);

  const handleToggleResolve = async (item: CashAlert) => {
    if (!accessToken) return;
    try {
      setUpdatingId(item.id);
      await api.setAlertResolved(accessToken, item.id, !item.is_resolved);
      onRefresh();
    } catch (err: any) {
      window.alert(err.message || 'Error al actualizar alerta');
    } finally {
      setUpdatingId(null);
    }
  };

  const activeAlerts = alerts.filter((a) => !a.is_resolved);
  const resolvedAlerts = alerts.filter((a) => a.is_resolved);
  const displayAlerts = showResolved ? alerts : activeAlerts;

  if (activeAlerts.length === 0 && !showResolved) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/20 border border-emerald-500/30 p-5 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                Salud Financiera Óptima
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Sin Déficits
                </span>
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                No existen alertas tempranas de iliquidez en la ventana proyectada de 30-60 días.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {resolvedAlerts.length > 0 && (
              <button
                onClick={() => setShowResolved(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Ver resueltas ({resolvedAlerts.length})
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
              title="Actualizar alertas"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            Centro de Alertas de Liquidez y Déficit
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-500/20 text-red-300 border border-red-500/30">
              {activeAlerts.length} Activas
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowResolved(!showResolved)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
              showResolved
                ? 'bg-[#776de8]/20 text-[#bbb3ff] border-[#776de8]/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-white border-slate-700'
            }`}
          >
            {showResolved ? 'Ocultar Resueltas' : `Ver Historial (${resolvedAlerts.length})`}
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refrescar alertas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayAlerts.map((alert) => {
          const isCritical = alert.severity === 'critical';
          const isResolved = alert.is_resolved;

          let cardBorder = isResolved
            ? 'border-slate-800 bg-slate-900/40 opacity-75'
            : isCritical
            ? 'border-red-500/40 bg-gradient-to-br from-red-950/40 via-slate-900/80 to-slate-950'
            : 'border-amber-500/40 bg-gradient-to-br from-amber-950/30 via-slate-900/80 to-slate-950';

          return (
            <div
              key={alert.id}
              className={`relative rounded-xl border p-4 shadow-lg backdrop-blur-md transition flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {isResolved ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : isCritical ? (
                      <AlertOctagon className="w-5 h-5 text-red-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isResolved
                            ? 'bg-slate-800 text-slate-400 border-slate-700'
                            : isCritical
                            ? 'bg-red-500/20 text-red-300 border-red-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {isResolved ? 'Resuelta' : isCritical ? 'Crítico (Déficit)' : 'Advertencia'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 ml-2">
                        Fecha: {alert.projected_date}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Déficit Proyectado</span>
                    <span
                      className={`text-sm font-bold font-mono ${
                        isResolved ? 'text-slate-400' : isCritical ? 'text-red-400' : 'text-amber-400'
                      }`}
                    >
                      {formatCurrency(alert.projected_deficit)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mt-1">
                  {alert.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500">
                  Emitida: {new Date(alert.created_at).toLocaleDateString()}
                </span>

                <button
                  onClick={() => handleToggleResolve(alert)}
                  disabled={updatingId === alert.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                    isResolved
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {updatingId === alert.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : isResolved ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reabrir
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Resolver
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
