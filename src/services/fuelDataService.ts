import type {
  FuelType,
  FuelIndex,
  FuelWeeklyTrend,
  TripFuelLog,
  SurchargeRule,
  MarginImpact,
  SimulateMarginImpactResponse,
  CreateTripFuelLogPayload,
  CreateSurchargeRulePayload,
  UpdateSurchargeRulePayload,
} from '../types/fuel';
import type { Trip } from '../types/logistics';
import type { Route } from '../types/company';

// In-memory / session store to persist user-created records during the session
let customLogs: TripFuelLog[] = [];
let customRules: SurchargeRule[] = [];
let customIndexes: FuelIndex[] = [];

/**
 * Base pricing references for Mexican and North American corridors
 */
const BASE_PRICES: Record<FuelType, { base: number; unit: string; source: string; regions: { name: string; offset: number }[] }> = {
  diesel: {
    base: 24.65,
    unit: 'liter',
    source: 'Comisión Reguladora de Energía (CRE)',
    regions: [
      { name: 'México - Noreste (Monterrey / Nuevo Laredo)', offset: 0.12 },
      { name: 'México - Centro (CDMX / Querétaro / Bajío)', offset: 0.28 },
      { name: 'México - Occidente (Guadalajara / Colima)', offset: 0.35 },
      { name: 'México - Golfo (Veracruz / Altamira)', offset: -0.22 },
      { name: 'México - Noroeste (Tijuana / Mexicali)', offset: 0.05 },
      { name: 'Frontera Norte (Corredor Laredo / Texas)', offset: -0.45 },
    ],
  },
  bunker_c: {
    base: 645.0,
    unit: 'metric_ton',
    source: 'Platts Bunkerwire',
    regions: [
      { name: 'Puerto Manzanillo (Pacífico)', offset: 8.5 },
      { name: 'Puerto Lázaro Cárdenas', offset: 12.0 },
      { name: 'Puerto Altamira (Golfo)', offset: -6.2 },
      { name: 'Puerto Veracruz', offset: -3.8 },
    ],
  },
  marine_gasoil: {
    base: 865.0,
    unit: 'metric_ton',
    source: 'Bunker Index',
    regions: [
      { name: 'Terminal Manzanillo', offset: 14.0 },
      { name: 'Terminal Altamira', offset: -9.5 },
      { name: 'Terminal Veracruz', offset: -4.0 },
      { name: 'Terminal Ensenada', offset: 18.0 },
    ],
  },
  jet_a1: {
    base: 15.10,
    unit: 'liter',
    source: 'ASA Combustibles',
    regions: [
      { name: 'Hub Central (AICM / AIFA)', offset: -0.25 },
      { name: 'Hub Norte (Aeropuerto Monterrey MTY)', offset: 0.18 },
      { name: 'Hub Occidente (Aeropuerto Guadalajara GDL)', offset: 0.06 },
      { name: 'Hub Sureste (Aeropuerto Cancún CUN)', offset: 0.32 },
    ],
  },
};

/**
 * Generates fluctuating fuel indexes matching real geographical corridors
 */
export function getFluctuatingFuelIndexes(fuelType: FuelType, filterRegion?: string): FuelIndex[] {
  const meta = BASE_PRICES[fuelType];
  const now = new Date();
  
  // Seed random with today's date for consistent daily fluctuation
  const daySeed = now.getDate() + now.getMonth() * 31;
  const jitter = Math.sin(daySeed * 0.7) * (fuelType === 'diesel' || fuelType === 'jet_a1' ? 0.35 : 12.0);

  const results: FuelIndex[] = meta.regions
    .filter((r) => !filterRegion || r.name.toLowerCase().includes(filterRegion.toLowerCase()))
    .map((r, i) => {
      const price = Number((meta.base + r.offset + jitter + (i % 2 === 0 ? 0.08 : -0.06)).toFixed(2));
      const recordDate = new Date(now.getTime() - i * 3600 * 1000 * 4);

      return {
        id: `idx-${fuelType}-${i}-${daySeed}`,
        fuel_type: fuelType,
        region: r.name,
        price_per_unit: price,
        unit_of_measure: meta.unit,
        recorded_at: recordDate.toISOString(),
        source: meta.source,
      };
    });

  // Prepend user-created indexes if applicable
  const userFiltered = customIndexes.filter(
    (ci) => ci.fuel_type === fuelType && (!filterRegion || ci.region.toLowerCase().includes(filterRegion.toLowerCase()))
  );

  return [...userFiltered, ...results];
}

/**
 * Generates historical weekly trends (12 weeks) showing realistic price movements
 */
export function getFuelWeeklyTrend(fuelType: FuelType, limit = 12): FuelWeeklyTrend[] {
  const meta = BASE_PRICES[fuelType];
  const trends: FuelWeeklyTrend[] = [];
  const now = new Date();

  // Generate 12 historical weeks with realistic market curve
  for (let w = limit - 1; w >= 0; w--) {
    const weekDate = new Date(now.getTime() - w * 7 * 24 * 3600 * 1000);
    // Sine wave + slight upward inflation slope
    const marketFactor = Math.sin(w * 0.55) * (fuelType === 'diesel' ? 0.65 : 18.0) + (limit - w) * (fuelType === 'diesel' ? 0.08 : 2.5);
    const avgPrice = Number((meta.base - (limit / 2) * (fuelType === 'diesel' ? 0.08 : 2.5) + marketFactor).toFixed(2));
    const spread = fuelType === 'diesel' ? 0.45 : 14.0;
    const minPrice = Number((avgPrice - spread).toFixed(2));
    const maxPrice = Number((avgPrice + spread).toFixed(2));

    trends.push({
      week: weekDate.toISOString(),
      fuel_type: fuelType,
      region: meta.regions[0].name,
      avg_price: avgPrice,
      min_price: minPrice,
      max_price: maxPrice,
      sample_count: 28,
    });
  }

  return trends;
}

/**
 * Correlates existing trips from the app with realistic fuel purchase logs
 */
export function getTripFuelLogs(trips: Trip[]): TripFuelLog[] {
  if (!trips || trips.length === 0) {
    return [...customLogs];
  }

  const generatedLogs: TripFuelLog[] = trips.map((trip, idx) => {
    const isTruck = trip.vehicle_type === 'truck' || !trip.vehicle_type;
    const isShip = trip.vehicle_type === 'ship';
    const fuelType: FuelType = isShip ? 'bunker_c' : trip.vehicle_type === 'plane' ? 'jet_a1' : 'diesel';
    
    // Calculate realistic volume based on estimated fuel cost or distance
    const distKm = trip.route_distance_km || 240;
    const costPerUnit = isTruck ? 24.85 : isShip ? 648.0 : 15.2;
    const volume = isTruck ? Math.round(distKm * 0.38 + 50) : isShip ? 18 : 650;
    const totalCost = Math.round(Number(trip.estimated_fuel_cost || volume * costPerUnit));

    return {
      id: `log-trip-${trip.id.slice(0, 8)}-${idx}`,
      company_id: trip.company_id || 'comp-default',
      trip_id: trip.id,
      fuel_type: fuelType,
      volume_purchased: volume,
      cost_per_unit: costPerUnit,
      total_cost: totalCost,
      odometer_or_hours: Math.round(145000 + idx * 2400 + distKm),
      purchased_at: trip.departure_date || new Date(Date.now() - idx * 86400000).toISOString(),
      created_at: trip.created_at || new Date().toISOString(),
      updated_at: trip.updated_at || new Date().toISOString(),
    };
  });

  return [...customLogs, ...generatedLogs];
}

/**
 * Pre-configured and calculated Surcharge Rules (BAF)
 */
export function getSurchargeRules(): SurchargeRule[] {
  const defaults: SurchargeRule[] = [
    {
      id: 'rule-baf-diesel-ne',
      company_id: 'comp-default',
      fuel_type: 'diesel',
      region: 'México - Noreste (Monterrey / Nuevo Laredo)',
      baseline_price: 23.50,
      threshold_percentage: 4.0,
      pass_through_rate: 80.0,
      is_active: true,
      price_variation_percentage: 5.74,
      suggested_surcharge_percentage: 4.59,
      last_calculated_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rule-baf-diesel-occ',
      company_id: 'comp-default',
      fuel_type: 'diesel',
      region: 'México - Occidente (Guadalajara / Colima)',
      baseline_price: 23.80,
      threshold_percentage: 5.0,
      pass_through_rate: 75.0,
      is_active: true,
      price_variation_percentage: 5.55,
      suggested_surcharge_percentage: 4.16,
      last_calculated_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rule-baf-bunker-pac',
      company_id: 'comp-default',
      fuel_type: 'bunker_c',
      region: 'Puerto Manzanillo (Pacífico)',
      baseline_price: 610.0,
      threshold_percentage: 5.0,
      pass_through_rate: 85.0,
      is_active: true,
      price_variation_percentage: 6.31,
      suggested_surcharge_percentage: 5.36,
      last_calculated_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 40 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rule-baf-jet-central',
      company_id: 'comp-default',
      fuel_type: 'jet_a1',
      region: 'Hub Central (AICM / AIFA)',
      baseline_price: 14.20,
      threshold_percentage: 5.0,
      pass_through_rate: 90.0,
      is_active: true,
      price_variation_percentage: 6.34,
      suggested_surcharge_percentage: 5.70,
      last_calculated_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  return [...customRules, ...defaults];
}

/**
 * Calculates margin impact for the active company routes
 */
export function getMarginImpacts(routes: Route[]): MarginImpact[] {
  const defaultRoutes = [
    { id: 'route-mty-lar', origin: 'Monterrey, NL', destination: 'Nuevo Laredo, Tamps', distance_km: 220 },
    { id: 'route-mzn-gdl', origin: 'Puerto Manzanillo, Col', destination: 'Guadalajara, Jal', distance_km: 295 },
    { id: 'route-qro-cdmx', origin: 'Querétaro, Qro', destination: 'CDMX Centro', distance_km: 215 },
    { id: 'route-alt-mty', origin: 'Altamira, Tamps', destination: 'Monterrey, NL', distance_km: 480 },
  ];

  const activeRoutes = routes && routes.length > 0 ? routes : (defaultRoutes as unknown as Route[]);

  return activeRoutes.map((r, i) => {
    const dist = r.distance_km || 240;
    const baseline = Math.round(dist * 0.38 * 23.50); // Litros x Precio base
    const current = Math.round(dist * 0.38 * 24.85);  // Litros x Precio fluctuante actual
    const impactPct = Number((((current - baseline) / baseline) * 100).toFixed(2));

    return {
      id: `impact-${r.id || i}`,
      company_id: r.company_id || 'comp-default',
      route_id: r.id || `route-sim-${i}`,
      fuel_type: 'diesel' as FuelType,
      baseline_fuel_cost: baseline,
      current_fuel_cost: current,
      margin_impact_percentage: impactPct,
      calculated_at: new Date().toISOString(),
      route_origin: r.origin,
      route_destination: r.destination,
    };
  });
}

/**
 * Simulates margin impact with custom parameters
 */
export function simulateMarginImpact(
  routeId: string,
  routes: Route[],
  fuelType: FuelType,
  priceVariationPct: number
): SimulateMarginImpactResponse {
  const route = routes.find((r) => r.id === routeId);
  const dist = route?.distance_km || 250;
  const meta = BASE_PRICES[fuelType];
  const baselineCost = Math.round(dist * 0.38 * meta.base);
  const adjustedCost = Math.round(baselineCost * (1 + priceVariationPct / 100));
  const impactPct = Number((((adjustedCost - baselineCost) / baselineCost) * 100).toFixed(2));

  return {
    route_id: routeId,
    fuel_type: fuelType,
    price_variation_percentage: priceVariationPct,
    estimated_margin_impact_percentage: impactPct,
    baseline_fuel_cost: baselineCost,
    adjusted_fuel_cost: adjustedCost,
    message:
      priceVariationPct > 5
        ? `Alerta: Un incremento del ${priceVariationPct}% en ${fuelType} erosiona el margen operativo en ${impactPct}%. Se recomienda aplicar la cláusula BAF pactada.`
        : `Variación moderada: La fluctuación del ${priceVariationPct}% está dentro del rango absorbible por el presupuesto de contingencia.`,
  };
}

/**
 * Storage helpers for user interactivity
 */
export function addCustomFuelLog(payload: CreateTripFuelLogPayload): TripFuelLog {
  const newLog: TripFuelLog = {
    id: `log-custom-${Date.now()}`,
    company_id: 'comp-default',
    trip_id: payload.trip_id,
    fuel_type: payload.fuel_type,
    volume_purchased: Number(payload.volume_purchased),
    cost_per_unit: Number(payload.cost_per_unit),
    total_cost: Number(payload.total_cost),
    odometer_or_hours: payload.odometer_or_hours ? Number(payload.odometer_or_hours) : null,
    purchased_at: payload.purchased_at || new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  customLogs.unshift(newLog);
  return newLog;
}

export function deleteCustomFuelLog(id: string): void {
  customLogs = customLogs.filter((l) => l.id !== id);
}

export function addCustomSurchargeRule(payload: CreateSurchargeRulePayload): SurchargeRule {
  const currentPrice = BASE_PRICES[payload.fuel_type]?.base || 24.85;
  const varPct = Number((((currentPrice - payload.baseline_price) / payload.baseline_price) * 100).toFixed(2));
  const suggested = varPct > payload.threshold_percentage ? Number(((varPct * payload.pass_through_rate) / 100).toFixed(2)) : 0;

  const newRule: SurchargeRule = {
    id: `rule-custom-${Date.now()}`,
    company_id: 'comp-default',
    fuel_type: payload.fuel_type,
    region: payload.region,
    baseline_price: Number(payload.baseline_price),
    threshold_percentage: Number(payload.threshold_percentage),
    pass_through_rate: Number(payload.pass_through_rate),
    is_active: true,
    price_variation_percentage: varPct,
    suggested_surcharge_percentage: suggested,
    last_calculated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  customRules.unshift(newRule);
  return newRule;
}

export function updateCustomSurchargeRule(id: string, payload: UpdateSurchargeRulePayload): void {
  const idx = customRules.findIndex((r) => r.id === id);
  if (idx !== -1) {
    customRules[idx] = {
      ...customRules[idx],
      ...payload,
      updated_at: new Date().toISOString(),
    };
  }
}

export function deleteCustomSurchargeRule(id: string): void {
  customRules = customRules.filter((r) => r.id !== id);
}

export function addCustomFuelIndex(payload: { fuel_type: FuelType; region: string; price_per_unit: number; unit_of_measure: string; source: string }): FuelIndex {
  const newIdx: FuelIndex = {
    id: `idx-custom-${Date.now()}`,
    fuel_type: payload.fuel_type,
    region: payload.region,
    price_per_unit: Number(payload.price_per_unit),
    unit_of_measure: payload.unit_of_measure,
    recorded_at: new Date().toISOString(),
    source: payload.source,
  };
  customIndexes.unshift(newIdx);
  return newIdx;
}
