// ============================================================
// Módulo 3 — Combustible (Fuel)
// ============================================================

export type FuelType = 'diesel' | 'bunker_c' | 'marine_gasoil' | 'jet_a1';

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  diesel: 'Diésel (Carretero)',
  bunker_c: 'Bunker C (Marina Pesada)',
  marine_gasoil: 'Marine Gas Oil (MGO)',
  jet_a1: 'Jet A-1 (Aviación)',
};

export const FUEL_TYPE_COLORS: Record<FuelType, string> = {
  diesel:        'bg-amber-500/15 text-amber-300 border-amber-500/30',
  bunker_c:      'bg-slate-700/40 text-slate-300 border-slate-600',
  marine_gasoil: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  jet_a1:        'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
};

// ── Fuel Index (precio global del feed) ──────────────────────
export interface FuelIndex {
  id: string;
  fuel_type: FuelType;
  region: string;
  price_per_unit: number;
  unit_of_measure: string;
  recorded_at: string;
  source: string;
}

export interface FuelWeeklyTrend {
  week: string;           // ISO timestamp del inicio de la semana
  fuel_type: FuelType;
  region: string;
  avg_price: number;
  min_price: number;
  max_price: number;
  sample_count: number;
}

export interface CreateFuelIndexPayload {
  fuel_type: FuelType;
  region: string;
  price_per_unit: number;
  unit_of_measure: string;
  source: string;
}

// ── Trip Fuel Log (bitácora de carga por viaje) ─────────────
export interface TripFuelLog {
  id: string;
  company_id: string;
  trip_id: string;
  fuel_type: FuelType;
  volume_purchased: number;
  cost_per_unit: number;
  total_cost: number;
  odometer_or_hours?: number | null;
  purchased_at: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTripFuelLogPayload {
  trip_id: string;
  fuel_type: FuelType;
  volume_purchased: number;
  cost_per_unit: number;
  total_cost: number;
  odometer_or_hours?: number | null;
  purchased_at?: string;
}

// ── Surcharge Rules (reglas de recargo) ─────────────────────
export interface SurchargeRule {
  id: string;
  company_id: string;
  fuel_type: FuelType;
  region: string;
  baseline_price: number;
  threshold_percentage: number;
  pass_through_rate: number;
  is_active: boolean;
  // Computed fields from backend
  price_variation_percentage: number;
  suggested_surcharge_percentage: number;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSurchargeRulePayload {
  fuel_type: FuelType;
  region: string;
  baseline_price: number;
  threshold_percentage: number;
  pass_through_rate: number;
}

export interface UpdateSurchargeRulePayload extends CreateSurchargeRulePayload {
  is_active?: boolean;
}

// ── Margin Impact ────────────────────────────────────────────
export interface MarginImpact {
  id: string;
  company_id: string;
  route_id: string;
  fuel_type: FuelType;
  baseline_fuel_cost: number;
  current_fuel_cost: number;
  margin_impact_percentage: number;
  calculated_at: string;
  route_origin?: string;
  route_destination?: string;
}

export interface SimulateMarginImpactPayload {
  fuel_type: FuelType;
  price_variation_percentage: number;
}

export interface SimulateMarginImpactResponse {
  route_id: string;
  fuel_type: FuelType;
  price_variation_percentage: number;
  estimated_margin_impact_percentage: number;
  baseline_fuel_cost: number;
  adjusted_fuel_cost: number;
  message?: string;
}
