export type VehicleType = 'truck' | 'ship' | 'plane';
export type TripStatus = 'scheduled' | 'in_transit' | 'delayed' | 'completed' | 'cancelled';

export interface Trip {
  id: string;
  company_id: string;
  vehicle_id: string;
  route_id: string;
  client_id: string;
  contract_id?: string | null;
  tracking_code: string;
  cargo_type: string;
  cargo_weight_tons: number;
  status: TripStatus;
  departure_date: string;
  estimated_arrival_date: string;
  actual_arrival_date?: string | null;
  agreed_freight_price: number;
  currency: string;
  fuel_surcharge_amount: number;
  contingency_budget: number;

  // Real-time tracking
  current_lat?: number | null;
  current_lng?: number | null;
  progress_percentage: number;
  is_stuck: boolean;
  stuck_reason?: string | null;
  estimated_fuel_cost: number;
  estimated_loss_risk: number;
  last_simulated_step: number;

  // Enriched
  vehicle_identifier?: string;
  vehicle_type?: VehicleType;
  route_origin?: string;
  route_destination?: string;
  route_distance_km?: number;
  origin_lat?: number | null;
  origin_lng?: number | null;
  dest_lat?: number | null;
  dest_lng?: number | null;
  client_name?: string;

  created_at: string;
  updated_at: string;
}

export interface FuelIndex {
  id: string;
  fuel_type: string;
  region: string;
  price_per_unit: number;
  unit_of_measure: string;
  recorded_at: string;
  source: string;
}

export interface PreTripProjectionRequest {
  vehicle_type: VehicleType;
  route_id: string;
  distance_km: number;
  cargo_weight_tons: number;
  agreed_price: number;
  /** Moneda en la que viene agreed_price; la proyeccion regresa todo en ella. */
  currency: string;
}

export interface PreTripProjectionResponse {
  distance_km: number;
  fuel_type: string;
  current_fuel_price: number;
  fuel_unit: string;
  fuel_source: string;
  estimated_fuel_quantity: number;
  estimated_fuel_cost: number;
  suggested_contingency: number;
  risk_score: number;
  average_delay_hours: number;
  potential_loss_risk: number;
  projected_net_margin: number;
  projected_margin_pct: number;
  recommendation: string;
}

export interface CreateTripPayload {
  vehicle_id: string;
  route_id: string;
  client_id: string;
  contract_id?: string | null;
  tracking_code: string;
  cargo_type: string;
  cargo_weight_tons: number;
  departure_date: string;
  estimated_arrival_date: string;
  agreed_freight_price: number;
  currency: string;
  fuel_surcharge_amount: number;
  contingency_budget: number;
}
