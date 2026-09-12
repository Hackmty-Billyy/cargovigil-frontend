export type VehicleType = 'truck' | 'ship' | 'plane';

export interface Company {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  company_id: string;
  type: VehicleType;
  identifier: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Route {
  id: string;
  company_id: string;
  origin: string;
  destination: string;
  distance_km?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_id: string;
  name: string;
  tax_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  company_id: string;
  client_id: string;
  reference: string;
  starts_on?: string | null; // YYYY-MM-DD
  ends_on?: string | null;   // YYYY-MM-DD
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCompanyPayload {
  company_name: string;
  email: string;
  password: string;
}

export interface CreateCompanyResponse {
  company_id: string;
  user_id: string;
  email: string;
}

export interface InviteTeammatePayload {
  email: string;
  password: string;
  role: 'operations' | 'finance' | string;
}

export interface InviteTeammateResponse {
  id: string;
  email: string;
  role: string;
}
