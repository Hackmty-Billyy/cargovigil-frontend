import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Friction } from '../../types/routecost';
import {
  Timer,
  Search,
  Filter,
  Square,
  X,
  Hourglass,
  TrendingDown,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import {
  FRICTION_EVENT_TYPES,
  formatDateTime,
  formatHours,
  formatMoney,
  frictionMeta,
  fromLocalInput,
  hoursSince,
  toLocalInput,
} from './shared';

interface FrictionsManagerProps {
  frictions: Friction[];
  currency: string;
  hourlyRateByTrip: Record<string, number>;
  canWrite: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

/**
 * La bitácora completa de tiempos muertos de la empresa. Registrar una
 * fricción se hace desde el viaje (ahí se sabe a cuál pertenece); aquí se
 * consulta, se filtra y se cierran las que siguen corriendo.
 */
export const FrictionsManager: React.FC<FrictionsManagerProps> = ({
  frictions,
  currency,
  hourlyRateByTrip,
  canWrite,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [closing, setClosing] = useState<Friction | null>(null);
  const [closeEndedAt, setCloseEndedAt] = useState(() => toLocalInput(new Date()));
  const [closeCost, setCloseCost] = useState<number>(0);

  const openCloseForm = (f: Friction) => {
    setClosing(f);
    setCloseEndedAt(toLocalInput(new Date()));
    setCloseCost(f.cost_impact);
    setErrorMsg(null);
  };

  const handleClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !closing) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.closeFriction(accessToken, closing.id, {
        ended_at: fromLocalInput(closeEndedAt),
        cost_impact: Number(closeCost) || 0,
      });
      setClosing(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo cerrar la fricción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = frictions.filter((f) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (f.trip_tracking_code || '').toLowerCase().includes(term) ||
      (f.location_name || '').toLowerCase().includes(term) ||
      (f.route_origin || '').toLowerCase().includes(term) ||
      (f.route_destination || '').toLowerCase().includes(term);
    const matchesType = typeFilter === 'all' || f.event_type === typeFilter;
    const matchesState =
      stateFilter === 'all' ||
      (stateFilter === 'open' && !f.ended_at) ||
      (stateFilter === 'closed' && !!f.ended_at);
    return matchesSearch && matchesType && matchesState;
  });

  const openOnes = frictions.filter((f) => !f.ended_at);
  const totalIdle = frictions.reduce(
    (sum, f) => sum + (f.ended_at ? f.duration_hours : hoursSince(f.started_at)),
    0
  );
  const totalDirect = frictions.reduce((sum, f) => sum + f.cost_impact, 0);
  const totalOpportunity = frictions.reduce(
    (sum, f) =>
      sum + (f.ended_at ? f.opportunity_cost : hoursSince(f.started_at) * (hourlyRateByTrip[f.trip_id] ?? 0)),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Timer className="w-5 h-5 text-[#776de8]" />
            Bitácora de tiempos muertos
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Demoras en puerto, aduanas, fallas y detenciones — con lo que costaron y lo que dejaron de
            producir. Se registran desde el viaje.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Hourglass className="w-3.5 h-3.5 text-amber-400" /> Horas muertas acumuladas
          </span>
          <div className="text-lg font-bold font-mono text-white mt-1">{formatHours(totalIdle)}</div>
          <span className="text-[10px] text-slate-500">{frictions.length} eventos registrados</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> En curso ahora
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">{openOnes.length}</div>
          <span className="text-[10px] text-slate-500">Siguen sumando costo</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-cyan-400" /> Costo directo
          </span>
          <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
            {formatMoney(totalDirect, currency, 0)}
          </div>
          <span className="text-[10px] text-slate-500">Demoras y multas pagadas</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Pérdida de oportunidad
          </span>
          <div className="text-lg font-bold font-mono text-amber-300 mt-1">
            {formatMoney(totalOpportunity, currency, 0)}
          </div>
          <span className="text-[10px] text-slate-500">Ingreso que el activo no produjo</span>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio de viaje, lugar o ruta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Todos los eventos</option>
            {FRICTION_EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {frictionMeta(t).label}
              </option>
            ))}
          </select>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
          >
            <option value="all">Abiertas y cerradas</option>
            <option value="open">Sólo en curso</option>
            <option value="closed">Sólo cerradas</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Evento</th>
              <th className="px-4 py-3">Viaje / Ruta</th>
              <th className="px-4 py-3">Periodo</th>
              <th className="px-4 py-3 text-right">Duración</th>
              <th className="px-4 py-3 text-right">Costo directo</th>
              <th className="px-4 py-3 text-right">Oportunidad</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((f) => {
              const meta = frictionMeta(f.event_type);
              const Icon = meta.icon;
              const isOpen = !f.ended_at;
              const hours = isOpen ? hoursSince(f.started_at) : f.duration_hours;
              const opportunity = isOpen ? hours * (hourlyRateByTrip[f.trip_id] ?? 0) : f.opportunity_cost;

              return (
                <tr key={f.id} className={`transition ${isOpen ? 'bg-amber-500/5' : 'hover:bg-slate-800/40'}`}>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.chip}`}
                    >
                      <Icon className="w-3 h-3" />
                      {meta.label}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[200px]">
                      {f.location_name || 'Sin ubicación'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-white">{f.trip_tracking_code || '—'}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                      {f.route_origin} → {f.route_destination}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                    {formatDateTime(f.started_at)}
                    <div className="text-slate-500">
                      {isOpen ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Hourglass className="w-3 h-3" /> en curso
                        </span>
                      ) : (
                        formatDateTime(f.ended_at)
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-white">{formatHours(hours)}</td>
                  <td className="px-4 py-3 text-right font-mono text-cyan-300">
                    {formatMoney(f.cost_impact, currency, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-amber-300">
                    {formatMoney(opportunity, currency, 0)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canWrite && isOpen ? (
                      <button
                        onClick={() => openCloseForm(f)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Square className="w-3 h-3" />
                        Cerrar
                      </button>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {isLoading ? 'Cargando bitácora...' : 'No hay fricciones que coincidan con el filtro.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de cierre */}
      {closing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
            <button
              onClick={() => setClosing(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Square className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Cerrar fricción</h3>
                <p className="text-xs text-slate-400">
                  {frictionMeta(closing.event_type).label} · {closing.trip_tracking_code}
                </p>
              </div>
            </div>

            <form onSubmit={handleClose} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Fin real *</label>
                <input
                  type="datetime-local"
                  required
                  value={closeEndedAt}
                  onChange={(e) => setCloseEndedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Empezó el {formatDateTime(closing.started_at)}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Costo directo real ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={closeCost}
                  onChange={(e) => setCloseCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#776de8]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Se cobra contra el colchón del viaje. Sólo el aumento respecto de lo ya registrado genera
                  un gasto nuevo.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setClosing(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Cerrando...' : 'Cerrar fricción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
