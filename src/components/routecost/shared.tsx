import {
  Anchor,
  ClipboardCheck,
  Car,
  Wrench,
  Route as RouteIcon,
  CloudRain,
  ShieldAlert,
  Warehouse,
  type LucideIcon,
} from 'lucide-react';
import type { FrictionEventType, FundStatus } from '../../types/routecost';

/**
 * Piezas compartidas por las cuatro vistas del módulo 2. Viven aquí y no
 * repetidas en cada componente porque un mismo tipo de fricción tiene que
 * verse idéntico en la bitácora, en el banner y en el detalle del viaje.
 */

export interface Meta {
  label: string;
  icon: LucideIcon;
  /** Clases de chip: texto + fondo + borde. */
  chip: string;
  /** Sólo el color de texto, para iconos sueltos. */
  text: string;
}

const FRICTION_META: Record<FrictionEventType, Meta> = {
  port_demurrage: {
    label: 'Demora en puerto',
    icon: Anchor,
    chip: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
  },
  customs_delay: {
    label: 'Retención en aduana',
    icon: ClipboardCheck,
    chip: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    text: 'text-amber-400',
  },
  traffic_congestion: {
    label: 'Congestión vial',
    icon: Car,
    chip: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    text: 'text-cyan-400',
  },
  mechanical_failure: {
    label: 'Falla mecánica',
    icon: Wrench,
    chip: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    text: 'text-orange-400',
  },
  route_deviation: {
    label: 'Desvío de ruta',
    icon: RouteIcon,
    chip: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    text: 'text-purple-400',
  },
  weather_hazard: {
    label: 'Clima adverso',
    icon: CloudRain,
    chip: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    text: 'text-sky-400',
  },
  security_incident: {
    label: 'Incidente de seguridad',
    icon: ShieldAlert,
    chip: 'text-red-400 bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
  },
  warehouse_detention: {
    label: 'Detención en almacén',
    icon: Warehouse,
    chip: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    text: 'text-indigo-400',
  },
};

export const frictionMeta = (eventType: string): Meta =>
  FRICTION_META[eventType as FrictionEventType] ?? {
    label: eventType,
    icon: ShieldAlert,
    chip: 'text-slate-300 bg-slate-800 border-slate-700',
    text: 'text-slate-300',
  };

export const FRICTION_EVENT_TYPES = Object.keys(FRICTION_META) as FrictionEventType[];

const TRIP_STATUS_META: Record<string, { label: string; chip: string }> = {
  scheduled: { label: 'Programado', chip: 'text-slate-300 bg-slate-800 border-slate-700' },
  in_transit: { label: 'En tránsito', chip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' },
  delayed: { label: 'Retrasado', chip: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  completed: { label: 'Completado', chip: 'text-[#bbb3ff] bg-[#776de8]/15 border-[#776de8]/40' },
  cancelled: { label: 'Cancelado', chip: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

export const tripStatusMeta = (status: string) =>
  TRIP_STATUS_META[status] ?? { label: status || '—', chip: 'text-slate-300 bg-slate-800 border-slate-700' };

const FUND_STATUS_META: Record<FundStatus, { label: string; chip: string; bar: string }> = {
  allocated: {
    label: 'Asignado',
    chip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    bar: 'bg-emerald-500',
  },
  partially_consumed: {
    label: 'Consumido parcial',
    chip: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    bar: 'bg-amber-500',
  },
  exhausted: {
    label: 'Agotado',
    chip: 'text-red-400 bg-red-500/10 border-red-500/30',
    bar: 'bg-red-500',
  },
  released: {
    label: 'Liberado',
    chip: 'text-slate-300 bg-slate-800 border-slate-700',
    bar: 'bg-slate-600',
  },
};

export const fundStatusMeta = (status: string) =>
  FUND_STATUS_META[status as FundStatus] ?? FUND_STATUS_META.allocated;

/**
 * Los importes de fricciones vienen en la moneda del viaje y los del colchón
 * en MXN: la moneda siempre se pasa explícita, nunca se asume.
 */
export const formatMoney = (value: number, currency: string = 'MXN', decimals = 2) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: currency || 'MXN',
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);

export const formatHours = (hours: number) => {
  const safe = Number.isFinite(hours) ? hours : 0;
  if (safe < 1) return `${Math.round(safe * 60)} min`;
  if (safe < 24) return `${safe.toFixed(1)} h`;
  const days = Math.floor(safe / 24);
  const rest = Math.round(safe % 24);
  return rest > 0 ? `${days}d ${rest}h` : `${days}d`;
};

export const formatDateTime = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Horas transcurridas desde `iso` hasta ahora — para las fricciones abiertas. */
export const hoursSince = (iso: string) =>
  Math.max(0, (Date.now() - new Date(iso).getTime()) / 3_600_000);

/**
 * Escala del score de riesgo: es un multiplicador de 1.00 a 3.00, no un
 * porcentaje, así que se codifica en tres tramos en vez de una barra de 0-100.
 */
export const riskTier = (score: number) => {
  if (score >= 2.2) return { label: 'Alto', chip: 'text-red-400 bg-red-500/10 border-red-500/30', bar: 'bg-red-500', steps: 3 };
  if (score >= 1.5) return { label: 'Medio', chip: 'text-amber-400 bg-amber-500/10 border-amber-500/30', bar: 'bg-amber-500', steps: 2 };
  return { label: 'Bajo', chip: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30', bar: 'bg-emerald-500', steps: 1 };
};

/** Valor para <input type="datetime-local"> a partir de una fecha. */
export const toLocalInput = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

/** Y de vuelta: el backend acepta RFC3339, así que se manda en UTC explícito. */
export const fromLocalInput = (value: string) => new Date(value).toISOString();
