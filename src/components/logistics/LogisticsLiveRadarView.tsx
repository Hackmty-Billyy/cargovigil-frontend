import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Trip } from '../../types/logistics';
import { LogisticsMap } from './LogisticsMap';
import { PreTripSchedulerModal } from './PreTripSchedulerModal';
import {
  Compass,
  FastForward,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Truck,
  Ship,
  Plane,
  Layers,
} from 'lucide-react';

export const LogisticsLiveRadarView: React.FC = () => {
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [_lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancingTime, setAdvancingTime] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [filterMode, setFilterMode] = useState<string>('all'); // all | truck | ship | plane | stuck
  const [autoUpdateSeconds, setAutoUpdateSeconds] = useState<number>(60);

  // Load trips & fuel indices
  const fetchTrips = async (silent = false) => {
    if (!accessToken) return;
    try {
      if (!silent) setLoading(true);
      const tripsData = await api.listTrips(accessToken);
      setTrips(tripsData);
      setLastUpdated(new Date());

      // If no trip selected, select first active or stuck trip
      if (!selectedTripId && tripsData.length > 0) {
        const stuck = tripsData.find((t) => t.is_stuck);
        setSelectedTripId(stuck ? stuck.id : tripsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [accessToken]);

  // 1-minute auto-poll timer as requested
  useEffect(() => {
    const timer = setInterval(() => {
      fetchTrips(true);
      setAutoUpdateSeconds(60);
    }, 60000);

    const secondCountdown = setInterval(() => {
      setAutoUpdateSeconds((prev) => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(secondCountdown);
    };
  }, [accessToken]);

  // Advance time button (simulates movement and route incidents in DB)
  const handleAdvanceSimulation = async () => {
    if (!accessToken) return;
    try {
      setAdvancingTime(true);
      const result = await api.advanceTripSimulation(accessToken);
      if (result.trips && result.trips.length > 0) {
        setTrips(result.trips);
      } else {
        await fetchTrips(true);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error advancing simulation:', err);
    } finally {
      setAdvancingTime(false);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (filterMode === 'all') return true;
    if (filterMode === 'stuck') return t.is_stuck;
    return t.vehicle_type === filterMode;
  });

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  // Aggregated KPI stats
  const totalAgreedRevenue = trips.reduce((acc, t) => acc + Number(t.agreed_freight_price || 0), 0);
  const activeInTransit = trips.filter((t) => t.status === 'in_transit').length;
  const stuckCount = trips.filter((t) => t.is_stuck).length;
  const completedCount = trips.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-cyan-950 text-cyan-400 border border-cyan-800/60">
              Módulo 4 & Visualización en Tiempo Real
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Siguiente ciclo automático en: <span className="font-mono text-emerald-400 font-bold">{autoUpdateSeconds}s</span>
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Compass className="w-6 h-6 text-[#776de8]" />
            Radar de Operaciones & Telemetría Financiera
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización multimodal con WebGL/Mapbox tiles, control de fricciones en tiempo real y proyecciones de combustible.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Simulation Time Advance Button */}
          <button
            onClick={handleAdvanceSimulation}
            disabled={advancingTime}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white flex items-center gap-2 shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
            title="Avanza 1 hora simulada: mueve vehículos en mapa, desencadena atascos o libera demoras"
          >
            <FastForward className={`w-4 h-4 ${advancingTime ? 'animate-spin' : ''}`} />
            <span>{advancingTime ? 'Simulando Ruta...' : 'Avanzar Tiempo (Simular)'}</span>
          </button>

          {/* Schedule New Trip Button */}
          <button
            onClick={() => setShowSchedulerModal(true)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#776de8] to-[#8f85f3] hover:from-[#695fe4] hover:to-[#8175f0] text-white flex items-center gap-2 shadow-lg shadow-[#776de8]/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Agendar Viaje (Pre-Análisis)</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchTrips(false)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Refrescar datos ahora"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#776de8]' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Caja Total en Fletes</span>
          <p className="text-xl font-black text-white">
            ${totalAgreedRevenue.toLocaleString()} <span className="text-xs text-slate-400">USD</span>
          </p>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {trips.length} viajes registrados
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">En Tránsito Activo</span>
          <p className="text-xl font-black text-sky-400">{activeInTransit}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1">
            Monitoreo satelital activo
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Fricciones / Atascos</span>
          <p className={`text-xl font-black ${stuckCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>
            {stuckCount}
          </p>
          <span className="text-[10px] text-red-400 font-medium mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Requieren mitigación
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">Viajes Completados</span>
          <p className="text-xl font-black text-emerald-400">{completedCount}</p>
          <span className="text-[10px] text-slate-400 font-medium mt-1">
            Entrega & POD confirmados
          </span>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Center Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Map Filtering pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Todos los Modos', icon: Layers },
              { id: 'truck', label: '🚛 Camiones', icon: Truck },
              { id: 'ship', label: '🚢 Buques', icon: Ship },
              { id: 'plane', label: '✈️ Vuelos', icon: Plane },
              { id: 'stuck', label: '⚠️ Con Fricción', icon: AlertTriangle },
            ].map((f) => {
              const Icon = f.icon;
              const isActive = filterMode === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-[#776de8] text-white shadow-md shadow-[#776de8]/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Map Component */}
          <LogisticsMap
            trips={filteredTrips}
            selectedTripId={selectedTripId}
            onSelectTrip={(t) => setSelectedTripId(t.id)}
          />
        </div>

        {/* Right Telemetry Details Card (1 col) */}
        <div className="space-y-4">
          {selectedTrip ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400 block">
                    {selectedTrip.vehicle_type?.toUpperCase()} ASIGNADO
                  </span>
                  <h3 className="text-base font-bold text-white">
                    {selectedTrip.vehicle_identifier || selectedTrip.tracking_code}
                  </h3>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                    selectedTrip.is_stuck
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                      : selectedTrip.status === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  }`}
                >
                  {selectedTrip.is_stuck ? 'Atascado' : selectedTrip.status}
                </span>
              </div>

              {/* Friction Alert Banner if stuck */}
              {selectedTrip.is_stuck && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-red-300">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span>Fricción Operativa Detectada en Ruta</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {selectedTrip.stuck_reason || 'Retraso de aduana o bloqueo vehicular activo.'}
                  </p>
                  <p className="text-[10px] text-red-400 font-mono pt-1">
                    Impacto en costo de demora: +$180.00 USD / turno
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400">Progreso del Recorrido:</span>
                  <span className="font-bold text-white">
                    {selectedTrip.progress_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ${
                      selectedTrip.is_stuck
                        ? 'bg-red-500'
                        : selectedTrip.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-[#776de8] to-cyan-400'
                    }`}
                    style={{ width: `${selectedTrip.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Route & Client Details */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cliente:</span>
                  <span className="font-semibold text-white">{selectedTrip.client_name || 'Ternium México'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Ruta:</span>
                  <span className="font-semibold text-slate-200 text-right">
                    {selectedTrip.route_origin} ➔ {selectedTrip.route_destination}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Distancia Total:</span>
                  <span className="font-mono text-slate-200">
                    {selectedTrip.route_distance_km || 220} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Carga:</span>
                  <span className="font-medium text-slate-300">
                    {selectedTrip.cargo_type} ({selectedTrip.cargo_weight_tons} tons)
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5 text-xs">
                <span className="font-bold text-slate-300 block border-b border-slate-800 pb-1">
                  Desglose Financiero & Flujo
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Flete Pactado (Ingreso):</span>
                  <span className="font-bold text-emerald-400">
                    ${selectedTrip.agreed_freight_price.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Costo Combustible Asignado:</span>
                  <span className="font-semibold text-amber-400">
                    ${selectedTrip.estimated_fuel_cost.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Presupuesto de Contingencia:</span>
                  <span className="font-mono text-slate-300">
                    ${selectedTrip.contingency_budget.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <span className="text-slate-300 font-semibold">Exposición por Riesgo:</span>
                  <span className="font-bold text-red-400">
                    ${selectedTrip.estimated_loss_risk.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleAdvanceSimulation}
                disabled={advancingTime}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FastForward className="w-3.5 h-3.5 text-amber-400" />
                <span>Simular Siguiente Tramo GPS</span>
              </button>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-3">
              <Compass className="w-10 h-10 text-slate-600 mx-auto" />
              <p>Selecciona un viaje en la lista o en el mapa para inspeccionar sus costos y posición satelital.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trips List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Viajes Activos de la Empresa</h2>
              <p className="text-xs text-slate-400">
                Aislamiento Multi-Tenant garantizado: solo ves los trayectos de tu organización.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-3 py-1 rounded-lg border border-slate-700">
            {trips.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Código / Modo</th>
                <th className="px-5 py-3.5">Ruta</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Progreso</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5">Flete Cobrado</th>
                <th className="px-5 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTrips.map((trip) => {
                const isSelected = trip.id === selectedTripId;
                return (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTripId(trip.id)}
                    className={`transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#776de8]/15 border-l-2 border-[#776de8]'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-5 py-3.5 font-medium text-white flex items-center gap-2">
                      <span className="text-base">
                        {trip.vehicle_type === 'truck' ? '🚛' : trip.vehicle_type === 'ship' ? '🚢' : '✈️'}
                      </span>
                      <div>
                        <p className="font-bold">{trip.tracking_code}</p>
                        <p className="text-[10px] text-slate-400">{trip.vehicle_identifier}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">
                      {trip.route_origin} ➔ {trip.route_destination}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{trip.client_name || 'N/A'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              trip.is_stuck
                                ? 'bg-red-500'
                                : trip.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-[#776de8]'
                            }`}
                            style={{ width: `${trip.progress_percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold">
                          {trip.progress_percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          trip.is_stuck
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : trip.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        }`}
                      >
                        {trip.is_stuck ? 'Atascado' : trip.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-400">
                      ${trip.agreed_freight_price.toLocaleString()} {trip.currency}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTripId(trip.id);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-[#776de8] text-slate-300 hover:text-white rounded-lg text-xs transition cursor-pointer"
                      >
                        Ver en Mapa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pre-Trip Modal */}
      {showSchedulerModal && (
        <PreTripSchedulerModal
          onClose={() => setShowSchedulerModal(false)}
          onTripCreated={(newTrip) => {
            setTrips((prev) => [newTrip, ...prev]);
            setSelectedTripId(newTrip.id);
          }}
        />
      )}
    </div>
  );
};
