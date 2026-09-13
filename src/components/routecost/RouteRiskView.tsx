import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { RouteRiskProfile } from '../../types/routecost';
import { Gauge, RefreshCw, Route as RouteIcon, AlertTriangle, Clock, ShieldCheck } from 'lucide-react';
import { formatDateTime, formatHours, riskTier } from './shared';

interface RouteRiskViewProps {
  profiles: RouteRiskProfile[];
  canWrite: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * El score es un multiplicador de 1.00 (ruta limpia) a 3.00 (la peor), no un
 * porcentaje: se dibuja como tres tramos y no como una barra de 0-100. El
 * backend lo recalcula solo cada 24 h y al cerrar cada viaje; el botón sirve
 * para forzarlo después de capturar incidencias a mano.
 */
export const RouteRiskView: React.FC<RouteRiskViewProps> = ({ profiles, canWrite, isLoading, onRefresh }) => {
  const { accessToken } = useAuth();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [busyRouteId, setBusyRouteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recalculate = async (routeId?: string) => {
    if (!accessToken) return;
    try {
      if (routeId) setBusyRouteId(routeId);
      else setIsRecalculating(true);
      setErrorMsg(null);
      await api.recalculateRouteRisk(accessToken, routeId);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo recalcular el riesgo');
    } finally {
      setBusyRouteId(null);
      setIsRecalculating(false);
    }
  };

  const highRisk = profiles.filter((p) => p.historical_risk_score >= 2.2).length;
  const totalIncidents = profiles.reduce((sum, p) => sum + p.incident_count, 0);
  const worstDelay = profiles.reduce((max, p) => Math.max(max, p.avg_delay_hours), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-5 h-5 text-[#776de8]" />
            Riesgo histórico por ruta
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Calculado con los viajes y las fricciones de los últimos 180 días. De aquí sale el porcentaje de
            colchón que se aparta en cada viaje nuevo.
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => recalculate()}
            disabled={isRecalculating}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            <span>Recalcular todas</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Rutas de alto riesgo
          </span>
          <div className="text-lg font-bold font-mono text-red-300 mt-1">{highRisk}</div>
          <span className="text-[10px] text-slate-500">de {profiles.length} rutas perfiladas</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" /> Peor retraso promedio
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">{formatHours(worstDelay)}</div>
          <span className="text-[10px] text-slate-500">Sobre la llegada estimada</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#bbb3ff]" /> Incidentes en la ventana
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">{totalIncidents}</div>
          <span className="text-[10px] text-slate-500">Últimos 180 días</span>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Nivel de riesgo</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3 text-right">Retraso promedio</th>
              <th className="px-4 py-3 text-right">Incidentes</th>
              <th className="px-4 py-3 text-right">Colchón sugerido</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {profiles.map((p) => {
              const tier = riskTier(p.historical_risk_score);
              const busy = busyRouteId === p.route_id;

              return (
                <tr key={p.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <RouteIcon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-[220px]">
                          {p.route_origin || 'Ruta'} → {p.route_destination || '—'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {p.route_distance_km ? `${p.route_distance_km} km` : 'Distancia no capturada'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${tier.chip}`}
                    >
                      {tier.label}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      {[1, 2, 3].map((step) => (
                        <span
                          key={step}
                          className={`h-1.5 w-6 rounded-full ${step <= tier.steps ? tier.bar : 'bg-slate-800'}`}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">
                    {p.historical_risk_score.toFixed(2)}
                    <span className="text-slate-600 text-[10px]"> / 3.00</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-300">
                    {formatHours(p.avg_delay_hours)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">{p.incident_count}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#bbb3ff]">
                    {p.suggested_contingency_percentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[10px] text-slate-500 font-mono hidden lg:inline">
                        {formatDateTime(p.last_calculated_at)}
                      </span>
                      {canWrite && (
                        <button
                          disabled={busy}
                          onClick={() => recalculate(p.route_id)}
                          title="Recalcular esta ruta"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-40"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {profiles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {isLoading ? 'Cargando perfiles...' : 'Aún no hay rutas perfiladas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
