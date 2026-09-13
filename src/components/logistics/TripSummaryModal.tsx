import React from 'react';
import type { Trip } from '../../types/logistics';
import {
  X,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  FileSpreadsheet,
  Printer,
  Scale,
} from 'lucide-react';

interface TripSummaryModalProps {
  trip: Trip;
  onClose: () => void;
}

export const TripSummaryModal: React.FC<TripSummaryModalProps> = ({ trip, onClose }) => {
  // Financial metrics calculation
  const revenue = Number(trip.agreed_freight_price || 0) + Number(trip.fuel_surcharge_amount || 0);
  const fuelCost = Number(trip.estimated_fuel_cost || 0);
  
  // Realistically apportion tolls, operator per-diem and maintenance based on distance & rate
  const distanceKm = trip.route_distance_km || 250;
  const tollsCost = Math.round(distanceKm * 0.18);
  const operatorPerDiem = Math.round((trip.agreed_freight_price * 0.12) || 120);
  const maintenanceWear = Math.round(distanceKm * 0.08);

  const totalExpenses = fuelCost + tollsCost + operatorPerDiem + maintenanceWear;

  // Losses calculation (penalties, customs fines, delays, blockades at checkpoints/tollbooths)
  const hadFriction = trip.is_stuck || Boolean(trip.stuck_reason) || Number(trip.estimated_loss_risk || 0) > 0;
  const losses = Math.round(Number(trip.estimated_loss_risk || (hadFriction ? 350 : 0)));

  // Net Profit & Margin:
  // FÓRMULA DE LIQUIDACIÓN:
  // Utilidad Neta = Cobro Total - Gastos Operativos (incluyendo diésel en ralentí) - Pérdidas (tiempo perdido en retenes)
  const netProfit = revenue - totalExpenses - losses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const vehicleEmoji =
    trip.vehicle_type === 'ship' ? '🚢' : trip.vehicle_type === 'plane' ? '✈️' : '🚛';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden my-6 text-gray-100">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-800 flex items-center justify-between bg-gray-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-tight">
                  Liquidación de Viaje Concluido
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3" />
                  Cerrado / POD
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Folio: {trip.tracking_code} • {vehicleEmoji} {trip.vehicle_identifier || trip.vehicle_type?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Overview specs banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs">
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-mono">Cliente</span>
              <span className="font-semibold text-gray-200">{trip.client_name || 'Particular'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-mono">Ruta ({distanceKm} km)</span>
              <span className="font-semibold text-gray-200 truncate block">
                {trip.route_origin} &rarr; {trip.route_destination}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-mono">Carga Transportada</span>
              <span className="font-semibold text-gray-200">
                {trip.cargo_type} ({trip.cargo_weight_tons} ton)
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] uppercase font-mono">Progreso Final</span>
              <span className="font-bold text-emerald-400 font-mono">100% Completado</span>
            </div>
          </div>

          {/* Key Financial KPIs (Costos, Gastos, Pérdidas, Margen) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
            {/* 1. Costo / Ingreso Facturado */}
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Cobro Total (Flete)</span>
                <DollarSign className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-blue-400 font-mono">
                ${revenue.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Flete pactado + fuel surcharge
              </p>
            </div>

            {/* 2. Gastos Operativos */}
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Gastos Operativos</span>
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-amber-400 font-mono">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Diesel, peajes y viáticos
              </p>
            </div>

            {/* 3. Pérdidas y Retrasos */}
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Pérdidas / Fricción</span>
                <AlertTriangle className={`w-3.5 h-3.5 ${losses > 0 ? 'text-red-400' : 'text-gray-600'}`} />
              </div>
              <div className={`text-lg font-bold font-mono ${losses > 0 ? 'text-red-400' : 'text-gray-400'}`}>
                ${losses.toLocaleString()}
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                {losses > 0 ? 'Demoras o penalización' : 'Sin penalizaciones'}
              </p>
            </div>

            {/* 4. Utilidad Neta Final */}
            <div className="p-4 bg-gray-950 border border-gray-800 rounded-xl">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Margen Líquido</span>
                <Scale className={`w-3.5 h-3.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
              <div className={`text-lg font-bold font-mono ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${netProfit.toLocaleString()}
              </div>
              <p className="text-[10px] text-emerald-500 font-medium mt-1">
                {profitMargin.toFixed(1)}% de rentabilidad
              </p>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Breakdown: Gastos Incurridos */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-xs space-y-3">
              <h4 className="font-semibold text-gray-200 flex items-center justify-between border-b border-gray-800 pb-2">
                <span>Desglose de Gastos Operativos</span>
                <span className="font-mono text-amber-400 font-bold">${totalExpenses.toLocaleString()}</span>
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-gray-300 block">Combustible Consumido:</span>
                    <span className="text-[10px] text-gray-500">Incluye ralentí en retenes, casetas y paradas</span>
                  </div>
                  <span className="font-mono text-amber-400 font-medium">${fuelCost.toLocaleString()} {trip.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Peajes y Casetas de Autopista:</span>
                  <span className="font-mono text-gray-200 font-medium">${tollsCost.toLocaleString()} {trip.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Viáticos y Horas Operador:</span>
                  <span className="font-mono text-gray-200 font-medium">${operatorPerDiem.toLocaleString()} {trip.currency}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Desgaste y Mantenimiento:</span>
                  <span className="font-mono text-gray-200 font-medium">${maintenanceWear.toLocaleString()} {trip.currency}</span>
                </div>
              </div>
            </div>

            {/* Breakdown: Fricciones y Pérdidas */}
            <div className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 text-xs space-y-3">
              <h4 className="font-semibold text-gray-200 flex items-center justify-between border-b border-gray-800 pb-2">
                <span>Auditoría de Pérdidas y Tiempo Perdido</span>
                <span className={`font-mono font-bold ${losses > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  ${losses.toLocaleString()}
                </span>
              </h4>
              <div className="space-y-2">
                {hadFriction ? (
                  <>
                    <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/50 space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-red-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                        <span>Fricción Operativa Registrada</span>
                      </div>
                      <p className="text-[11px] text-red-200/90 leading-relaxed">
                        {trip.stuck_reason || 'Retraso por retén militar, caseta de cobro o retención aduanal.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-gray-300 block">Pérdida por Tiempo y Penalización:</span>
                        <span className="text-[10px] text-gray-500">Demoras de entrega, custodia y sobrecostos</span>
                      </div>
                      <span className="font-mono text-red-400 font-medium">${losses.toLocaleString()} {trip.currency}</span>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ruta Concluida sin Bloqueos</span>
                    </div>
                    <p className="text-[11px] text-emerald-400/80">
                      La carga no sufrió retenciones en retenes ni casetas; sin penalizaciones económicas.
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between text-gray-400 pt-1 border-t border-gray-800">
                  <span>Presupuesto Contingencia Original:</span>
                  <span className="font-mono text-gray-300">${trip.contingency_budget?.toLocaleString()} {trip.currency}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Explicit Deductions Equation Box */}
          <div className="p-3.5 rounded-xl bg-gray-950 border border-gray-800 space-y-2 text-xs">
            <div className="flex items-center justify-between font-mono text-[11px] text-gray-400 border-b border-gray-800/80 pb-2">
              <span>Ecuación Contable:</span>
              <span className="text-gray-300">
                Cobro Total (${revenue.toLocaleString()}) - Gastos Operativos (${totalExpenses.toLocaleString()}) - Pérdidas (${losses.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-300">
                <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  {profitMargin >= 20
                    ? 'Operación de Alta Rentabilidad: Absorbió completamente el combustible y las demoras.'
                    : profitMargin > 0
                    ? 'Operación Rentable: Margen neto positivo tras deducir gasolina y tiempo perdido.'
                    : 'Operación con Pérdida: Las demoras y sobreconsumos de gasolina excedieron el flete.'}
                </span>
              </div>
              <div className="text-right pl-4 shrink-0">
                <span className="text-[10px] text-gray-500 uppercase font-mono block">Utilidad Líquida</span>
                <span className={`font-mono font-bold text-sm ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ${netProfit.toLocaleString()} {trip.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-800 flex items-center justify-between bg-gray-950/60">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Resumen</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition cursor-pointer shadow-xs"
          >
            Cerrar Liquidación
          </button>
        </div>
      </div>
    </div>
  );
};
