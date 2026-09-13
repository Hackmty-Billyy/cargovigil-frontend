import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Trip } from '../../types/logistics';
import { LogisticsMap } from './LogisticsMap';
import { PreTripSchedulerModal } from './PreTripSchedulerModal';
import { TripSummaryModal } from './TripSummaryModal';
import {
  Compass,
  FastForward,
  Plus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Truck,
  Ship,
  Plane,
  Layers,
  Trash2,
  Eye,
  EyeOff,
  DollarSign,
  Activity,
  AlertCircle,
  Package,
  FileSpreadsheet,
} from 'lucide-react';

export const LogisticsLiveRadarView: React.FC = () => {
  const { accessToken } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [_lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancingTime, setAdvancingTime] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [summaryTrip, setSummaryTrip] = useState<Trip | null>(null);
  const [filterMode, setFilterMode] = useState<string>('all'); // all | in_transit | truck | ship | plane | stuck
  const [hideCompleted, setHideCompleted] = useState<boolean>(false);
  const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
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

  // 1-minute auto-poll timer
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

  // Advance time simulation
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

  const handleDeleteTrip = async (tripId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar permanentemente este registro de viaje de la empresa?')) {
      return;
    }
    if (!accessToken) return;

    try {
      setDeletingTripId(tripId);
      await api.deleteTrip(accessToken, tripId);
      setTrips((prev) => prev.filter((t) => t.id !== tripId));
      if (selectedTripId === tripId) {
        setSelectedTripId(null);
      }
    } catch (err) {
      console.error('Error al quitar registro:', err);
      alert('Error al quitar el registro de viaje. Intente nuevamente.');
    } finally {
      setDeletingTripId(null);
    }
  };

  const filteredTrips = trips.filter((t) => {
    if (hideCompleted && t.status === 'completed') return false;
    if (filterMode === 'all') return true;
    if (filterMode === 'in_transit') return t.status === 'in_transit' || (t.status !== 'completed' && !t.is_stuck);
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
    <div className="space-y-5 pb-20 max-w-7xl mx-auto">
      {/* Flowbite Minimalist Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-blue-900/30 text-blue-400 border border-blue-800/40">
              Módulo Radar
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sincronización en <span className="font-mono text-gray-200 font-semibold">{autoUpdateSeconds}s</span>
            </span>
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            Radar de Operaciones &amp; Telemetría
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Monitoreo en vivo de fletes, incidencias en carretera y posición satelital multimodal.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Simulation Time Advance Button */}
          <button
            type="button"
            onClick={handleAdvanceSimulation}
            disabled={advancingTime}
            className="text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 focus:ring-2 focus:ring-gray-700 font-medium rounded-lg text-xs px-3.5 py-2 inline-flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            title="Avanza 1 hora simulada de trayecto para mover las unidades en el mapa"
          >
            <FastForward className={`w-3.5 h-3.5 text-amber-400 ${advancingTime ? 'animate-spin' : ''}`} />
            <span>{advancingTime ? 'Simulando...' : 'Avanzar Simulación'}</span>
          </button>

          {/* Schedule New Trip Button */}
          <button
            type="button"
            onClick={() => setShowSchedulerModal(true)}
            className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 font-medium rounded-lg text-xs px-4 py-2 inline-flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Viaje</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchTrips(false)}
            className="p-2 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition cursor-pointer"
            title="Refrescar datos ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Minimalist KPI Cards (no emojis) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Caja Total en Fletes</span>
            <span className="p-1.5 bg-blue-900/20 text-blue-400 rounded-lg">
              <DollarSign className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            ${totalAgreedRevenue.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-400">USD</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
            <span className="font-semibold text-gray-300">{trips.length}</span> viajes en total
          </p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">En Tránsito Activo</span>
            <span className="p-1.5 bg-cyan-900/20 text-cyan-400 rounded-lg">
              <Activity className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-cyan-400 tracking-tight">{activeInTransit}</div>
          <p className="text-[11px] text-gray-400 mt-1">Unidades en movimiento</p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Fricciones / Atascos</span>
            <span className={`p-1.5 rounded-lg ${stuckCount > 0 ? 'bg-red-900/30 text-red-400' : 'bg-gray-800 text-gray-500'}`}>
              <AlertCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className={`text-xl font-bold tracking-tight ${stuckCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>
            {stuckCount}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {stuckCount > 0 ? 'Atención operativa requerida' : 'Sin demoras críticas'}
          </p>
        </div>

        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-400">Viajes Completados</span>
            <span className="p-1.5 bg-emerald-900/20 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-xl font-bold text-emerald-400 tracking-tight">{completedCount}</div>
          <p className="text-[11px] text-gray-400 mt-1">Entrega &amp; POD cerrados</p>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Map Center Column (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          {/* Segmented Filter Group (No emojis) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="inline-flex rounded-lg shadow-2xs bg-gray-900 p-1 border border-gray-800 overflow-x-auto max-w-full">
              {[
                { id: 'all', label: 'Todos', icon: Layers },
                { id: 'in_transit', label: 'En Movimiento', icon: Truck },
                { id: 'truck', label: 'Camiones', icon: Truck },
                { id: 'ship', label: 'Buques', icon: Ship },
                { id: 'plane', label: 'Vuelos', icon: Plane },
                { id: 'stuck', label: 'Con Fricción', icon: AlertTriangle },
              ].map((f) => {
                const Icon = f.icon;
                const isActive = filterMode === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterMode(f.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{f.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Toggle to hide / show completed trips (No emojis) */}
            <button
              type="button"
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition cursor-pointer border ${
                hideCompleted
                  ? 'bg-emerald-900/30 text-emerald-300 border-emerald-800/60 shadow-xs'
                  : 'bg-gray-900 text-gray-400 hover:text-white border-gray-800'
              }`}
              title="Ocultar o mostrar viajes completados para ver solo las unidades en movimiento"
            >
              {hideCompleted ? (
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Eye className="w-3.5 h-3.5 text-gray-400" />
              )}
              <span>{hideCompleted ? 'Ocultando Completados' : 'Ocultar Completados'}</span>
            </button>
          </div>

          {/* Interactive Map Component */}
          <LogisticsMap
            trips={filteredTrips}
            selectedTripId={selectedTripId}
            onSelectTrip={(t) => setSelectedTripId(t.id)}
            onOpenSummary={(t) => setSummaryTrip(t)}
          />
        </div>

        {/* Right Telemetry Details Card (1 col) */}
        <div>
          {selectedTrip ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-xs space-y-4">
              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-gray-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-gray-500 block">
                    {selectedTrip.vehicle_type?.toUpperCase()} ASIGNADO
                  </span>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {selectedTrip.vehicle_identifier || selectedTrip.tracking_code}
                  </h3>
                  <p className="text-xs font-mono text-blue-400">{selectedTrip.tracking_code}</p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase ${
                    selectedTrip.is_stuck
                      ? 'bg-red-900/30 text-red-300 border border-red-800/50 animate-pulse'
                      : selectedTrip.status === 'completed'
                      ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/50'
                      : 'bg-blue-900/30 text-blue-300 border border-blue-800/50'
                  }`}
                >
                  {selectedTrip.is_stuck ? 'Atascado' : selectedTrip.status}
                </span>
              </div>

              {/* Completed Trip Summary Banner */}
              {(selectedTrip.status === 'completed' || selectedTrip.progress_percentage >= 100) && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Viaje Concluido</span>
                    </div>
                    <p className="text-[11px] text-emerald-400/80">
                      Liquidación de costo, gastos y pérdidas disponible.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSummaryTrip(selectedTrip)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs shrink-0 ml-2"
                  >
                    Ver Resumen
                  </button>
                </div>
              )}

              {/* Friction Alert */}
              {selectedTrip.is_stuck && (
                <div className="p-3 text-xs text-red-300 rounded-lg bg-red-950/40 border border-red-900/60 space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-red-400">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Fricción Operativa en Ruta</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-200">
                    {selectedTrip.stuck_reason || 'Retraso de aduana o bloqueo vehicular activo.'}
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-gray-400 font-medium">Progreso del Recorrido</span>
                  <span className="font-bold text-white font-mono">
                    {selectedTrip.progress_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      selectedTrip.is_stuck
                        ? 'bg-red-500'
                        : selectedTrip.status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${selectedTrip.progress_percentage}%` }}
                  />
                </div>
              </div>

              {/* Route & Cargo Specs */}
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Cliente:</span>
                  <span className="font-medium text-white">{selectedTrip.client_name || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Ruta:</span>
                  <span className="font-medium text-gray-200 text-right">
                    {selectedTrip.route_origin}  {selectedTrip.route_destination}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Distancia:</span>
                  <span className="font-mono text-gray-300">
                    {selectedTrip.route_distance_km || 220} km
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Carga:</span>
                  <span className="text-gray-300">
                    {selectedTrip.cargo_type} ({selectedTrip.cargo_weight_tons} ton)
                  </span>
                </div>
              </div>

              {/* Financial Summary Card */}
              <div className="bg-gray-800/40 border border-gray-800 rounded-lg p-3.5 space-y-2 text-xs">
                <span className="text-xs font-semibold text-gray-300 block border-b border-gray-800 pb-1.5">
                  Resumen Financiero
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Flete Cobrado:</span>
                  <span className="font-bold text-emerald-400">
                    ${selectedTrip.agreed_freight_price.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Gasto Estimado Combustible:</span>
                  <span className="font-medium text-amber-400">
                    ${selectedTrip.estimated_fuel_cost.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Presupuesto Contingencia:</span>
                  <span className="font-mono text-gray-300">
                    ${selectedTrip.contingency_budget.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-gray-800">
                  <span className="text-gray-400 font-medium">Exposición a Riesgo:</span>
                  <span className="font-bold text-red-400">
                    ${selectedTrip.estimated_loss_risk.toLocaleString()} {selectedTrip.currency}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-xs space-y-2.5">
              <Package className="w-8 h-8 text-gray-600 mx-auto" />
              <p className="font-medium text-gray-300">Ningún viaje seleccionado</p>
              <p className="text-gray-500">
                Haz clic sobre un vehículo en el mapa o en una fila de la tabla para ver su posición y telemetría.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flowbite Minimalist Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Viajes Activos de la Empresa</h2>
            <p className="text-xs text-gray-400">
              Registros aislados por organización en tiempo real.
            </p>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-800 text-gray-300 border border-gray-700">
            {trips.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-400">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase bg-gray-800/50 border-b border-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3">Código / Modo</th>
                <th scope="col" className="px-4 py-3">Ruta</th>
                <th scope="col" className="px-4 py-3">Cliente</th>
                <th scope="col" className="px-4 py-3">Progreso</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3">Flete</th>
                <th scope="col" className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {filteredTrips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No se encontraron viajes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredTrips.map((trip) => {
                  const isSelected = trip.id === selectedTripId;
                  const isCompleted = trip.status === 'completed' || trip.progress_percentage >= 100;
                  return (
                    <tr
                      key={trip.id}
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        if (isCompleted) {
                          setSummaryTrip(trip);
                        }
                      }}
                      className={`transition cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900/15 border-l-2 border-blue-500 text-white'
                          : 'hover:bg-gray-800/40 text-gray-300'
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-white flex items-center gap-2.5">
                        <span className="p-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300">
                          {trip.vehicle_type === 'truck' ? (
                            <Truck className="w-3.5 h-3.5 text-sky-400" />
                          ) : trip.vehicle_type === 'ship' ? (
                            <Ship className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <Plane className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </span>
                        <div>
                          <p className="font-semibold text-white">{trip.tracking_code}</p>
                          <p className="text-[10px] text-gray-400">{trip.vehicle_identifier}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">
                        {trip.route_origin} &rarr; {trip.route_destination}
                      </td>
                      <td className="px-4 py-3 text-gray-300">{trip.client_name || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                trip.is_stuck
                                  ? 'bg-red-500'
                                  : trip.status === 'completed'
                                  ? 'bg-emerald-500'
                                  : 'bg-blue-500'
                              }`}
                              style={{ width: `${trip.progress_percentage}%` }}
                            />
                          </div>
                          <span className="font-mono text-[10px] font-semibold text-gray-300">
                            {trip.progress_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${
                            trip.is_stuck
                              ? 'bg-red-900/30 text-red-300 border border-red-800/40'
                              : trip.status === 'completed'
                              ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/40'
                              : 'bg-blue-900/30 text-blue-300 border border-blue-800/40'
                          }`}
                        >
                          {trip.is_stuck ? 'Atascado' : trip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-400 font-mono">
                        ${trip.agreed_freight_price.toLocaleString()} {trip.currency}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        {isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTripId(trip.id);
                              setSummaryTrip(trip);
                            }}
                            className="px-2.5 py-1 text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 rounded-lg transition cursor-pointer inline-flex items-center gap-1 text-[11px] font-medium"
                            title="Ver resumen de liquidación financiera"
                          >
                            <FileSpreadsheet className="w-3.5 h-3.5" />
                            <span>Resumen</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrip(trip.id, e)}
                          disabled={deletingTripId === trip.id}
                          className="px-2.5 py-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg transition cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                          title="Eliminar viaje del registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">
                            {deletingTripId === trip.id ? '...' : 'Quitar'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
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

      {/* Completed Trip Summary Modal */}
      {summaryTrip && (
        <TripSummaryModal
          trip={summaryTrip}
          onClose={() => setSummaryTrip(null)}
        />
      )}
    </div>
  );
};
