import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { CashFlowProjection } from '../../types/treasury';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Table as TableIcon,
} from 'lucide-react';

interface CashFlowForecastChartProps {
  projections: CashFlowProjection[];
  minReserveAmount: number;
  currentBalanceTotal: number;
  days: number;
  onDaysChange: (days: number) => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const CashFlowForecastChart: React.FC<CashFlowForecastChartProps> = ({
  projections,
  minReserveAmount,
  currentBalanceTotal,
  days,
  onDaysChange,
  isLoading,
  onRefresh,
}) => {
  const { accessToken } = useAuth();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<{
    date: string;
    balance: number;
    index: number;
    x: number;
    y: number;
  } | null>(null);
  const [showTable, setShowTable] = useState(false);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0,
    }).format(val);

  const handleRecalculate = async () => {
    if (!accessToken) return;
    try {
      setIsRecalculating(true);
      await api.recalculateForecast(accessToken);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Error al recalcular proyección');
    } finally {
      setIsRecalculating(false);
    }
  };

  // Calculations
  const data = projections;
  const startBalance = data.length > 0 ? data[0].projected_balance : currentBalanceTotal;
  const endBalance = data.length > 0 ? data[data.length - 1].projected_balance : currentBalanceTotal;
  const netDelta = endBalance - startBalance;

  let minBalancePoint = data.length > 0 ? data[0] : null;
  let maxBalancePoint = data.length > 0 ? data[0] : null;

  data.forEach((p) => {
    if (!minBalancePoint || p.projected_balance < minBalancePoint.projected_balance) {
      minBalancePoint = p;
    }
    if (!maxBalancePoint || p.projected_balance > maxBalancePoint.projected_balance) {
      maxBalancePoint = p;
    }
  });

  const lowestCash = minBalancePoint ? minBalancePoint.projected_balance : 0;
  const lowestDate = minBalancePoint ? minBalancePoint.projected_date : 'N/A';
  const hasDeficit = lowestCash < minReserveAmount;

  // Chart SVG bounds
  const chartWidth = 800;
  const chartHeight = 240;
  const paddingX = 40;
  const paddingTop = 30;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const allValues = [
    ...data.map((d) => d.projected_balance),
    minReserveAmount,
    0,
  ];
  const maxVal = Math.max(...allValues) * 1.15 || 100000;
  const minVal = Math.min(0, Math.min(...allValues) * 1.15);
  const valRange = maxVal - minVal || 1;

  const getY = (val: number) => {
    const norm = (val - minVal) / valRange;
    return chartHeight - paddingBottom - norm * innerHeight;
  };

  const getX = (index: number) => {
    if (data.length <= 1) return paddingX + innerWidth / 2;
    return paddingX + (index / (data.length - 1)) * innerWidth;
  };

  // Build SVG path
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d.projected_balance),
    ...d,
  }));

  const linePath = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${getY(minVal)} L ${points[0].x} ${getY(
          minVal
        )} Z`
      : '';

  const reserveY = getY(minReserveAmount);
  const zeroY = getY(0);

  return (
    <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-md space-y-6">
      {/* Header with Title, Controls & Recalculate CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-[#776de8]" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Curva de Flujo de Caja Predictivo (Forecast)
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-[#776de8]/20 text-[#bbb3ff] border border-[#776de8]/40">
              Motor Batch Diario
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Proyección continua considerando cuentas por cobrar (facturas), cuentas por pagar (gastos fijos/variables) y costos logísticos.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Days Filter */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onDaysChange(30)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                days === 30
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              30 Días
            </button>
            <button
              onClick={() => onDaysChange(60)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                days === 60
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              60 Días
            </button>
          </div>

          {/* Recalculate CTA */}
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating || isLoading}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:from-[#6b61db] hover:to-[#7f74ea] text-white font-semibold text-xs flex items-center gap-2  transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating || isLoading ? 'animate-spin' : ''}`} />
            <span>{isRecalculating ? 'Recalculando...' : 'Recalcular Flujo'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#776de8]" /> Saldo Inicial (Hoy)
          </span>
          <div className="text-base font-bold font-mono text-white mt-1">
            {formatCurrency(startBalance)}
          </div>
          <span className="text-[10px] text-slate-500">Caja consolidada en MXN</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Saldo Proyectado ({days}d)
          </span>
          <div className="text-base font-bold font-mono text-white mt-1">
            {formatCurrency(endBalance)}
          </div>
          <div className="flex items-center gap-1 text-[10px] mt-0.5">
            {netDelta >= 0 ? (
              <span className="text-emerald-400 font-semibold flex items-center">
                +{formatCurrency(netDelta)} <TrendingUp className="w-3 h-3 ml-0.5 inline" />
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center">
                {formatCurrency(netDelta)} <TrendingDown className="w-3 h-3 ml-0.5 inline" />
              </span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className={`w-3.5 h-3.5 ${hasDeficit ? 'text-red-400' : 'text-amber-400'}`} />
            Punto Más Bajo (Valle)
          </span>
          <div className={`text-base font-bold font-mono mt-1 ${lowestCash < minReserveAmount ? 'text-red-400' : 'text-slate-200'}`}>
            {formatCurrency(lowestCash)}
          </div>
          <span className="text-[10px] text-slate-500">Fecha: {lowestDate}</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Reserva Mínima Exigida
          </span>
          <div className="text-base font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(minReserveAmount)}
          </div>
          <span className="text-[10px] text-slate-500">Colchón de seguridad requerido</span>
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative overflow-hidden rounded-xl bg-slate-950 border border-slate-800/80 p-4">
        {data.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No hay proyecciones de flujo disponibles. Haz clic en "Recalcular Flujo" para generar el pronóstico.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto min-w-[650px] overflow-visible"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#776de8" stopOpacity="0.45" />
                  <stop offset="60%" stopColor="#776de8" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#776de8" stopOpacity="0.0" />
                </linearGradient>

                <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8f85f3" />
                  <stop offset="50%" stopColor="#776de8" />
                  <stop offset="100%" stopColor="#6357d6" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={getY(maxVal * 0.75)}
                x2={chartWidth - paddingX}
                y2={getY(maxVal * 0.75)}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />
              <line
                x1={paddingX}
                y1={getY(maxVal * 0.35)}
                x2={chartWidth - paddingX}
                y2={getY(maxVal * 0.35)}
                stroke="#334155"
                strokeDasharray="4 4"
                strokeOpacity="0.4"
              />

              {/* Zero baseline (if applicable) */}
              {minVal < 0 && (
                <line
                  x1={paddingX}
                  y1={zeroY}
                  x2={chartWidth - paddingX}
                  y2={zeroY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
              )}

              {/* Minimum Reserve Baseline */}
              {minReserveAmount > 0 && (
                <g>
                  <line
                    x1={paddingX}
                    y1={reserveY}
                    x2={chartWidth - paddingX}
                    y2={reserveY}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="6 3"
                    strokeOpacity="0.8"
                  />
                  <text
                    x={chartWidth - paddingX - 4}
                    y={reserveY - 6}
                    fill="#10b981"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="end"
                  >
                    Reserva de Seguridad ({formatCurrency(minReserveAmount)})
                  </text>
                </g>
              )}

              {/* Filled Area */}
              <path d={areaPath} fill="url(#curveGradient)" />

              {/* Main Curve Line */}
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineStroke)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {points.map((p, i) => {
                const isUnderReserve = p.projected_balance < minReserveAmount;
                const isDeficit = p.projected_balance < 0;

                return (
                  <g
                    key={p.id || i}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({
                        date: p.projected_date,
                        balance: p.projected_balance,
                        index: i,
                        x: p.x,
                        y: p.y,
                      })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    {/* Invisible larger hover hit area */}
                    <circle cx={p.x} cy={p.y} r="10" fill="transparent" />

                    {/* Outer glow ring for deficit or min reserve */}
                    {isUnderReserve && (
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="6"
                        fill="none"
                        stroke={isDeficit ? '#ef4444' : '#f59e0b'}
                        strokeWidth="2"
                        className="animate-ping opacity-60"
                      />
                    )}

                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={hoveredPoint?.index === i ? '6' : '3.5'}
                      fill={isDeficit ? '#ef4444' : isUnderReserve ? '#f59e0b' : '#776de8'}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />

                    {/* Date labels for key milestones */}
                    {(i === 0 || i === Math.floor(points.length / 2) || i === points.length - 1) && (
                      <text
                        x={p.x}
                        y={chartHeight - 12}
                        fill="#94a3b8"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="monospace"
                      >
                        {p.projected_date.slice(5)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none rounded-xl bg-slate-900 border border-slate-700 p-3 shadow-2xl backdrop-blur-md text-xs space-y-1 transition-transform"
            style={{
              left: `${Math.min(Math.max(hoveredPoint.x, 60), 680)}px`,
              top: `${Math.max(hoveredPoint.y - 80, 10)}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="font-mono font-semibold text-slate-400 text-[10px]">
              Fecha: {hoveredPoint.date} (Día +{hoveredPoint.index + 1})
            </div>
            <div className="text-sm font-bold font-mono text-white">
              {formatCurrency(hoveredPoint.balance)}
            </div>
            <div className="text-[10px]">
              {hoveredPoint.balance < 0 ? (
                <span className="text-red-400 font-semibold"> Déficit de liquidez negativo</span>
              ) : hoveredPoint.balance < minReserveAmount ? (
                <span className="text-amber-400 font-semibold"> Por debajo de reserva mínima</span>
              ) : (
                <span className="text-emerald-400 font-semibold"> Saldo seguro y solvente</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Daily Breakdown Table */}
      <div className="border-t border-slate-800 pt-4">
        <button
          onClick={() => setShowTable(!showTable)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-850 transition cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-[#776de8]" />
            <span>Detalle Diario de Proyección ({data.length} días)</span>
          </div>
          {showTable ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTable && (
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Día</th>
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5 text-right">Saldo Proyectado</th>
                  <th className="px-4 py-2.5 text-right">Margen vs Reserva</th>
                  <th className="px-4 py-2.5 text-center">Estado de Solvencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.map((p, idx) => {
                  const margin = p.projected_balance - minReserveAmount;
                  const isDeficit = p.projected_balance < 0;
                  const isUnderReserve = p.projected_balance < minReserveAmount;

                  return (
                    <tr key={p.id || idx} className="hover:bg-slate-900/40">
                      <td className="px-4 py-2 text-slate-400">+{idx + 1}</td>
                      <td className="px-4 py-2 text-white font-medium">{p.projected_date}</td>
                      <td
                        className={`px-4 py-2 text-right font-bold ${
                          isDeficit ? 'text-red-400' : isUnderReserve ? 'text-amber-400' : 'text-slate-200'
                        }`}
                      >
                        {formatCurrency(p.projected_balance)}
                      </td>
                      <td
                        className={`px-4 py-2 text-right ${
                          margin >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {margin >= 0 ? `+${formatCurrency(margin)}` : formatCurrency(margin)}
                      </td>
                      <td className="px-4 py-2 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isDeficit
                              ? 'bg-red-500/20 text-red-300 border-red-500/40'
                              : isUnderReserve
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {isDeficit ? 'Déficit' : isUnderReserve ? 'Alerta Reserva' : 'Saludable'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
