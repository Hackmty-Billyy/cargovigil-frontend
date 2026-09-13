import React, { useEffect, useState } from 'react';
import type { Friction } from '../../types/routecost';
import { frictionMeta, formatHours, formatMoney, hoursSince } from './shared';
import { AlertTriangle, CheckCircle2, RefreshCw, Timer, ArrowRight } from 'lucide-react';

interface OpenFrictionsBannerProps {
  frictions: Friction[];
  /** Tarifa horaria efectiva por viaje, para valuar el tiempo que corre ahora. */
  hourlyRateByTrip: Record<string, number>;
  currency: string;
  isLoading: boolean;
  onRefresh: () => void;
  onSeeAll: () => void;
}

/**
 * Lo que está costando dinero en este momento. A diferencia del resto de las
 * vistas, aquí el número se mueve solo: una fricción sin cerrar sigue
 * acumulando horas muertas, así que el banner se recalcula cada minuto.
 */
export const OpenFrictionsBanner: React.FC<OpenFrictionsBannerProps> = ({
  frictions,
  hourlyRateByTrip,
  currency,
  isLoading,
  onRefresh,
  onSeeAll,
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, []);

  const open = frictions.filter((f) => !f.ended_at);

  if (open.length === 0) {
    return (
      <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Sin tiempos muertos en curso</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ningún viaje está detenido ahora mismo. Toda la flota en movimiento.
              </p>
            </div>
          </div>
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-2 self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>
    );
  }

  const totalIdleHours = open.reduce((sum, f) => sum + hoursSince(f.started_at), 0);
  const burningNow = open.reduce(
    (sum, f) => sum + hoursSince(f.started_at) * (hourlyRateByTrip[f.trip_id] ?? 0),
    0
  );

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              {open.length} {open.length === 1 ? 'viaje detenido' : 'viajes detenidos'} ahora mismo
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatHours(totalIdleHours)} acumuladas · pérdida de oportunidad corriendo por{' '}
              <span className="font-mono font-semibold text-amber-300">
                {formatMoney(burningNow, currency, 0)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
          <button
            onClick={onSeeAll}
            className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition cursor-pointer flex items-center gap-1.5"
          >
            Ver bitácora
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {open.slice(0, 6).map((f) => {
          const meta = frictionMeta(f.event_type);
          const Icon = meta.icon;
          const idle = hoursSince(f.started_at);
          const rate = hourlyRateByTrip[f.trip_id] ?? 0;

          return (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800"
            >
              <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${meta.chip}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-white truncate">
                  {f.trip_tracking_code || 'Viaje'} · {meta.label}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {f.location_name || `${f.route_origin} → ${f.route_destination}`}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-mono font-bold text-amber-300 flex items-center gap-1 justify-end">
                  <Timer className="w-3 h-3" />
                  {formatHours(idle)}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  {formatMoney(idle * rate, currency, 0)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open.length > 6 && (
        <p className="text-[11px] text-slate-500 mt-3">
          y {open.length - 6} más en la bitácora de fricciones.
        </p>
      )}
    </div>
  );
};
