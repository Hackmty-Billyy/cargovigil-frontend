import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Trip } from '../../types/logistics';
import type { ContingencyFund, Friction } from '../../types/routecost';
import { PreTripSchedulerModal } from '../logistics/PreTripSchedulerModal';
import { TripImpactModal } from './TripImpactModal';
import {
  Truck,
  Ship,
  Plane,
  Plus,
  Search,
  Filter,
  Gauge,
  AlertTriangle,
  Timer,
  PiggyBank,
  CheckCircle2,
  XCircle,
  Play,
} from 'lucide-react';
import { formatDateTime, formatHours, formatMoney, tripStatusMeta } from './shared';

interface TripsManagerProps {
  trips: Trip[];
  frictions: Friction[];
  funds: ContingencyFund[];
  canWrite: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

const VEHICLE_ICON: Record<string, typeof Truck> = { truck: Truck, ship: Ship, plane: Plane };

export const TripsManager: React.FC<TripsManagerProps> = ({
  trips,
  frictions,
  funds,
  canWrite,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showScheduler, setShowScheduler] = useState(false);
  const [impactTrip, setImpactTrip] = useState<Trip | null>(null);
  const [busyTripId, setBusyTripId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fundByTrip = new Map(funds.map((f) => [f.trip_id, f]));
  const idleByTrip = frictions.reduce<Record<string, number>>((acc, f) => {
    acc[f.trip_id] = (acc[f.trip_id] || 0) + f.duration_hours;
    return acc;
  }, {});

  const handleStatusChange = async (trip: Trip, status: string) => {
    if (!accessToken) return;
    const confirmMsg =
      status === 'completed'
        ? `Completar ${trip.tracking_code} liberará el colchón no usado y recalculará el riesgo de la ruta. ¿Continuar?`
        : status === 'cancelled'
        ? `Cancelar ${trip.tracking_code} liberará su colchón de contingencia. ¿Continuar?`
        : null;
    if (confirmMsg && !window.confirm(confirmMsg)) return;

    try {
      setBusyTripId(trip.id);
      setErrorMsg(null);
      await api.changeTripStatus(accessToken, trip.id, status);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo cambiar el estado del viaje');
    } finally {
      setBusyTripId(null);
    }
  };

  const filtered = trips.filter((t) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      t.tracking_code.toLowerCase().includes(term) ||
      (t.client_name || '').toLowerCase().includes(term) ||
      (t.route_origin || '').toLowerCase().includes(term) ||
      (t.route_destination || '').toLowerCase().includes(term);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeTrips = trips.filter((t) => t.status === 'in_transit' || t.status === 'delayed').length;
  const delayedTrips = trips.filter((t) => t.status === 'delayed' || t.is_stuck).length;
  const committedCushion = funds
    .filter((f) => f.status !== 'released')
    .reduce((sum, f) => sum + (f.allocated_amount - f.consumed_amount - f.released_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#776de8]" />
            Viajes y su exposición a fricciones
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Cada viaje lleva su colchón de liquidez calculado por el riesgo histórico de la ruta.
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => setShowScheduler(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Viaje</span>
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
            <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Viajes en operación
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">{activeTrips}</div>
          <span className="text-[10px] text-slate-500">{trips.length} viajes registrados en total</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Con retraso o detenidos
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">{delayedTrips}</div>
          <span className="text-[10px] text-slate-500">Están generando tiempo muerto</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-[#bbb3ff]" /> Colchón sin usar
          </span>
          <div className="text-lg font-bold font-mono text-[#bbb3ff] mt-1">
            {formatMoney(committedCushion, 'MXN', 0)}
          </div>
          <span className="text-[10px] text-slate-500">Liquidez apartada en viajes abiertos</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio, cliente u origen/destino..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Todos los estados</option>
            <option value="scheduled">Programados</option>
            <option value="in_transit">En tránsito</option>
            <option value="delayed">Retrasados</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Viaje</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Salida</th>
              <th className="px-4 py-3 text-right">Flete</th>
              <th className="px-4 py-3 text-right">Tiempo muerto</th>
              <th className="px-4 py-3 text-right">Colchón</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((trip) => {
              const VehicleIcon = VEHICLE_ICON[trip.vehicle_type || 'truck'] || Truck;
              const statusInfo = tripStatusMeta(trip.status);
              const fund = fundByTrip.get(trip.id);
              const idle = idleByTrip[trip.id] || 0;
              const isClosed = trip.status === 'completed' || trip.status === 'cancelled';
              const busy = busyTripId === trip.id;

              return (
                <tr key={trip.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <VehicleIcon className="w-4 h-4 text-slate-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-white font-mono">{trip.tracking_code}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
                          {trip.client_name || trip.cargo_type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300">{trip.route_origin || '—'}</div>
                    <div className="text-[10px] text-slate-500">→ {trip.route_destination || '—'}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {formatDateTime(trip.departure_date)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-200">
                    {formatMoney(trip.agreed_freight_price, trip.currency, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {idle > 0 ? (
                      <span className="font-mono text-amber-300 inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatHours(idle)}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {fund ? (
                      <span className={fund.status === 'released' ? 'text-slate-500' : 'text-[#bbb3ff]'}>
                        {formatMoney(fund.allocated_amount, fund.reserve_currency, 0)}
                      </span>
                    ) : (
                      <span className="text-slate-600">sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusInfo.chip}`}
                    >
                      {statusInfo.label}
                    </span>
                    {trip.is_stuck && (
                      <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {trip.stuck_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setImpactTrip(trip)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold transition cursor-pointer"
                      >
                        Impacto
                      </button>

                      {canWrite && !isClosed && (
                        <>
                          {trip.status === 'scheduled' && (
                            <button
                              disabled={busy}
                              onClick={() => handleStatusChange(trip, 'in_transit')}
                              title="Marcar en tránsito"
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer disabled:opacity-40"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            disabled={busy}
                            onClick={() => handleStatusChange(trip, 'completed')}
                            title="Completar viaje (libera el colchón)"
                            className="p-1.5 rounded-lg bg-[#776de8]/15 hover:bg-[#776de8]/25 text-[#bbb3ff] border border-[#776de8]/30 transition cursor-pointer disabled:opacity-40"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleStatusChange(trip, 'cancelled')}
                            title="Cancelar viaje"
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition cursor-pointer disabled:opacity-40"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                  {isLoading ? 'Cargando viajes...' : 'No hay viajes que coincidan con el filtro.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showScheduler && (
        <PreTripSchedulerModal
          onClose={() => setShowScheduler(false)}
          onTripCreated={() => {
            setShowScheduler(false);
            onRefresh();
          }}
        />
      )}

      {impactTrip && (
        <TripImpactModal
          trip={impactTrip}
          canWrite={canWrite}
          onClose={() => setImpactTrip(null)}
          onChanged={onRefresh}
        />
      )}
    </div>
  );
};
