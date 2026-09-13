/**
 * Módulo 2 — Inteligencia de costes operativos y fricciones en ruta.
 *
 * El viaje (Trip) vive en types/logistics.ts porque el radar ya lo consume
 * enriquecido desde /logistics/trips; aquí sólo viven las entidades propias
 * del módulo: tiempos muertos, riesgo de ruta y colchón de liquidez.
 */

export type FrictionEventType =
  | 'port_demurrage'
  | 'customs_delay'
  | 'traffic_congestion'
  | 'mechanical_failure'
  | 'route_deviation'
  | 'weather_hazard'
  | 'security_incident'
  | 'warehouse_detention';

export type FundStatus = 'allocated' | 'partially_consumed' | 'exhausted' | 'released';

/** Tiempo muerto de un viaje. ended_at en null = sigue corriendo. */
export interface Friction {
  id: string;
  company_id: string;
  trip_id: string;
  event_type: FrictionEventType;
  location_name?: string | null;
  started_at: string;
  ended_at?: string | null;
  duration_hours: number;
  /** Costo de bolsillo, en la moneda del viaje. */
  cost_impact: number;
  /** Ingreso que el activo no generó mientras estuvo parado. */
  opportunity_cost: number;
  notes?: string | null;
  created_at: string;

  // Enriquecidos por el backend (join contra trips/routes).
  trip_tracking_code?: string;
  trip_status?: string;
  route_origin?: string;
  route_destination?: string;
}

export interface RouteRiskProfile {
  id: string;
  company_id: string;
  route_id: string;
  /** Multiplicador 1.00 (limpia) a 3.00 (peor). */
  historical_risk_score: number;
  avg_delay_hours: number;
  /** Entre 3 y 25. */
  suggested_contingency_percentage: number;
  incident_count: number;
  last_calculated_at: string;

  route_origin?: string;
  route_destination?: string;
  route_distance_km?: number | null;
}

export interface ContingencyFund {
  id: string;
  company_id: string;
  trip_id: string;
  route_risk_score: number;
  applied_percentage: number;
  /** Flete del viaje al momento del cálculo, en base_currency. */
  base_amount: number;
  base_currency: string;
  fx_rate: number;
  /** Moneda de la reserva en tesorería (MXN hoy). */
  reserve_currency: string;
  allocated_amount: number;
  consumed_amount: number;
  released_amount: number;
  status: FundStatus;
  reserve_expense_id?: string | null;
  calculated_at: string;
  created_at: string;
  updated_at: string;

  trip_tracking_code?: string;
  trip_status?: string;
  route_origin?: string;
  route_destination?: string;
}

/** Resumen de impacto de un viaje, en la moneda del viaje. */
export interface TripImpact {
  trip_id: string;
  currency: string;
  friction_count: number;
  open_friction_count: number;
  /** Las fricciones abiertas cuentan hasta ahora mismo. */
  total_idle_hours: number;
  direct_cost: number;
  opportunity_cost: number;
  total_friction_impact: number;
  idle_hourly_rate: number;
  contingency_fund: ContingencyFund | null;
}

/** null en idle_hourly_rate = derivar la tarifa del flete de cada viaje. */
export interface CostSettings {
  company_id: string;
  idle_hourly_rate: number | null;
  currency: string;
  updated_at: string;
}

export interface RegisterFrictionPayload {
  event_type: FrictionEventType;
  location_name?: string | null;
  started_at: string;
  ended_at?: string | null;
  cost_impact: number;
  notes?: string | null;
}

export interface CloseFrictionPayload {
  ended_at: string;
  cost_impact?: number | null;
  notes?: string | null;
}

export interface UpdateCostSettingsPayload {
  idle_hourly_rate: number | null;
  currency: string;
}

export const FRICTION_EVENT_LABELS: Record<FrictionEventType, string> = {
  port_demurrage: 'Demora en puerto',
  customs_delay: 'Retención en aduana',
  traffic_congestion: 'Congestión vial',
  mechanical_failure: 'Falla mecánica',
  route_deviation: 'Desvío de ruta',
  weather_hazard: 'Clima adverso',
  security_incident: 'Incidente de seguridad',
  warehouse_detention: 'Detención en almacén',
};
