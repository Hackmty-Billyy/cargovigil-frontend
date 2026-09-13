import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { MarginImpact, SimulateMarginImpactResponse } from '../../types/fuel';
import type { FuelType } from '../../types/fuel';
import type { Route } from '../../types/company';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Info,
  Sliders,
  X,
} from 'lucide-react';

interface MarginImpactPanelProps {
  routes: Route[];
  marginImpacts: MarginImpact[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const MarginImpactPanel: React.FC<MarginImpactPanelProps> = ({
  routes,
  marginImpacts,
  isLoading,
  onRefresh: _onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [showSimulator, setShowSimulator] = useState(false);
  const [simRouteId, setSimRouteId] = useState('');
  const [simFuelType, setSimFuelType] = useState<FuelType>('diesel');
  const [simVariation, setSimVariation] = useState<number>(10);
  const [simResult, setSimResult] = useState<SimulateMarginImpactResponse | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [noDataRouteId, setNoDataRouteId] = useState<string | null>(null);

  const getRouteName = (routeId: string) => {
    const r = routes.find((x) => x.id === routeId);
    return r ? `${r.origin} → ${r.destination}` : routeId.slice(0, 8) + '...';
  };

  const fmt = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(v);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !simRouteId) return;
    try {
      setIsSimulating(true);
      setSimError(null);
      setSimResult(null);
      setNoDataRouteId(null);

      const result = await api.simulateMarginImpact(accessToken, simRouteId, {
        fuel_type: simFuelType,
        price_variation_percentage: Number(simVariation),
      });
      setSimResult(result);
    } catch (err: any) {
      // 422 = ErrInsufficientData
      if (err.message?.includes('422') || err.message?.toLowerCase().includes('insufficient') || err.message?.toLowerCase().includes('insufficient data')) {
        setNoDataRouteId(simRouteId);
        setSimError(null);
      } else {
        setSimError(err.message || 'Error al simular impacto de margen');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            Impacto en Margen por Variación de Combustible
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cuánto afecta una variación del precio del combustible al margen de rentabilidad de cada ruta.
          </p>
        </div>
        <button
          onClick={() => {
            setSimRouteId(routes.length > 0 ? routes[0].id : '');
            setSimResult(null);
            setSimError(null);
            setNoDataRouteId(null);
            setShowSimulator(true);
          }}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
        >
          <Sliders className="w-4 h-4" />
          Simulador de Impacto
        </button>
      </div>

      {/* Info note */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
        <Info className="w-4 h-4 text-[#bbb3ff] shrink-0 mt-0.5" />
        <p>
          Los datos de impacto en margen provienen de <code className="text-[#bbb3ff] bg-slate-800 px-1 rounded">GET /fuel/margin-impacts</code> y son calculados de forma independiente. Para ver el impacto proyectado en el flujo de caja, cruza estos valores con los de Tesorería.
        </p>
      </div>

      {/* Impacts Grid */}
      {marginImpacts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marginImpacts.map((impact) => {
            const isNegative = impact.margin_impact_percentage < 0;
            return (
              <div
                key={impact.id}
                className={`rounded-2xl border p-5 shadow-lg transition ${
                  isNegative
                    ? 'border-red-500/30 bg-gradient-to-br from-red-950/20 via-slate-900/80 to-slate-950'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-semibold text-white leading-tight">
                      {impact.route_origin && impact.route_destination
                        ? `${impact.route_origin} → ${impact.route_destination}`
                        : getRouteName(impact.route_id)}
                    </p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                      impact.fuel_type === 'diesel' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      impact.fuel_type === 'bunker_c' ? 'bg-slate-700 text-slate-300 border-slate-600' :
                      impact.fuel_type === 'marine_gasoil' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                      'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {impact.fuel_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold font-mono ${isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                      {fmt(impact.margin_impact_percentage)}
                    </span>
                    <p className="text-[10px] text-slate-400">impacto en margen</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Costo Base</span>
                    <span className="font-mono text-slate-300">{fmtCurrency(impact.baseline_fuel_cost)}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] text-slate-400 block">Costo Actual</span>
                    <span className={`font-mono font-bold ${isNegative ? 'text-red-400' : 'text-slate-300'}`}>
                      {fmtCurrency(impact.current_fuel_cost)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
                  {isNegative ? (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="text-[10px] text-slate-400">
                    Calculado: {new Date(impact.calculated_at).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : !isLoading ? (
        <div className="py-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
          <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-400">Sin datos de impacto de margen calculados</p>
          <p className="text-xs text-slate-500 mt-1">
            El sistema calcula esto automáticamente conforme se registran cargas de combustible en las rutas.
          </p>
        </div>
      ) : null}

      {/* Simulator Modal */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button onClick={() => setShowSimulator(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Simulador de Impacto en Margen</h3>
                <p className="text-xs text-slate-400">¿Qué pasa si el combustible sube/baja X%?</p>
              </div>
            </div>

            <form onSubmit={handleSimulate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Ruta *</label>
                {routes.length === 0 ? (
                  <p className="text-xs text-amber-400">No hay rutas configuradas.</p>
                ) : (
                  <select value={simRouteId} onChange={(e) => { setSimRouteId(e.target.value); setSimResult(null); setNoDataRouteId(null); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.origin} → {r.destination} ({r.distance_km ?? '?'} km)</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Combustible</label>
                  <select value={simFuelType} onChange={(e) => { setSimFuelType(e.target.value as FuelType); setSimResult(null); setNoDataRouteId(null); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="diesel">⛽ Diésel</option>
                    <option value="bunker_c">🛢️ Bunker C</option>
                    <option value="marine_gasoil">⚓ Marine Gas Oil</option>
                    <option value="jet_a1">✈️ Jet A-1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Variación del Precio (%)</label>
                  <input type="number" step="0.5" value={simVariation}
                    onChange={(e) => { setSimVariation(parseFloat(e.target.value) || 0); setSimResult(null); setNoDataRouteId(null); }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    placeholder="Ej. 10 = +10%, -5 = -5%" />
                  <p className="text-[10px] text-slate-500 mt-0.5">Positivo = alza, negativo = baja</p>
                </div>
              </div>

              {/* Error */}
              {simError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{simError}</div>
              )}

              {/* No data warning */}
              {noDataRouteId && (
                <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-start gap-2.5 text-xs text-slate-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-300">Sin datos suficientes para esta ruta</p>
                    <p className="text-slate-400 mt-0.5">
                      El simulador requiere historial real de cargas de combustible del tipo <strong>{simFuelType}</strong> para esta ruta. Registra al menos una carga en la bitácora y vuelve a intentarlo.
                    </p>
                  </div>
                </div>
              )}

              {/* Result */}
              {simResult && (
                <div className={`p-4 rounded-xl border ${simResult.estimated_margin_impact_percentage < 0 ? 'bg-red-950/30 border-red-500/40' : 'bg-emerald-950/30 border-emerald-500/30'}`}>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Resultado de Simulación</p>
                  <div className={`text-3xl font-bold font-mono ${simResult.estimated_margin_impact_percentage < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {fmt(simResult.estimated_margin_impact_percentage)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">impacto estimado en margen de la ruta</p>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500">Costo Baseline</span>
                      <div className="font-mono text-slate-300">{fmtCurrency(simResult.baseline_fuel_cost)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Costo Ajustado (+{simResult.price_variation_percentage}%)</span>
                      <div className={`font-mono font-bold ${simResult.estimated_margin_impact_percentage < 0 ? 'text-red-400' : 'text-slate-300'}`}>
                        {fmtCurrency(simResult.adjusted_fuel_cost)}
                      </div>
                    </div>
                  </div>
                  {simResult.message && (
                    <p className="text-[11px] text-slate-400 mt-2 italic">{simResult.message}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowSimulator(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer">Cerrar</button>
                <button type="submit" disabled={isSimulating || routes.length === 0} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50 flex items-center gap-2">
                  {isSimulating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Simulando...</> : <><ChevronRight className="w-3.5 h-3.5" /> Simular Impacto</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
