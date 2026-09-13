import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { ContingencyFund, CostSettings } from '../../types/routecost';
import {
  PiggyBank,
  Coins,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  Undo2,
  Save,
  Timer,
} from 'lucide-react';
import { formatDate, formatMoney, fundStatusMeta, tripStatusMeta } from './shared';

interface ContingencyManagerProps {
  funds: ContingencyFund[];
  settings: CostSettings | null;
  /** admin + finance: sólo ellos mueven dinero reservado. */
  canManageMoney: boolean;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ContingencyManager: React.FC<ContingencyManagerProps> = ({
  funds,
  settings,
  canManageMoney,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [busyTripId, setBusyTripId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const [rateEnabled, setRateEnabled] = useState(false);
  const [idleRate, setIdleRate] = useState<number>(0);
  const [rateCurrency, setRateCurrency] = useState('MXN');

  useEffect(() => {
    setRateEnabled(settings?.idle_hourly_rate != null);
    setIdleRate(settings?.idle_hourly_rate ?? 0);
    setRateCurrency(settings?.currency || 'MXN');
  }, [settings]);

  const reserveCurrency = funds[0]?.reserve_currency || 'MXN';

  const handleAllocateMissing = async () => {
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setInfoMsg(null);
      const allocated = await api.allocateMissingContingency(accessToken);
      setInfoMsg(
        allocated > 0
          ? `Se asignó colchón a ${allocated} viaje(s) que no lo tenían.`
          : 'Todos los viajes abiertos ya tienen colchón asignado.'
      );
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudieron asignar los colchones');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReallocate = async (fund: ContingencyFund) => {
    if (!accessToken) return;
    try {
      setBusyTripId(fund.trip_id);
      setErrorMsg(null);
      setInfoMsg(null);
      await api.allocateContingency(accessToken, fund.trip_id);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo recalcular el colchón');
    } finally {
      setBusyTripId(null);
    }
  };

  const handleRelease = async (fund: ContingencyFund) => {
    if (!accessToken) return;
    if (
      !window.confirm(
        `Liberar el colchón de ${fund.trip_tracking_code} devuelve a caja lo no usado y cancela su reserva en tesorería. ¿Continuar?`
      )
    )
      return;
    try {
      setBusyTripId(fund.trip_id);
      setErrorMsg(null);
      setInfoMsg(null);
      await api.releaseContingency(accessToken, fund.trip_id);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo liberar el colchón');
    } finally {
      setBusyTripId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      setInfoMsg(null);
      await api.updateCostSettings(accessToken, {
        idle_hourly_rate: rateEnabled ? Number(idleRate) || 0 : null,
        currency: rateCurrency,
      });
      setInfoMsg('Tarifa de inactividad actualizada.');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo guardar la tarifa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = funds.filter((f) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (f.trip_tracking_code || '').toLowerCase().includes(term) ||
      (f.route_origin || '').toLowerCase().includes(term) ||
      (f.route_destination || '').toLowerCase().includes(term);
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && f.status !== 'released') ||
      statusFilter === f.status;
    return matchesSearch && matchesStatus;
  });

  const committed = funds
    .filter((f) => f.status !== 'released')
    .reduce((sum, f) => sum + (f.allocated_amount - f.consumed_amount - f.released_amount), 0);
  const consumed = funds.reduce((sum, f) => sum + f.consumed_amount, 0);
  const released = funds.reduce((sum, f) => sum + f.released_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#776de8]" />
            Colchón de contingencia por viaje
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Liquidez apartada según el riesgo histórico de la ruta. Cada colchón viaja a tesorería como un
            gasto pendiente hasta que se consume o se libera.
          </p>
        </div>

        {canManageMoney && (
          <button
            onClick={handleAllocateMissing}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4" />
            <span>Asignar colchones faltantes</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
          {errorMsg}
        </div>
      )}
      {infoMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
          {infoMsg}
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <PiggyBank className="w-3.5 h-3.5 text-[#bbb3ff]" /> Comprometido ahora
          </span>
          <div className="text-lg font-bold font-mono text-[#bbb3ff] mt-1">
            {formatMoney(committed, reserveCurrency, 0)}
          </div>
          <span className="text-[10px] text-slate-500">
            {funds.filter((f) => f.status !== 'released').length} viajes con colchón vivo
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-red-400" /> Consumido por fricciones
          </span>
          <div className="text-lg font-bold font-mono text-red-300 mt-1">
            {formatMoney(consumed, reserveCurrency, 0)}
          </div>
          <span className="text-[10px] text-slate-500">Cubierto sin tocar el flujo proyectado</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Undo2 className="w-3.5 h-3.5 text-emerald-400" /> Liberado a caja
          </span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {formatMoney(released, reserveCurrency, 0)}
          </div>
          <span className="text-[10px] text-slate-500">Viajes cerrados sin incidencias</span>
        </div>
      </div>

      {/* Tarifa horaria de inactividad */}
      <form
        onSubmit={handleSaveSettings}
        className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-end gap-4"
      >
        <div className="flex-1">
          <h4 className="text-xs font-bold text-white flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#bbb3ff]" />
            Tarifa horaria de inactividad
          </h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-2xl">
            Es lo que vale una hora con la unidad parada. Si no la fijas, se deriva del propio viaje:
            flete acordado entre las horas planeadas de ruta.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none pb-2">
            <input
              type="checkbox"
              checked={rateEnabled}
              disabled={!canManageMoney}
              onChange={(e) => setRateEnabled(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-950 accent-[#776de8] cursor-pointer"
            />
            Usar tarifa fija
          </label>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Monto por hora</label>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={!rateEnabled || !canManageMoney}
              value={idleRate}
              onChange={(e) => setIdleRate(parseFloat(e.target.value) || 0)}
              className="w-36 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-[#776de8] disabled:opacity-40"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Moneda</label>
            <select
              disabled={!rateEnabled || !canManageMoney}
              value={rateCurrency}
              onChange={(e) => setRateCurrency(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-[#776de8] disabled:opacity-40"
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
          </div>

          {canManageMoney && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              Guardar
            </button>
          )}
        </div>
      </form>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por folio de viaje o ruta..."
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
            <option value="active">Colchones vivos</option>
            <option value="all">Todos</option>
            <option value="allocated">Asignados</option>
            <option value="partially_consumed">Consumidos parcial</option>
            <option value="exhausted">Agotados</option>
            <option value="released">Liberados</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Viaje</th>
              <th className="px-4 py-3">Base del cálculo</th>
              <th className="px-4 py-3 text-right">Asignado</th>
              <th className="px-4 py-3 text-right">Consumido</th>
              <th className="px-4 py-3">Uso</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((fund) => {
              const meta = fundStatusMeta(fund.status);
              const usedPct = Math.min(
                100,
                ((fund.consumed_amount + fund.released_amount) / (fund.allocated_amount || 1)) * 100
              );
              const busy = busyTripId === fund.trip_id;
              const tripInfo = tripStatusMeta(fund.trip_status || '');

              return (
                <tr key={fund.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-white">{fund.trip_tracking_code || '—'}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[190px]">
                      {fund.route_origin} → {fund.route_destination}
                    </div>
                    <span
                      className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${tripInfo.chip}`}
                    >
                      {tripInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-slate-200">
                      {formatMoney(fund.base_amount, fund.base_currency, 0)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {fund.applied_percentage.toFixed(2)}% · riesgo {fund.route_risk_score.toFixed(2)} · TC{' '}
                      {fund.fx_rate.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#bbb3ff]">
                    {formatMoney(fund.allocated_amount, fund.reserve_currency, 0)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-red-300">
                    {formatMoney(fund.consumed_amount, fund.reserve_currency, 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 w-24 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full ${meta.bar}`} style={{ width: `${usedPct}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">{usedPct.toFixed(0)}% usado</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${meta.chip}`}
                    >
                      {meta.label}
                    </span>
                    <div className="text-[10px] text-slate-500 mt-1">{formatDate(fund.calculated_at)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canManageMoney && fund.status !== 'released' ? (
                        <>
                          <button
                            disabled={busy}
                            onClick={() => handleReallocate(fund)}
                            title="Recalcular con el riesgo actual de la ruta"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-40"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => handleRelease(fund)}
                            title="Liberar el remanente a caja"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition cursor-pointer disabled:opacity-40"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  {isLoading
                    ? 'Cargando colchones...'
                    : canManageMoney
                    ? 'Ningún viaje tiene colchón todavía. Usa “Asignar colchones faltantes”.'
                    : 'Ningún viaje tiene colchón asignado todavía.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
