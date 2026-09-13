import React, { useState } from 'react';
import type { FuelWeeklyTrend, FuelType } from '../../types/fuel';
import { FUEL_TYPE_LABELS } from '../../types/fuel';
import { TrendingUp, TrendingDown, Minus, BarChart2 } from 'lucide-react';

interface FuelPriceTrendChartProps {
  data: FuelWeeklyTrend[];
  fuelType: FuelType;
  isLoading?: boolean;
}

export const FuelPriceTrendChart: React.FC<FuelPriceTrendChartProps> = ({
  data,
  fuelType,
  isLoading,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const formatPrice = (val: number) =>
    `$${val.toFixed(2)}`;

  const formatWeek = (w: string) => {
    try {
      const d = new Date(w);
      return d.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
    } catch {
      return w.slice(0, 10);
    }
  };

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-500 text-xs">
        <span className="animate-pulse">Cargando tendencia de precios...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
        <BarChart2 className="w-8 h-8 text-slate-700" />
        <p>Sin datos de tendencia semanal disponibles para este combustible.</p>
        <p className="text-[11px] text-slate-600">Requiere al menos una semana de registros de precios en el sistema.</p>
      </div>
    );
  }

  // Chart calculations
  const W = 700, H = 180, PX = 48, PT = 20, PB = 32;
  const innerW = W - PX * 2;
  const innerH = H - PT - PB;

  const prices = data.map((d) => d.avg_price);
  const maxP = Math.max(...prices, ...data.map((d) => d.max_price)) * 1.08;
  const minP = Math.min(...prices, ...data.map((d) => d.min_price)) * 0.93;
  const range = maxP - minP || 1;

  const getY = (p: number) => H - PB - ((p - minP) / range) * innerH;
  const getX = (i: number) =>
    data.length <= 1 ? PX + innerW / 2 : PX + (i / (data.length - 1)) * innerW;

  const pts = data.map((d, i) => ({ x: getX(i), yAvg: getY(d.avg_price), yMin: getY(d.min_price), yMax: getY(d.max_price), ...d }));

  const linePath = pts.reduce((acc, p, i) =>
    i === 0 ? `M ${p.x} ${p.yAvg}` : `${acc} L ${p.x} ${p.yAvg}`, '');

  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1].x} ${getY(minP)} L ${pts[0].x} ${getY(minP)} Z`
    : '';

  // Trend direction
  const first = prices[0] ?? 0;
  const last = prices[prices.length - 1] ?? 0;
  const trendPct = first > 0 ? ((last - first) / first) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Trend summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-[11px] text-slate-400">
          Tendencia {data.length} semanas — {FUEL_TYPE_LABELS[fuelType]}
        </span>
        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-lg border ${
          trendPct > 0
            ? 'bg-red-500/10 text-red-400 border-red-500/30'
            : trendPct < 0
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            : 'bg-slate-800 text-slate-400 border-slate-700'
        }`}>
          {trendPct > 0 ? <TrendingUp className="w-3 h-3" /> : trendPct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trendPct > 0 ? '+' : ''}{trendPct.toFixed(1)}%
        </span>
        {hoveredIndex !== null && (
          <span className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-lg font-mono">
            Semana {formatWeek(pts[hoveredIndex].week)} — Avg: {formatPrice(pts[hoveredIndex].avg_price)} | Min: {formatPrice(pts[hoveredIndex].min_price)} | Max: {formatPrice(pts[hoveredIndex].max_price)}
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-x-auto rounded-xl bg-slate-950 border border-slate-800/80 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[480px] overflow-visible">
          <defs>
            <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="fuelLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0.25, 0.5, 0.75].map((frac, i) => (
            <g key={i}>
              <line
                x1={PX} y1={PT + innerH * (1 - frac)}
                x2={W - PX} y2={PT + innerH * (1 - frac)}
                stroke="#334155" strokeDasharray="4 4" strokeOpacity="0.4"
              />
              <text
                x={PX - 4} y={PT + innerH * (1 - frac) + 4}
                fill="#64748b" fontSize="9" textAnchor="end"
              >
                {formatPrice(minP + range * frac)}
              </text>
            </g>
          ))}

          {/* Min/Max band */}
          <path
            d={`${pts.reduce((a, p, i) => i === 0 ? `M ${p.x} ${p.yMin}` : `${a} L ${p.x} ${p.yMin}`, '')} ${[...pts].reverse().reduce((a, p, i) => i === 0 ? `L ${p.x} ${p.yMax}` : `${a} L ${p.x} ${p.yMax}`, '')} Z`}
            fill="#f59e0b" fillOpacity="0.07"
          />

          {/* Avg area fill */}
          <path d={areaPath} fill="url(#fuelGrad)" />

          {/* Avg line */}
          <path d={linePath} fill="none" stroke="url(#fuelLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Points */}
          {pts.map((p, i) => (
            <g
              key={i}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <circle cx={p.x} cy={p.yAvg} r="8" fill="transparent" />
              <circle
                cx={p.x} cy={p.yAvg}
                r={hoveredIndex === i ? 5 : 3}
                fill={hoveredIndex === i ? '#fbbf24' : '#f59e0b'}
                stroke="#0f172a" strokeWidth="2"
              />
              {(i === 0 || i === Math.floor(pts.length / 2) || i === pts.length - 1) && (
                <text x={p.x} y={H - 8} fill="#64748b" fontSize="9" textAnchor="middle">
                  {formatWeek(p.week)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
