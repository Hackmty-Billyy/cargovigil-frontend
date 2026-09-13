import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Trip } from '../../types/logistics';
import type { ContingencyFund, CostSettings, Friction, RouteRiskProfile } from '../../types/routecost';
import { OpenFrictionsBanner } from './OpenFrictionsBanner';
import { TripsManager } from './TripsManager';
import { FrictionsManager } from './FrictionsManager';
import { ContingencyManager } from './ContingencyManager';
import { RouteRiskView } from './RouteRiskView';
import {
  AlertTriangle,
  Gauge,
  PiggyBank,
  RefreshCw,
  Sparkles,
  Timer,
  TrendingDown,
  Truck,
} from 'lucide-react';
import { formatHours, formatMoney, hoursSince } from './shared';

/**
 * Módulo 2 — traduce ineficiencias físicas (tiempo muerto, riesgo de ruta) a
 * impacto financiero. Igual que Tesorería, este contenedor es el único que
 * habla con la API: sus cuatro vistas reciben datos ya resueltos.
 */
export const RouteCostDashboard: React.FC = () => {
  const { accessToken, user } = useAuth();

  const canWrite = user?.role_name === 'admin' || user?.role_name === 'operations';
  const canManageMoney = user?.role_name === 'admin' || user?.role_name === 'finance';

  const [activeSubTab, setActiveSubTab] = useState<'trips' | 'frictions' | 'contingency' | 'risk'>('trips');

  const [trips, setTrips] = useState<Trip[]>([]);
  const [frictions, setFrictions] = useState<Friction[]>([]);
  const [funds, setFunds] = useState<ContingencyFund[]>([]);
  const [profiles, setProfiles] = useState<RouteRiskProfile[]>([]);
  const [settings, setSettings] = useState<CostSettings | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);

      const [trps, frs, fnds, prfs, cfg] = await Promise.all([
        api.listTrips(accessToken).catch(() => []),
        api.listFrictions(accessToken).catch(() => []),
        api.listContingencyFunds(accessToken).catch(() => []),
        api.listRouteRiskProfiles(accessToken).catch(() => []),
        api.getCostSettings(accessToken).catch(() => null),
      ]);

      setTrips(trps);
      setFrictions(frs);
      setFunds(fnds);
      setProfiles(prfs);
      setSettings(cfg);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar la inteligencia de costes operativos');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * Cuánto vale una hora parada en cada viaje. Se deriva igual que en el
   * backend (flete entre horas planeadas) para poder valuar en vivo las
   * fricciones abiertas, que todavía no tienen opportunity_cost guardado.
   */
  const hourlyRateByTrip = trips.reduce<Record<string, number>>((acc, t) => {
    const plannedHours = Math.max(
      1,
      (new Date(t.estimated_arrival_date).getTime() - new Date(t.departure_date).getTime()) / 3_600_000
    );
    acc[t.id] = t.agreed_freight_price / plannedHours;
    return acc;
  }, {});

  // Las fricciones se valúan en la moneda del viaje; los colchones en la de la
  // reserva (MXN). Nunca se suman entre sí.
  const tripCurrency = trips[0]?.currency || 'USD';
  const reserveCurrency = funds[0]?.reserve_currency || 'MXN';

  const openFrictions = frictions.filter((f) => !f.ended_at);

  const totalIdleHours = frictions.reduce(
    (sum, f) => sum + (f.ended_at ? f.duration_hours : hoursSince(f.started_at)),
    0
  );
  const totalDirectCost = frictions.reduce((sum, f) => sum + f.cost_impact, 0);
  const totalOpportunityCost = frictions.reduce(
    (sum, f) =>
      sum + (f.ended_at ? f.opportunity_cost : hoursSince(f.started_at) * (hourlyRateByTrip[f.trip_id] ?? 0)),
    0
  );
  const committedLiquidity = funds
    .filter((f) => f.status !== 'released')
    .reduce((sum, f) => sum + (f.allocated_amount - f.consumed_amount - f.released_amount), 0);

  const avgRiskScore = profiles.length
    ? profiles.reduce((sum, p) => sum + p.historical_risk_score, 0) / profiles.length
    : 1;

  return (
    <div className="space-y-6">
      {/* Banner del módulo */}
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-[#776de8]/20 text-[#bbb3ff] border border-[#776de8]/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Módulo 2 — Costes Operativos
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Ventana de riesgo 180 días • Score promedio {avgRiskScore.toFixed(2)}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Inteligencia de Fricciones en Ruta
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Traduce el tiempo muerto y el riesgo histórico de cada ruta a dinero: lo que se paga de más, lo
              que se deja de ganar y cuánta liquidez hay que apartar por viaje.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-center">
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Datos</span>
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* KPIs globales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Tiempo Muerto Acumulado</span>
            <Timer className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">{formatHours(totalIdleHours)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {openFrictions.length > 0
              ? `${openFrictions.length} fricción(es) corriendo ahora`
              : `${frictions.length} eventos registrados`}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Costo Directo de Fricciones</span>
            <AlertTriangle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-cyan-300">
            {formatMoney(totalDirectCost, tripCurrency, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Demoras y multas pagadas a terceros</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Pérdida de Oportunidad</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-300">
            {formatMoney(totalOpportunityCost, tripCurrency, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Ingreso que la flota no produjo parada</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Liquidez Comprometida</span>
            <PiggyBank className="w-4 h-4 text-[#bbb3ff]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#bbb3ff]">
            {formatMoney(committedLiquidity, reserveCurrency, 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Apartada en {funds.filter((f) => f.status !== 'released').length} colchones vivos
          </p>
        </div>
      </div>

      {/* Fricciones abiertas */}
      <OpenFrictionsBanner
        frictions={frictions}
        hourlyRateByTrip={hourlyRateByTrip}
        currency={tripCurrency}
        isLoading={isLoading}
        onRefresh={fetchAllData}
        onSeeAll={() => setActiveSubTab('frictions')}
      />

      {/* Sub-navegación */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('trips')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'trips'
              ? 'bg-[#776de8] text-white '
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Viajes ({trips.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('frictions')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'frictions'
              ? 'bg-[#776de8] text-white '
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>Tiempos Muertos ({frictions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contingency')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'contingency'
              ? 'bg-[#776de8] text-white '
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Colchones ({funds.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('risk')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeSubTab === 'risk'
              ? 'bg-[#776de8] text-white '
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Gauge className="w-4 h-4" />
          <span>Riesgo por Ruta ({profiles.length})</span>
        </button>
      </div>

      {/* Contenido */}
      <div className="transition-all duration-200">
        {activeSubTab === 'trips' && (
          <TripsManager
            trips={trips}
            frictions={frictions}
            funds={funds}
            canWrite={canWrite}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'frictions' && (
          <FrictionsManager
            frictions={frictions}
            currency={tripCurrency}
            hourlyRateByTrip={hourlyRateByTrip}
            canWrite={canWrite}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'contingency' && (
          <ContingencyManager
            funds={funds}
            settings={settings}
            canManageMoney={canManageMoney}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}

        {activeSubTab === 'risk' && (
          <RouteRiskView
            profiles={profiles}
            canWrite={canWrite}
            isLoading={isLoading}
            onRefresh={fetchAllData}
          />
        )}
      </div>
    </div>
  );
};
