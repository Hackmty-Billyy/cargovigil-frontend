import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { TripFuelLog, CreateTripFuelLogPayload } from '../../types/fuel';
import { FUEL_TYPE_COLORS } from '../../types/fuel';
import type { FuelType } from '../../types/fuel';
import type { Trip } from '../../types/logistics';
import {
  BookOpen,
  Plus,
  Trash2,
  Fuel,
  Calendar,
  X,
  Search,
  Droplets,
} from 'lucide-react';

interface TripFuelLogTableProps {
  logs: TripFuelLog[];
  trips: Trip[];
  isLoading: boolean;
  onRefresh: () => void;
  canWrite: boolean; // admin or operations
}

export const TripFuelLogTable: React.FC<TripFuelLogTableProps> = ({
  logs,
  trips,
  isLoading,
  onRefresh,
  canWrite,
}) => {
  const { accessToken } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelTypeFilter, setFuelTypeFilter] = useState<string>('all');

  // Form state
  const [tripId, setTripId] = useState('');
  const [fuelType, setFuelType] = useState<FuelType>('diesel');
  const [volumePurchased, setVolumePurchased] = useState<number>(0);
  const [costPerUnit, setCostPerUnit] = useState<number>(0);
  const [odometerOrHours, setOdometerOrHours] = useState<number | ''>('');
  const [purchasedAt, setPurchasedAt] = useState(
    () => new Date().toISOString().slice(0, 16)
  );

  const totalCost = volumePurchased * costPerUnit;

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 }).format(v);

  const getTripCode = (tid: string) => {
    const t = trips.find((x) => x.id === tid);
    return t ? t.tracking_code : tid.slice(0, 8) + '...';
  };

  const handleOpenCreate = () => {
    setTripId(trips.length > 0 ? trips[0].id : '');
    setFuelType('diesel');
    setVolumePurchased(0);
    setCostPerUnit(0);
    setOdometerOrHours('');
    setPurchasedAt(new Date().toISOString().slice(0, 16));
    setErrorMsg(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!tripId) { setErrorMsg('Selecciona un viaje.'); return; }
    if (volumePurchased <= 0) { setErrorMsg('El volumen debe ser mayor a cero.'); return; }
    if (costPerUnit <= 0) { setErrorMsg('El costo por unidad debe ser mayor a cero.'); return; }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const payload: CreateTripFuelLogPayload = {
        trip_id: tripId,
        fuel_type: fuelType,
        volume_purchased: Number(volumePurchased),
        cost_per_unit: Number(costPerUnit),
        total_cost: Number(volumePurchased) * Number(costPerUnit),
        odometer_or_hours: odometerOrHours !== '' ? Number(odometerOrHours) : null,
        purchased_at: purchasedAt ? new Date(purchasedAt).toISOString() : undefined,
      };
      await api.createTripFuelLog(accessToken, payload);
      setShowModal(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al registrar carga de combustible');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('¿Eliminar este registro de carga de combustible?')) return;
    try {
      await api.deleteTripFuelLog(accessToken, id);
      onRefresh();
    } catch (err: any) {
      window.alert(err.message || 'Error al eliminar registro');
    }
  };

  // Filter
  const filtered = logs.filter((l) => {
    const code = getTripCode(l.trip_id).toLowerCase();
    const matchesSearch = code.includes(searchTerm.toLowerCase());
    const matchesFuel = fuelTypeFilter === 'all' || l.fuel_type === fuelTypeFilter;
    return matchesSearch && matchesFuel;
  });

  const totalVolume = filtered.reduce((s, l) => s + l.volume_purchased, 0);
  const totalSpend = filtered.reduce((s, l) => s + l.total_cost, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            Bitácora de Combustible por Viaje
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Registro detallado de cada carga de combustible: tipo, volumen, costo y odómetro.
          </p>
        </div>
        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Registrar Carga
          </button>
        )}
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-amber-400" /> Volumen Total (filtrado)</span>
          <div className="text-lg font-bold font-mono text-white mt-1">{totalVolume.toFixed(1)} L</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1"><Fuel className="w-3.5 h-3.5 text-amber-400" /> Gasto Total (filtrado)</span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">{fmtCurrency(totalSpend)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400">Costo Promedio por Litro</span>
          <div className="text-lg font-bold font-mono text-slate-200 mt-1">
            {totalVolume > 0 ? fmtCurrency(totalSpend / totalVolume) : 'N/A'}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código de viaje..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
          />
        </div>
        <select
          value={fuelTypeFilter}
          onChange={(e) => setFuelTypeFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
        >
          <option value="all">Todos los Combustibles</option>
          <option value="diesel">⛽ Diésel</option>
          <option value="bunker_c">🛢️ Bunker C</option>
          <option value="marine_gasoil">⚓ Marine Gas Oil</option>
          <option value="jet_a1">✈️ Jet A-1</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Viaje</th>
              <th className="px-4 py-3">Combustible</th>
              <th className="px-4 py-3 text-right">Volumen (L)</th>
              <th className="px-4 py-3 text-right">$/L</th>
              <th className="px-4 py-3 text-right">Costo Total</th>
              <th className="px-4 py-3">Odómetro/Hrs</th>
              <th className="px-4 py-3">Fecha Carga</th>
              {canWrite && <th className="px-4 py-3 text-right">Acc.</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/50 transition">
                <td className="px-4 py-3 font-mono font-bold text-white">{getTripCode(log.trip_id)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${FUEL_TYPE_COLORS[log.fuel_type]}`}>
                    {log.fuel_type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">{log.volume_purchased.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-mono text-slate-400">{fmtCurrency(log.cost_per_unit)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-amber-300">{fmtCurrency(log.total_cost)}</td>
                <td className="px-4 py-3 font-mono text-slate-400">{log.odometer_or_hours != null ? log.odometer_or_hours.toLocaleString() : '—'}</td>
                <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                  {new Date(log.purchased_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                {canWrite && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(log.id)} className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer" title="Eliminar">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && !isLoading && (
          <div className="py-12 text-center text-slate-500 text-xs">No hay registros de combustible con los filtros actuales.</div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Fuel className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Registrar Carga de Combustible</h3>
                <p className="text-xs text-slate-400">Bitácora de abastecimiento por viaje</p>
              </div>
            </div>

            {errorMsg && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Viaje *</label>
                {trips.length === 0 ? (
                  <p className="text-xs text-amber-400">No hay viajes activos. Crea un viaje primero en el Radar.</p>
                ) : (
                  <select value={tripId} onChange={(e) => setTripId(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>{t.tracking_code} — {t.route_origin ?? '?'} → {t.route_destination ?? '?'}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tipo de Combustible *</label>
                  <select value={fuelType} onChange={(e) => setFuelType(e.target.value as FuelType)} className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500">
                    <option value="diesel">⛽ Diésel</option>
                    <option value="bunker_c">🛢️ Bunker C</option>
                    <option value="marine_gasoil">⚓ Marine Gas Oil</option>
                    <option value="jet_a1">✈️ Jet A-1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Volumen (Litros) *</label>
                  <input type="number" step="0.1" min="0.1" required value={volumePurchased} onChange={(e) => setVolumePurchased(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Costo por Litro ($/L) *</label>
                  <input type="number" step="0.01" min="0.01" required value={costPerUnit} onChange={(e) => setCostPerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Odómetro / Horas (opcional)</label>
                  <input type="number" step="0.1" value={odometerOrHours} onChange={(e) => setOdometerOrHours(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              {/* Computed total */}
              {totalCost > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-sm font-mono font-bold text-amber-300 text-center">
                  Costo Total Calculado: {fmtCurrency(totalCost)}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  Fecha y Hora de Carga
                </label>
                <input type="datetime-local" value={purchasedAt} onChange={(e) => setPurchasedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer">Cancelar</button>
                <button type="submit" disabled={isSubmitting || trips.length === 0} className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 transition cursor-pointer disabled:opacity-50">
                  {isSubmitting ? 'Guardando...' : 'Registrar Carga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
