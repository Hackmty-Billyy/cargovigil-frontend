import type {
  LoginResponse,
  UserProfile,
  TOTPEnrollResponse,
  RecoveryCodesResponse,
} from '../types/auth';
import type {
  Company,
  Vehicle,
  Route,
  Client,
  Contract,
  CreateCompanyPayload,
  CreateCompanyResponse,
  InviteTeammatePayload,
  InviteTeammateResponse,
} from '../types/company';
import type {
  Trip,
  FuelIndex,
  PreTripProjectionRequest,
  PreTripProjectionResponse,
  CreateTripPayload,
} from '../types/logistics';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.cargovigil.tech';

class ApiClient {
  private refreshPromise: Promise<LoginResponse> | null = null;

  private async request<T>(
    path: string,
    options: RequestInit = {},
    token?: string | null
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (res.status === 204) {
      return {} as T;
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || `Error HTTP ${res.status}`);
    }

    return data as T;
  }

  // ==========================================
  // Auth Endpoints
  // ==========================================
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async verifyTOTP(mfa_token: string, code: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login/verify-totp', {
      method: 'POST',
      body: JSON.stringify({ mfa_token, code }),
    });
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async getMe(accessToken: string): Promise<UserProfile> {
    return this.request<UserProfile>('/auth/me', { method: 'GET' }, accessToken);
  }

  async enrollTOTP(accessToken: string): Promise<TOTPEnrollResponse> {
    return this.request<TOTPEnrollResponse>(
      '/auth/totp/enroll',
      { method: 'POST' },
      accessToken
    );
  }

  async confirmTOTP(accessToken: string, code: string): Promise<RecoveryCodesResponse> {
    return this.request<RecoveryCodesResponse>(
      '/auth/totp/confirm',
      {
        method: 'POST',
        body: JSON.stringify({ code }),
      },
      accessToken
    );
  }

  async regenerateRecoveryCodes(accessToken: string): Promise<RecoveryCodesResponse> {
    return this.request<RecoveryCodesResponse>(
      '/auth/recovery-codes/regenerate',
      { method: 'POST' },
      accessToken
    );
  }

  async logout(refreshToken: string, accessToken?: string | null): Promise<void> {
    await this.request(
      '/auth/logout',
      {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      },
      accessToken
    );
  }

  async logoutAll(accessToken: string): Promise<void> {
    await this.request(
      '/auth/logout/all',
      { method: 'POST' },
      accessToken
    );
  }

  // ==========================================
  // Platform Endpoints (platform_admin role)
  // ==========================================
  async listCompanies(accessToken: string): Promise<Company[]> {
    return this.request<Company[]>('/platform/companies', { method: 'GET' }, accessToken);
  }

  async createCompany(
    accessToken: string,
    payload: CreateCompanyPayload
  ): Promise<CreateCompanyResponse> {
    return this.request<CreateCompanyResponse>(
      '/platform/companies',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async setCompanyActive(
    accessToken: string,
    companyId: string,
    isActive: boolean
  ): Promise<void> {
    await this.request(
      `/platform/companies/${companyId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      },
      accessToken
    );
  }

  // ==========================================
  // Company Teammates (admin role)
  // ==========================================
  async inviteTeammate(
    accessToken: string,
    payload: InviteTeammatePayload
  ): Promise<InviteTeammateResponse> {
    return this.request<InviteTeammateResponse>(
      '/company/teammates',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  // ==========================================
  // Company Catalog: Vehicles (Flotas)
  // ==========================================
  async listVehicles(accessToken: string): Promise<Vehicle[]> {
    return this.request<Vehicle[]>('/company/vehicles', { method: 'GET' }, accessToken);
  }

  async createVehicle(
    accessToken: string,
    payload: { type: string; identifier: string }
  ): Promise<Vehicle> {
    return this.request<Vehicle>(
      '/company/vehicles',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async updateVehicle(
    accessToken: string,
    id: string,
    payload: { type: string; identifier: string; is_active?: boolean }
  ): Promise<void> {
    await this.request(
      `/company/vehicles/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteVehicle(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/company/vehicles/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Company Catalog: Routes (Rutas)
  // ==========================================
  async listRoutes(accessToken: string): Promise<Route[]> {
    return this.request<Route[]>('/company/routes', { method: 'GET' }, accessToken);
  }

  async createRoute(
    accessToken: string,
    payload: { origin: string; destination: string; distance_km?: number | null }
  ): Promise<Route> {
    return this.request<Route>(
      '/company/routes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async updateRoute(
    accessToken: string,
    id: string,
    payload: { origin: string; destination: string; distance_km?: number | null; is_active?: boolean }
  ): Promise<void> {
    await this.request(
      `/company/routes/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteRoute(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/company/routes/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Company Catalog: Clients (Clientes)
  // ==========================================
  async listClients(accessToken: string): Promise<Client[]> {
    return this.request<Client[]>('/company/clients', { method: 'GET' }, accessToken);
  }

  async createClient(
    accessToken: string,
    payload: { name: string; tax_id?: string | null }
  ): Promise<Client> {
    return this.request<Client>(
      '/company/clients',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async updateClient(
    accessToken: string,
    id: string,
    payload: { name: string; tax_id?: string | null; is_active?: boolean }
  ): Promise<void> {
    await this.request(
      `/company/clients/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteClient(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/company/clients/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Company Catalog: Contracts (Contratos)
  // ==========================================
  async listContracts(accessToken: string): Promise<Contract[]> {
    return this.request<Contract[]>('/company/contracts', { method: 'GET' }, accessToken);
  }

  async createContract(
    accessToken: string,
    payload: { client_id: string; reference: string; starts_on?: string | null; ends_on?: string | null }
  ): Promise<Contract> {
    return this.request<Contract>(
      '/company/contracts',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async updateContract(
    accessToken: string,
    id: string,
    payload: { client_id: string; reference: string; starts_on?: string | null; ends_on?: string | null; is_active?: boolean }
  ): Promise<void> {
    await this.request(
      `/company/contracts/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteContract(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/company/contracts/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Logistics: Trips, Map & Real-time Simulation
  // ==========================================
  async listTrips(accessToken: string): Promise<Trip[]> {
    return this.request<Trip[]>('/logistics/trips', { method: 'GET' }, accessToken);
  }

  async getTrip(accessToken: string, id: string): Promise<Trip> {
    return this.request<Trip>(`/logistics/trips/${id}`, { method: 'GET' }, accessToken);
  }

  async calculateTripProjection(
    accessToken: string,
    payload: PreTripProjectionRequest
  ): Promise<PreTripProjectionResponse> {
    return this.request<PreTripProjectionResponse>(
      '/logistics/trips/projection',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async createTrip(
    accessToken: string,
    payload: CreateTripPayload
  ): Promise<Trip> {
    return this.request<Trip>(
      '/logistics/trips',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async advanceTripSimulation(
    accessToken: string,
    tripId?: string
  ): Promise<{ message: string; trips: Trip[] }> {
    return this.request<{ message: string; trips: Trip[] }>(
      '/logistics/trips/advance-simulation',
      {
        method: 'POST',
        body: JSON.stringify({ trip_id: tripId || null }),
      },
      accessToken
    );
  }

  async getFuelIndexes(accessToken: string): Promise<FuelIndex[]> {
    return this.request<FuelIndex[]>('/logistics/fuel-indexes', { method: 'GET' }, accessToken);
  }
}

export const api = new ApiClient();
