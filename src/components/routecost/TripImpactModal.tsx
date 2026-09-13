import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Trip } from '../../types/logistics';
import type { Friction, FrictionEventType, TripImpact } from '../../types/routecost';
import {
  X,
  Timer,
  Receipt,
  TrendingDown,
  Activity,
  PiggyBank,
  Plus,
  Square,
  MapPin,
  Hourglass,
} from 'lucide-react';
import {
  FRICTION_EVENT_TYPES,
  formatDateTime,
  formatHours,
  formatMoney,
  frictionMeta,
  fundStatusMeta,
  fromLocalInput,
  hoursSince,
  toLocalInput,
  tripStatusMeta,
} from './shared';

interface TripImpactModalProps {
  trip: Trip;
  canWrite: boolean;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * El detalle que traduce lo físico a dinero: cuántas horas estuvo parado el
 * viaje, qué se pagó por ello y qué ingreso se dejó de producir, más el estado
 * del colchón que cubre esos costos.
 */
export const TripImpactModal: React.FC<TripImpactModalProps> = ({ trip, canWrite, onClose, onChanged }) => {
  const { accessToken } = useAuth();
  const [impact, setImpact] = useState<TripImpact | null>(null);
  const [frictions, setFrictions] = useState<Friction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [eventType, setEventType] = useState<FrictionEventType>('port_demurrage');
  const [locationName, setLocationName] = useState('');
  const [startedAt, setStartedAt] = useState(() => toLocalInput(new Date()));
  const [endedAt, setEndedAt] = useState('');
  const [costImpact, setCostImpact] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [closingId, setClosingId] = useState<string | null>(null);
  const [closeEndedAt, setCloseEndedAt] = useState(() => toLocalInput(new Date()));
  const [closeCost, setCloseCost] = useState<number>(0);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const [imp, frs] = await Promise.all([
        api.getTripImpact(accessToken, trip.id),
        api.listTripFrictions(accessToken, trip.id),
      ]);
      setImpact(imp);
      setFrictions(frs);
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo cargar el impacto del viaje');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, trip.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.registerFriction(accessToken, trip.id, {
        event_type: eventType,
        location_name: locationName.trim() || null,
        started_at: fromLocalInput(startedAt),
        ended_at: endedAt ? fromLocalInput(endedAt) : null,
        cost_impact: Number(costImpact) || 0,
        notes: notes.trim() || null,
      });
      setShowForm(false);
      setLocationName('');
      setEndedAt('');
      setCostImpact(0);
      setNotes('');
      await load();
      onChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo registrar la fricción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = async (frictionId: string) => {
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await api.closeFriction(accessToken, frictionId, {
        ended_at: fromLocalInput(closeEndedAt),
        cost_impact: Number(closeCost) || 0,
      });
      setClosingId(null);
      setCloseCost(0);
      await load();
      onChanged();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo cerrar la fricción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currency = impact?.currency || trip.currency || 'USD';
  const fund = impact?.contingency_fund || null;
  const statusInfo = tripStatusMeta(trip.status);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5 pr-10">
          <div className="w-10 h-10 rounded-xl bg-[#776de8]/20 border border-[#776de8]/30 flex items-center justify-center text-[#bbb3ff] shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
              <span className="font-mono">{trip.tracking_code}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${statusInfo.chip}`}
              >
                {statusInfo.label}
              </span>
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {trip.route_origin} → {trip.route_destination} · {trip.client_name}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Cifras del impacto */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-amber-400" /> Horas muertas
            </span>
            <div className="text-lg font-bold font-mono text-white mt-1">
              {formatHours(impact?.total_idle_hours || 0)}
            </div>
            <span className="text-[10px] text-slate-500">
              {impact?.open_friction_count || 0} en curso · {impact?.friction_count || 0} en total
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-cyan-400" /> Costo directo
            </span>
            <div className="text-lg font-bold font-mono text-cyan-300 mt-1">
              {formatMoney(impact?.direct_cost || 0, currency, 0)}
            </div>
            <span className="text-[10px] text-slate-500">Pagado a terceros</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400" /> Pérdida de oportunidad
            </span>
            <div className="text-lg font-bold font-mono text-amber-300 mt-1">
              {formatMoney(impact?.opportunity_cost || 0, currency, 0)}
            </div>
            <span className="text-[10px] text-slate-500">
              {formatMoney(impact?.idle_hourly_rate || 0, currency, 0)} por hora parada
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-red-400" /> Impacto total
            </span>
            <div className="text-lg font-bold font-mono text-red-300 mt-1">
              {formatMoney(impact?.total_friction_impact || 0, currency, 0)}
            </div>
            <span className="text-[10px] text-slate-500">
              {trip.agreed_freight_price > 0
                ? `${(((impact?.total_friction_impact || 0) / trip.agreed_freight_price) * 100).toFixed(1)}% del flete`
                : 'Sobre el flete acordado'}
            </span>
          </div>
        </div>

        {/* Colchón */}
        {fund && (
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 mb-5">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-xs font-semibold text-white flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-[#bbb3ff]" />
                Colchón de contingencia
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${fundStatusMeta(fund.status).chip}`}
              >
                {fundStatusMeta(fund.status).label}
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${Math.min(100, (fund.consumed_amount / (fund.allocated_amount || 1)) * 100)}%`,
                }}
              />
              <div
                className="h-full bg-slate-600"
                style={{
                  width: `${Math.min(100, (fund.released_amount / (fund.allocated_amount || 1)) * 100)}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 text-[11px]">
              <div>
                <div className="text-slate-500">Asignado</div>
                <div className="font-mono font-bold text-white">
                  {formatMoney(fund.allocated_amount, fund.reserve_currency)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Consumido</div>
                <div className="font-mono font-bold text-red-300">
                  {formatMoney(fund.consumed_amount, fund.reserve_currency)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Liberado</div>
                <div className="font-mono font-bold text-slate-300">
                  {formatMoney(fund.released_amount, fund.reserve_currency)}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Base del cálculo</div>
                <div className="font-mono font-bold text-[#bbb3ff]">
                  {fund.applied_percentage.toFixed(2)}% · riesgo {fund.route_risk_score.toFixed(2)}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 mt-2">
              {formatMoney(fund.base_amount, fund.base_currency)} de flete × {fund.applied_percentage.toFixed(2)}%
              , convertido a {fund.reserve_currency} al tipo de cambio {fund.fx_rate.toFixed(2)}.
            </p>
          </div>
        )}

        {/* Bitácora */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-white">Bitácora de tiempos muertos</h4>
          {canWrite && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar fricción
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleRegister}
            className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Tipo de evento *</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as FrictionEventType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                >
                  {FRICTION_EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {frictionMeta(t).label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Lugar</label>
                <input
                  type="text"
                  placeholder="Ej. Puerto de Manzanillo"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Inicio *</label>
                <input
                  type="datetime-local"
                  required
                  value={startedAt}
                  onChange={(e) => setStartedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Fin <span className="text-slate-500 font-normal">(vacío = sigue parado)</span>
                </label>
                <input
                  type="datetime-local"
                  value={endedAt}
                  onChange={(e) => setEndedAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Costo directo ({currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costImpact}
                  onChange={(e) => setCostImpact(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Notas</label>
              <input
                type="text"
                placeholder="Ej. Espera de atraque por congestión de muelle"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
              />
            </div>

            <p className="text-[10px] text-slate-500">
              El costo directo se cobra contra el colchón del viaje; sólo lo que exceda el colchón
              impacta la proyección de caja.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {frictions.map((f) => {
            const meta = frictionMeta(f.event_type);
            const Icon = meta.icon;
            const isOpen = !f.ended_at;
            const liveHours = isOpen ? hoursSince(f.started_at) : f.duration_hours;

            return (
              <div
                key={f.id}
                className={`p-3 rounded-xl border ${
                  isOpen ? 'bg-amber-500/5 border-amber-500/30' : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.chip}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-white">{meta.label}</span>
                      {isOpen && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border text-amber-400 bg-amber-500/10 border-amber-500/30 flex items-center gap-1">
                          <Hourglass className="w-3 h-3" /> En curso
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{f.location_name || 'Sin ubicación'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {formatDateTime(f.started_at)} → {f.ended_at ? formatDateTime(f.ended_at) : 'ahora'}
                    </div>
                    {f.notes && <div className="text-[11px] text-slate-400 mt-1 italic">“{f.notes}”</div>}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-white">{formatHours(liveHours)}</div>
                    <div className="text-[10px] font-mono text-cyan-300">
                      {formatMoney(f.cost_impact, currency, 0)} directo
                    </div>
                    <div className="text-[10px] font-mono text-amber-300">
                      {formatMoney(
                        isOpen ? liveHours * (impact?.idle_hourly_rate || 0) : f.opportunity_cost,
                        currency,
                        0
                      )}{' '}
                      oportunidad
                    </div>

                    {canWrite && isOpen && closingId !== f.id && (
                      <button
                        onClick={() => {
                          setClosingId(f.id);
                          setCloseEndedAt(toLocalInput(new Date()));
                          setCloseCost(f.cost_impact);
                        }}
                        className="mt-2 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Square className="w-3 h-3" />
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>

                {closingId === f.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Fin real *</label>
                      <input
                        type="datetime-local"
                        value={closeEndedAt}
                        onChange={(e) => setCloseEndedAt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Costo directo ({currency})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={closeCost}
                        onChange={(e) => setCloseCost(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setClosingId(null)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleClose(f.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? 'Cerrando...' : 'Cerrar fricción'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {frictions.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-xs rounded-xl border border-dashed border-slate-800">
              {isLoading ? 'Cargando bitácora...' : 'Este viaje no ha registrado tiempos muertos.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
