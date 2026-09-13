import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import type { Vehicle, Route, Client, Contract } from '../../types/company';
import type { PreTripProjectionResponse, Trip } from '../../types/logistics';
import {
  Calculator,
  Fuel,
  AlertTriangle,
  CheckCircle,
  Truck,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';

interface PreTripSchedulerModalProps {
  onClose: () => void;
  onTripCreated: (trip: Trip) => void;
}

// ── Velocidades promedio por modo (km/h) ──
const AVG_SPEED: Record<string, number> = {
  truck: 65,   // terrestre (con paradas)
  ship: 22,    // marítimo (nudos ≈ 40 km/h pero con escalas)
  plane: 750,  // aéreo
};

// ── Tarifa base de flete por modo: USD / (ton·km) ──
const FREIGHT_RATE: Record<string, number> = {
  truck: 0.085,   // ~$85 por ton·1000km
  ship: 0.018,    // marítimo muy barato por ton·km
  plane: 0.65,    // aéreo caro
};

/**
 * Calcula la fecha estimada de llegada dado:
 * - departureDate (ISO string datetime-local)
 * - distancia_km
 * - vehicleType
 */
function calcArrival(departureDate: string, distanceKm: number, vehicleType: string): string {
  if (!departureDate || !distanceKm || !vehicleType) return '';
  const speed = AVG_SPEED[vehicleType] ?? 65;
  const hoursNeeded = distanceKm / speed;
  // Agrega 20% de overhead logístico (carga/descarga, aduanas)
  const totalHours = hoursNeeded * 1.2;
  const dep = new Date(departureDate);
  dep.setTime(dep.getTime() + totalHours * 60 * 60 * 1000);
  return dep.toISOString().slice(0, 16);
}

/**
 * Calcula el flete sugerido dado:
 * - distancia_km, cargoWeightTons, vehicleType, currency
 */
function calcFreight(distanceKm: number, tons: number, vehicleType: string, currency: string): number {
  const rate = FREIGHT_RATE[vehicleType] ?? 0.085;
  let usdPrice = rate * tons * distanceKm;
  // Mínimos por modo
  const minPrice = vehicleType === 'plane' ? 800 : vehicleType === 'ship' ? 1200 : 350;
  usdPrice = Math.max(usdPrice, minPrice);
  // Redondear al múltiplo de 50 más cercano
  usdPrice = Math.round(usdPrice / 50) * 50;
  // Conversión aproximada si MXN
  return currency === 'MXN' ? Math.round((usdPrice * 17.5) / 50) * 50 : usdPrice;
}

/**
 * Formatea horas en "X días Y horas"
 */
function formatDuration(departureDate: string, arrivalDate: string): string {
  if (!departureDate || !arrivalDate) return '';
  const diffMs = new Date(arrivalDate).getTime() - new Date(departureDate).getTime();
  const totalHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.round(totalHours % 24);
  if (days === 0) return `${hours}h`;
  return `${days}d ${hours}h`;
}

export const PreTripSchedulerModal: React.FC<PreTripSchedulerModalProps> = ({
  onClose,
  onTripCreated,
}) => {
  const { accessToken } = useAuth();

  // Catalogs
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [clientId, setClientId] = useState('');
  const [contractId, setContractId] = useState('');
  const [trackingCode, setTrackingCode] = useState(() => `TRIP-${Date.now().toString().slice(-5)}`);
  const [cargoType, setCargoType] = useState('Contenedores Dry Standard');
  const [cargoWeightTons, setCargoWeightTons] = useState<number>(22.5);
  const [currency, setCurrency] = useState('USD');

  // ── Fechas: salida manual, llegada AUTO-calculada ──
  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [estimatedArrivalDate, setEstimatedArrivalDate] = useState('');
  const [arrivalLocked, setArrivalLocked] = useState(false); // true si el usuario editó manualmente

  // ── Flete AUTO-calculado pero editable ──
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [priceLocked, setPriceLocked] = useState(false); // true si el usuario editó manualmente

  // Projection state
  const [projection, setProjection] = useState<PreTripProjectionResponse | null>(null);
  const [calculatingProjection, setCalculatingProjection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const selectedRoute = routes.find((r) => r.id === routeId);

  // ── Load catalogs on mount ──
  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      try {
        setLoadingCatalogs(true);
        const [vList, rList, cList, ctList] = await Promise.all([
          api.listVehicles(accessToken),
          api.listRoutes(accessToken),
          api.listClients(accessToken),
          api.listContracts(accessToken),
        ]);
        setVehicles(vList);
        setRoutes(rList);
        setClients(cList);
        setContracts(ctList);

        if (vList.length > 0) setVehicleId(vList[0].id);
        if (rList.length > 0) setRouteId(rList[0].id);
        if (cList.length > 0) setClientId(cList[0].id);
      } catch (err: any) {
        setError('Error al cargar catálogos: ' + (err.message || 'Error de conexión'));
      } finally {
        setLoadingCatalogs(false);
      }
    };
    load();
  }, [accessToken]);

  // ── Recalcular llegada y flete cuando cambian ruta / vehículo / fecha salida / toneladas ──
  const recalculate = useCallback(() => {
    if (!selectedVehicle || !selectedRoute) return;

    const distKm = selectedRoute.distance_km || 350;

    // Fecha llegada (solo si el usuario no la bloqueó)
    if (!arrivalLocked) {
      const arrival = calcArrival(departureDate, distKm, selectedVehicle.type);
      setEstimatedArrivalDate(arrival);
    }

    // Flete (solo si el usuario no lo bloqueó)
    if (!priceLocked) {
      const freight = calcFreight(distKm, cargoWeightTons, selectedVehicle.type, currency);
      setAgreedPrice(freight);
    }
  }, [selectedVehicle, selectedRoute, departureDate, cargoWeightTons, currency, arrivalLocked, priceLocked]);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  // ── Calcular proyección financiera via API ──
  const runProjection = useCallback(async () => {
    if (!accessToken || !selectedVehicle || !selectedRoute) return;
    try {
      setCalculatingProjection(true);
      setError(null);
      const res = await api.calculateTripProjection(accessToken, {
        vehicle_type: selectedVehicle.type,
        route_id: selectedRoute.id,
        distance_km: selectedRoute.distance_km || 350,
        cargo_weight_tons: cargoWeightTons,
        agreed_price: agreedPrice || 1,
        currency,
      });
      setProjection(res);
    } catch (err: any) {
      setError(err.message || 'No se pudo calcular la proyección');
    } finally {
      setCalculatingProjection(false);
    }
  }, [accessToken, selectedVehicle, selectedRoute, cargoWeightTons, agreedPrice, currency]);

  useEffect(() => {
    if (selectedVehicle && selectedRoute && agreedPrice > 0) {
      runProjection();
    }
  }, [vehicleId, routeId, cargoWeightTons, agreedPrice, currency]);

  const handleConfirmAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!vehicleId || !routeId || !clientId) {
      setError('Por favor selecciona vehículo, ruta y cliente.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const created = await api.createTrip(accessToken, {
        vehicle_id: vehicleId,
        route_id: routeId,
        client_id: clientId,
        contract_id: contractId || null,
        tracking_code: trackingCode,
        cargo_type: cargoType,
        cargo_weight_tons: Number(cargoWeightTons),
        departure_date: departureDate,
        estimated_arrival_date: estimatedArrivalDate,
        agreed_freight_price: Number(agreedPrice),
        currency,
        fuel_surcharge_amount: projection ? projection.estimated_fuel_cost * 0.15 : 180,
        contingency_budget: projection ? projection.suggested_contingency : 250,
      });

      onTripCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al programar el viaje');
    } finally {
      setSubmitting(false);
    }
  };

  const distKm = selectedRoute?.distance_km || 0;
  const tripDuration = formatDuration(departureDate, estimatedArrivalDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl my-8 text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#776de8] to-[#bbb3ff] flex items-center justify-center shadow-lg shadow-[#776de8]/20">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Agendar Viaje &amp; Análisis Financiero Pre-Ruta
              </h2>
              <p className="text-xs text-slate-400">
                Fechas y flete se calculan automáticamente por ruta, modo y tonelaje
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loadingCatalogs ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#776de8] mb-2" />
            <p className="text-xs">Cargando flotas, rutas y clientes de tu empresa...</p>
          </div>
        ) : (
          <form onSubmit={handleConfirmAndStart} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Configuration Form */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#776de8]" />
                  1. Configuración del Activo y Trayecto
                </h3>

                {/* Vehículo */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vehículo / Modo de Transporte
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => { setVehicleId(e.target.value); setArrivalLocked(false); setPriceLocked(false); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                    required
                  >
                    {vehicles.length === 0 ? (
                      <option value="">⚠️ Sin vehículos registrados</option>
                    ) : (
                      vehicles.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.type === 'truck' ? '🚛 Terrestre' : v.type === 'ship' ? '🚢 Marítimo' : '✈️ Aéreo'} — {v.identifier || v.id}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Ruta */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Ruta Origen ➔ Destino
                  </label>
                  <select
                    value={routeId}
                    onChange={(e) => { setRouteId(e.target.value); setArrivalLocked(false); setPriceLocked(false); }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                    required
                  >
                    {routes.length === 0 ? (
                      <option value="">⚠️ Sin rutas registradas</option>
                    ) : (
                      routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.origin} ➔ {r.destination} ({r.distance_km || 0} km)
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Cliente / Contrato */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Cliente Asignado
                    </label>
                    <select
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                      required
                    >
                      {clients.length === 0 ? (
                        <option value="">⚠️ Sin clientes registrados</option>
                      ) : (
                        clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Contrato Marco (Opcional)
                    </label>
                    <select
                      value={contractId}
                      onChange={(e) => setContractId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                    >
                      <option value="">Sin contrato directo</option>
                      {contracts
                        .filter((ct) => !clientId || ct.client_id === clientId)
                        .map((ct) => (
                          <option key={ct.id} value={ct.id}>{ct.reference || ct.id}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Fecha salida (manual) + Fecha llegada (auto) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      📅 Salida Programada <span className="text-slate-500">(manual)</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={departureDate}
                      onChange={(e) => { setDepartureDate(e.target.value); setArrivalLocked(false); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Llegada Estimada
                      {arrivalLocked ? (
                        <span className="text-amber-400 text-[9px] font-bold">· editada</span>
                      ) : (
                        <span className="text-emerald-400 text-[9px] font-bold">· auto</span>
                      )}
                    </label>
                    <input
                      type="datetime-local"
                      value={estimatedArrivalDate}
                      onChange={(e) => { setEstimatedArrivalDate(e.target.value); setArrivalLocked(true); }}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none ${arrivalLocked ? 'border-amber-600 focus:border-amber-400' : 'border-emerald-700 focus:border-emerald-400'}`}
                      required
                    />
                  </div>
                </div>

                {/* Duración estimada del viaje */}
                {tripDuration && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/60">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-300">
                      Duración estimada del trayecto:{' '}
                      <span className="font-bold text-cyan-300">{tripDuration}</span>
                      {distKm > 0 && (
                        <span className="text-slate-400 ml-1">
                          ({distKm} km · {selectedVehicle?.type === 'truck' ? '65' : selectedVehicle?.type === 'ship' ? '22' : '750'} km/h avg)
                        </span>
                      )}
                    </span>
                    {!arrivalLocked && (
                      <button
                        type="button"
                        onClick={() => setArrivalLocked(false)}
                        className="ml-auto text-[10px] text-emerald-400 hover:text-emerald-300"
                        title="Recalcular desde ruta"
                      >
                        ↺ Recalc
                      </button>
                    )}
                  </div>
                )}

                {/* Moneda + Código */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Moneda</label>
                    <select
                      value={currency}
                      onChange={(e) => { setCurrency(e.target.value); setPriceLocked(false); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="MXN">MXN ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Código de Rastreo</label>
                    <input
                      type="text"
                      value={trackingCode}
                      onChange={(e) => setTrackingCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                      required
                    />
                  </div>
                </div>

                {/* Peso + Flete */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Peso Carga (Toneladas)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={cargoWeightTons}
                      onChange={(e) => { setCargoWeightTons(Number(e.target.value)); setPriceLocked(false); }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      Flete Cobrado ({currency})
                      {priceLocked ? (
                        <span className="text-amber-400 text-[9px] font-bold">· editado</span>
                      ) : (
                        <span className="text-emerald-400 text-[9px] font-bold">· auto</span>
                      )}
                    </label>
                    <input
                      type="number"
                      step="50"
                      value={agreedPrice}
                      onChange={(e) => { setAgreedPrice(Number(e.target.value)); setPriceLocked(true); }}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none ${priceLocked ? 'border-amber-600 text-amber-300 focus:border-amber-400' : 'border-emerald-700 text-emerald-400 focus:border-emerald-400'}`}
                      required
                    />
                    {priceLocked && (
                      <button
                        type="button"
                        onClick={() => setPriceLocked(false)}
                        className="text-[10px] text-slate-400 hover:text-emerald-400 mt-0.5"
                      >
                        ↺ Restaurar cálculo automático
                      </button>
                    )}
                  </div>
                </div>

                {/* Tipo de carga */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Descripción / Tipo de Carga
                  </label>
                  <input
                    type="text"
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#776de8]"
                  />
                </div>
              </div>

              {/* Right Column: Pre-Trip Financial Projection Engine */}
              <div className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Fuel className="w-4 h-4 text-emerald-400" />
                      2. Estimación de Combustible &amp; Riesgos
                    </h3>
                    {calculatingProjection && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin text-[#776de8]" />
                        Consultando API Índices...
                      </span>
                    )}
                  </div>

                  {projection ? (
                    <div className="space-y-3">
                      {/* Fuel Box */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Tipo Combustible Requerido:</span>
                          <span className="font-semibold text-sky-400 uppercase">
                            {projection.fuel_type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Precio Actual Mercado ({projection.fuel_source}):</span>
                          <span className="font-bold text-white">
                            ${projection.current_fuel_price.toFixed(2)} / {projection.fuel_unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                          <span className="text-slate-400">Costo de Combustible Estimado:</span>
                          <span className="font-bold text-amber-400">
                            ${projection.estimated_fuel_cost.toLocaleString()} {currency}
                          </span>
                        </div>
                      </div>

                      {/* Contingency & Risk */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Riesgo Histórico de Ruta:</span>
                          <span className="font-semibold text-purple-300">
                            Índice {projection.risk_score} (Retraso prom: {projection.average_delay_hours}h)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Contingencia Sugerida:</span>
                          <span className="font-bold text-slate-200">
                            ${projection.suggested_contingency.toLocaleString()} {currency}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Exposición Máxima a Pérdida:</span>
                          <span className="font-bold text-red-400">
                            ${projection.potential_loss_risk.toLocaleString()} {currency}
                          </span>
                        </div>
                      </div>

                      {/* Net Margin */}
                      <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-emerald-300">
                            Margen Neto Proyectado:
                          </span>
                          <span className="text-lg font-extrabold text-emerald-400">
                            ${projection.projected_net_margin.toLocaleString()} {currency} ({projection.projected_margin_pct.toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">
                          💡 {projection.recommendation}
                        </p>
                      </div>

                      {/* Resumen rápido de cálculo automático */}
                      <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-[10px] text-slate-400 space-y-1">
                        <p className="font-semibold text-slate-300 text-xs">Parámetros del Cálculo Automático</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          <span>Distancia:</span><span className="text-slate-200 font-mono">{distKm} km</span>
                          <span>Carga:</span><span className="text-slate-200 font-mono">{cargoWeightTons} ton</span>
                          <span>Velocidad:</span><span className="text-slate-200 font-mono">{AVG_SPEED[selectedVehicle?.type ?? 'truck']} km/h</span>
                          <span>Tarifa base:</span><span className="text-slate-200 font-mono">${FREIGHT_RATE[selectedVehicle?.type ?? 'truck']} /ton·km</span>
                          <span>Tránsito:</span><span className="text-cyan-300 font-mono font-bold">{tripDuration}</span>
                          <span>Flete calc.:</span><span className="text-emerald-300 font-mono font-bold">{agreedPrice.toLocaleString()} {currency}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center text-slate-400 text-xs">
                      Selecciona una ruta y vehículo para calcular el costo proyectado en tiempo real.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !estimatedArrivalDate || agreedPrice <= 0}
                    className="w-2/3 py-2.5 bg-gradient-to-r from-[#776de8] to-[#8f85f3] hover:from-[#6b60e6] hover:to-[#8276f1] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#776de8]/30 transition cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Confirmando Viaje...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Confirmar &amp; Desplegar en Radar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
