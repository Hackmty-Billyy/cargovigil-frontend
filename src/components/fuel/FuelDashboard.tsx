import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { FuelIndex, FuelWeeklyTrend, TripFuelLog, SurchargeRule, MarginImpact } from '../../types/fuel';
import type { FuelType } from '../../types/fuel';
import { FUEL_TYPE_LABELS, FUEL_TYPE_COLORS } from '../../types/fuel';
import type { Trip } from '../../types/logistics';
import type { Route } from '../../types/company';
import { FuelPriceTrendChart } from './FuelPriceTrendChart';
import { SurchargeRulesManager } from './SurchargeRulesManager';
import { TripFuelLogTable } from './TripFuelLogTable';
import { MarginImpactPanel } from './MarginImpactPanel';
import {
  Fuel,
  TrendingUp,
  Percent,
  BookOpen,
  Activity,
  RefreshCw,
  Sparkles,
  Plus,
  X,
  BarChart2,
} from 'lucide-react';

interface FuelDashboardProps {
  isPlatformAdmin: boolean;
  isAdmin: boolean;
  isFinance: boolean;
  isOperations: boolean;
}

export const FuelDashboard: React.FC<FuelDashboardProps> = ({
  isPlatformAdmin,
  isAdmin,
  isFinance,
  isOperations,
}) => {
  const { accessToken } = useAuth();
  const canManageSurcharges = isAdmin || isFinance;
  const canWriteLogs = isAdmin || isOperations || isPlatformAdmin;

  // Sub-tab
  const [activeTab, setActiveTab] = useState<'indexes' | 'surcharges' | 'logs' | 'margin'>('indexes');

  // Filters for indexes tab
  const [selectedFuelType, setSelectedFuelType] = useState<FuelType>('diesel');
  const [region, setRegion] = useState('');

  // Data states
  const [indexes, setIndexes] = useState<FuelIndex[]>([]);
  const [trend, setTrend] = useState<FuelWeeklyTrend[]>([]);
  const [tripLogs, setTripLogs] = useState<TripFuelLog[]>([]);
  const [surchargeRules, setSurchargeRules] = useState<SurchargeRule[]>([]);
  const [marginImpacts, setMarginImpacts] = useState<MarginImpact[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);

  // Loading & error
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Platform admin — create new fuel index
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [newFuelType, setNewFuelType] = useState<FuelType>('diesel');
  const [newRegion, setNewRegion] = useState('México - Noreste');
  const [newPrice, setNewPrice] = useState<number>(24.85);
  const [newUnit, setNewUnit] = useState('liter');
  const [newSource, setNewSource] = useState('CRE');
  const [isCreatingIndex, setIsCreatingIndex] = useState(false);
  const [indexError, setIndexError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const params: { fuel_type?: FuelType; region?: string; limit?: number } = {
        fuel_type: selectedFuelType,
        limit: 50,
      };
      if (region.trim()) params.region = region.trim();

      const [idxs, trd, logs, trips_, routes_] = await Promise.all([
        api.listFuelIndexes(accessToken, params).catch(() => [] as FuelIndex[]),
        api.getFuelWeeklyTrend(accessToken, { ...params, limit: 12 }).catch(() => [] as FuelWeeklyTrend[]),
        api.listTripFuelLogs(accessToken).catch(() => [] as TripFuelLog[]),
        api.listTrips(accessToken).catch(() => [] as Trip[]),
        api.listRoutes(accessToken).catch(() => [] as Route[]),
      ]);

      setIndexes(idxs);
      setTrend(trd);
      setTripLogs(logs);
      setTrips(trips_);
      setRoutes(routes_);

      // Conditional fetches
      if (canManageSurcharges) {
        const [rules, impacts] = await Promise.all([
          api.listSurchargeRules(accessToken).catch(() => [] as SurchargeRule[]),
          api.listMarginImpacts(accessToken).catch(() => [] as MarginImpact[]),
        ]);
        setSurchargeRules(rules);
        setMarginImpacts(impacts);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar datos de combustible');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedFuelType, region, canManageSurcharges]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFuelIndex = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setIsCreatingIndex(true);
      setIndexError(null);
      await api.createPlatformFuelIndex(accessToken, {
        fuel_type: newFuelType,
        region: newRegion,
        price_per_unit: Number(newPrice),
        unit_of_measure: newUnit,
        source: newSource,
      });
      setShowIndexModal(false);
      fetchData();
    } catch (err: any) {
      setIndexError(err.message || 'Error al registrar precio de índice');
    } finally {
      setIsCreatingIndex(false);
    }
  };

  const latestPrice = indexes.length > 0 ? indexes[0] : null;
  const highestPriceIndex = indexes.reduce<FuelIndex | null>((max, idx) =>
    max === null || idx.price_per_unit > max.price_per_unit ? idx : max, null);
  const lowestPriceIndex = indexes.reduce<FuelIndex | null>((min, idx) =>
    min === null || idx.price_per_unit < min.price_per_unit ? idx : min, null);
  const avgPrice = indexes.length > 0
    ? indexes.reduce((s, i) => s + i.price_per_unit, 0) / indexes.length
    : 0;

  const activeSurchargeRules = surchargeRules.filter((r) => r.is_active && r.suggested_surcharge_percentage > 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Módulo 3 — Gestión de Combustible
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Feed Global + Bitácora + Recargos BAF + Simulador
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Monitor & Control de Combustible
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Seguimiento de precios globales por tipo y región, bitácora operativa por viaje, reglas de recargo automáticas (BAF) y simulador de impacto en margen de ruta.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
            {isPlatformAdmin && (
              <button
                onClick={() => setShowIndexModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Precio de Índice
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{errorMsg}</div>
      )}

      {/* Alert if surcharges are active */}
      {activeSurchargeRules.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-300">
              {activeSurchargeRules.length} Regla{activeSurchargeRules.length > 1 ? 's' : ''} BAF Activa{activeSurchargeRules.length > 1 ? 's' : ''} — Recargo Sugerido
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeSurchargeRules.map((r) => `${r.fuel_type} (${r.region}): +${r.suggested_surcharge_percentage.toFixed(2)}%`).join(' | ')}
            </p>
          </div>
        </div>
      )}

      {/* Sub-Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('indexes')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'indexes'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          Índices & Tendencia
        </button>

        {canManageSurcharges && (
          <button
            onClick={() => setActiveTab('surcharges')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'surcharges'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Percent className="w-4 h-4" />
            Reglas BAF / Recargos
            {activeSurchargeRules.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                {activeSurchargeRules.length}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
            activeTab === 'logs'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Bitácora de Viajes ({tripLogs.length})
        </button>

        {canManageSurcharges && (
          <button
            onClick={() => setActiveTab('margin')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeTab === 'margin'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            Impacto en Margen & Simulador
          </button>
        )}
      </div>

      {/* ─── TAB: Indexes & Trend ─────────────────────────────── */}
      {activeTab === 'indexes' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 shrink-0">Tipo de Combustible:</span>
              <div className="flex gap-1">
                {(['diesel', 'bunker_c', 'marine_gasoil', 'jet_a1'] as FuelType[]).map((ft) => (
                  <button
                    key={ft}
                    onClick={() => setSelectedFuelType(ft)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer border ${
                      selectedFuelType === ft
                        ? 'bg-amber-500/80 text-white border-amber-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {ft === 'diesel' ? '⛽' : ft === 'bunker_c' ? '🛢️' : ft === 'marine_gasoil' ? '⚓' : '✈️'} {ft.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <span className="text-xs text-slate-400 shrink-0">Región:</span>
              <input
                type="text"
                placeholder="Ej. México - Noreste (vacío = todas)"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* KPI Cards - Latest Prices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Último Precio Registrado</span>
                <Fuel className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {latestPrice ? `$${latestPrice.price_per_unit.toFixed(2)}/${latestPrice.unit_of_measure}` : 'N/D'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {latestPrice ? `${latestPrice.region} — ${latestPrice.source}` : 'Sin datos disponibles'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Precio Promedio (consulta)</span>
                <BarChart2 className="w-4 h-4 text-[#bbb3ff]" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {indexes.length > 0 ? `$${avgPrice.toFixed(2)}` : 'N/D'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{indexes.length} registros en el resultado</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Precio Más Alto</span>
                <TrendingUp className="w-4 h-4 text-red-400" />
              </div>
              <div className="text-xl font-bold font-mono text-red-400">
                {highestPriceIndex ? `$${highestPriceIndex.price_per_unit.toFixed(2)}` : 'N/D'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{highestPriceIndex?.region ?? ''}</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Precio Más Bajo</span>
                <TrendingUp className="w-4 h-4 text-emerald-400 rotate-180" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400">
                {lowestPriceIndex ? `$${lowestPriceIndex.price_per_unit.toFixed(2)}` : 'N/D'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{lowestPriceIndex?.region ?? ''}</p>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Tendencia Semanal de Precios — {FUEL_TYPE_LABELS[selectedFuelType]}</h3>
              <span className="text-[10px] text-slate-500 font-mono">(Aggregate TimescaleDB)</span>
            </div>
            <FuelPriceTrendChart
              data={trend}
              fuelType={selectedFuelType}
              isLoading={isLoading}
            />
          </div>

          {/* Recent Indexes Table */}
          <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Registros Recientes de Precio</h3>
              <span className="text-xs text-slate-500">{indexes.length} resultados</span>
            </div>
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Región</th>
                    <th className="px-4 py-2.5 text-right">Precio / Unidad</th>
                    <th className="px-4 py-2.5">Fuente</th>
                    <th className="px-4 py-2.5">Registrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {indexes.map((idx) => (
                    <tr key={idx.id} className="hover:bg-slate-850/40">
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${FUEL_TYPE_COLORS[idx.fuel_type as FuelType]}`}>
                          {idx.fuel_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-slate-300">{idx.region}</td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-amber-300">
                        ${idx.price_per_unit.toFixed(2)}/{idx.unit_of_measure}
                      </td>
                      <td className="px-4 py-2 text-slate-400">{idx.source}</td>
                      <td className="px-4 py-2 font-mono text-slate-500 text-[11px]">
                        {new Date(idx.recorded_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {indexes.length === 0 && !isLoading && (
                <div className="py-10 text-center text-slate-500 text-xs">
                  Sin registros de precios para este tipo y región.
                  {isPlatformAdmin && ' Registra un precio de índice con el botón de arriba.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Surcharge Rules ─────────────────────────────── */}
      {activeTab === 'surcharges' && canManageSurcharges && (
        <SurchargeRulesManager
          rules={surchargeRules}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}

      {/* ─── TAB: Trip Logs ───────────────────────────────────── */}
      {activeTab === 'logs' && (
        <TripFuelLogTable
          logs={tripLogs}
          trips={trips}
          isLoading={isLoading}
          onRefresh={fetchData}
          canWrite={canWriteLogs}
        />
      )}

      {/* ─── TAB: Margin Impact ───────────────────────────────── */}
      {activeTab === 'margin' && canManageSurcharges && (
        <MarginImpactPanel
          routes={routes}
          marginImpacts={marginImpacts}
          isLoading={isLoading}
          onRefresh={fetchData}
        />
      )}

      {/* Platform Admin — Create Fuel Index Modal */}
      {showIndexModal && isPlatformAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button onClick={() => setShowIndexModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registrar Precio de Índice Global</h3>
                <p className="text-xs text-slate-400">Solo Platform Admin — Feed compartido entre todas las empresas</p>
              </div>
            </div>

            {indexError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{indexError}</div>}

            <form onSubmit={handleCreateFuelIndex} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Combustible *</label>
                  <select value={newFuelType} onChange={(e) => setNewFuelType(e.target.value as FuelType)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="diesel">⛽ Diésel</option>
                    <option value="bunker_c">🛢️ Bunker C</option>
                    <option value="marine_gasoil">⚓ Marine Gas Oil</option>
                    <option value="jet_a1">✈️ Jet A-1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Fuente / Proveedor *</label>
                  <input type="text" required value={newSource} onChange={(e) => setNewSource(e.target.value)}
                    placeholder="CRE, PEMEX, IATA..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Región *</label>
                <input type="text" required value={newRegion} onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="México - Noreste, Gulf of Mexico..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Precio por Unidad *</label>
                  <input type="number" step="0.01" min="0.01" required value={newPrice} onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Unidad de Medida *</label>
                  <select value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="liter">Litro (L)</option>
                    <option value="gallon">Galón (gal)</option>
                    <option value="metric_ton">Tonelada Métrica (MT)</option>
                    <option value="kg">Kilogramo (kg)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowIndexModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isCreatingIndex} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50">
                  {isCreatingIndex ? 'Publicando...' : 'Publicar Precio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
