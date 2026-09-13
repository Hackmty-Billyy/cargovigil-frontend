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
import type {
  BankAccount,
  Invoice,
  Expense,
  CashAlert,
  CashFlowProjection,
  CreateBankAccountPayload,
  CreateInvoicePayload,
  RecordInvoicePaymentPayload,
  CreateExpensePayload,
  PayExpensePayload,
} from '../types/treasury';
import type {
  FuelIndex as FuelIndexGlobal,
  FuelWeeklyTrend,
  TripFuelLog,
  SurchargeRule,
  MarginImpact,
  CreateFuelIndexPayload,
  CreateTripFuelLogPayload,
  CreateSurchargeRulePayload,
  UpdateSurchargeRulePayload,
  SimulateMarginImpactPayload,
  SimulateMarginImpactResponse,
  FuelType,
} from '../types/fuel';
import type {
  Friction,
  RouteRiskProfile,
  ContingencyFund,
  TripImpact,
  CostSettings,
  RegisterFrictionPayload,
  CloseFrictionPayload,
  UpdateCostSettingsPayload,
} from '../types/routecost';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.cargovigil.tech';

// Los importes llegan como number desde Go, pero un NUMERIC serializado por un
// driver distinto podría llegar como string: num() deja la UI a salvo de eso y
// de los nulos, que en las tablas se formatean igual que un cero.
function num(value: any, fallback = 0): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return typeof parsed === 'number' && !Number.isNaN(parsed) ? parsed : fallback;
}

function normalizeFriction(raw: any): Friction {
  return {
    id: raw.id || '',
    company_id: raw.company_id || '',
    trip_id: raw.trip_id || '',
    event_type: raw.event_type || 'traffic_congestion',
    location_name: raw.location_name ?? null,
    started_at: raw.started_at || new Date().toISOString(),
    ended_at: raw.ended_at ?? null,
    duration_hours: num(raw.duration_hours),
    cost_impact: num(raw.cost_impact),
    opportunity_cost: num(raw.opportunity_cost),
    notes: raw.notes ?? null,
    created_at: raw.created_at || new Date().toISOString(),
    trip_tracking_code: raw.trip_tracking_code || '',
    trip_status: raw.trip_status || '',
    route_origin: raw.route_origin || '',
    route_destination: raw.route_destination || '',
  };
}

function normalizeRouteRiskProfile(raw: any): RouteRiskProfile {
  return {
    id: raw.id || '',
    company_id: raw.company_id || '',
    route_id: raw.route_id || '',
    historical_risk_score: num(raw.historical_risk_score, 1),
    avg_delay_hours: num(raw.avg_delay_hours),
    suggested_contingency_percentage: num(raw.suggested_contingency_percentage, 5),
    incident_count: num(raw.incident_count),
    last_calculated_at: raw.last_calculated_at || new Date().toISOString(),
    route_origin: raw.route_origin || '',
    route_destination: raw.route_destination || '',
    route_distance_km: raw.route_distance_km ?? null,
  };
}

function normalizeContingencyFund(raw: any): ContingencyFund {
  return {
    id: raw.id || '',
    company_id: raw.company_id || '',
    trip_id: raw.trip_id || '',
    route_risk_score: num(raw.route_risk_score, 1),
    applied_percentage: num(raw.applied_percentage),
    base_amount: num(raw.base_amount),
    base_currency: raw.base_currency || 'USD',
    fx_rate: num(raw.fx_rate, 1),
    reserve_currency: raw.reserve_currency || 'MXN',
    allocated_amount: num(raw.allocated_amount),
    consumed_amount: num(raw.consumed_amount),
    released_amount: num(raw.released_amount),
    status: raw.status || 'allocated',
    reserve_expense_id: raw.reserve_expense_id ?? null,
    calculated_at: raw.calculated_at || new Date().toISOString(),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    trip_tracking_code: raw.trip_tracking_code || '',
    trip_status: raw.trip_status || '',
    route_origin: raw.route_origin || '',
    route_destination: raw.route_destination || '',
  };
}

function normalizeTripImpact(raw: any): TripImpact {
  return {
    trip_id: raw.trip_id || '',
    currency: raw.currency || 'USD',
    friction_count: num(raw.friction_count),
    open_friction_count: num(raw.open_friction_count),
    total_idle_hours: num(raw.total_idle_hours),
    direct_cost: num(raw.direct_cost),
    opportunity_cost: num(raw.opportunity_cost),
    total_friction_impact: num(raw.total_friction_impact),
    idle_hourly_rate: num(raw.idle_hourly_rate),
    contingency_fund: raw.contingency_fund ? normalizeContingencyFund(raw.contingency_fund) : null,
  };
}

function normalizeCompany(raw: any): Company {
  return {
    id: raw.id || raw.ID || '',
    name: raw.name || raw.Name || 'Sin Nombre',
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeVehicle(raw: any): Vehicle {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    type: (raw.type || raw.Type || 'truck').toLowerCase() as any,
    identifier: raw.identifier || raw.Identifier || raw.id || '',
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeRoute(raw: any): Route {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    origin: raw.origin || raw.Origin || 'Origen',
    destination: raw.destination || raw.Destination || 'Destino',
    distance_km: raw.distance_km !== undefined ? raw.distance_km : (raw.DistanceKM !== undefined ? raw.DistanceKM : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeClient(raw: any): Client {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    name: raw.name || raw.Name || 'Sin Nombre',
    tax_id: raw.tax_id !== undefined ? raw.tax_id : (raw.TaxID !== undefined ? raw.TaxID : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeContract(raw: any): Contract {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    client_id: raw.client_id || raw.ClientID || '',
    reference: raw.reference || raw.Reference || raw.id || '',
    starts_on: raw.starts_on !== undefined ? raw.starts_on : (raw.StartsOn !== undefined ? raw.StartsOn : null),
    ends_on: raw.ends_on !== undefined ? raw.ends_on : (raw.EndsOn !== undefined ? raw.EndsOn : null),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeBankAccount(raw: any): BankAccount {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    bank_name: raw.bank_name || raw.BankName || '',
    account_number_mask: raw.account_number_mask || raw.AccountNumberMask || '',
    currency: (raw.currency || raw.Currency || 'MXN').toUpperCase() as any,
    current_balance: Number(raw.current_balance !== undefined ? raw.current_balance : (raw.CurrentBalance || 0)),
    minimum_required_balance: Number(raw.minimum_required_balance !== undefined ? raw.minimum_required_balance : (raw.MinimumRequiredBalance || 0)),
    is_active: raw.is_active !== undefined ? raw.is_active : (raw.IsActive !== undefined ? raw.IsActive : true),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeInvoice(raw: any): Invoice {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    trip_id: raw.trip_id !== undefined ? raw.trip_id : (raw.TripID !== undefined ? raw.TripID : null),
    client_id: raw.client_id || raw.ClientID || '',
    bank_account_id: raw.bank_account_id !== undefined ? raw.bank_account_id : (raw.BankAccountID !== undefined ? raw.BankAccountID : null),
    invoice_number: raw.invoice_number || raw.InvoiceNumber || '',
    issue_date: raw.issue_date || raw.IssueDate || '',
    due_date: raw.due_date || raw.DueDate || '',
    adjusted_due_date: raw.adjusted_due_date || raw.AdjustedDueDate || raw.due_date || raw.DueDate || '',
    total_amount: Number(raw.total_amount !== undefined ? raw.total_amount : (raw.TotalAmount || 0)),
    paid_amount: Number(raw.paid_amount !== undefined ? raw.paid_amount : (raw.PaidAmount || 0)),
    status: (raw.status || raw.Status || 'draft').toLowerCase() as any,
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeExpense(raw: any): Expense {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    trip_id: raw.trip_id !== undefined ? raw.trip_id : (raw.TripID !== undefined ? raw.TripID : null),
    bank_account_id: raw.bank_account_id !== undefined ? raw.bank_account_id : (raw.BankAccountID !== undefined ? raw.BankAccountID : null),
    category: (raw.category || raw.Category || 'other').toLowerCase() as any,
    description: raw.description || raw.Description || '',
    amount: Number(raw.amount !== undefined ? raw.amount : (raw.Amount || 0)),
    due_date: raw.due_date || raw.DueDate || '',
    paid_date: raw.paid_date !== undefined ? raw.paid_date : (raw.PaidDate !== undefined ? raw.PaidDate : null),
    status: (raw.status || raw.Status || 'pending').toLowerCase() as any,
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeCashAlert(raw: any): CashAlert {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    projected_date: raw.projected_date || raw.ProjectedDate || '',
    severity: (raw.severity || raw.Severity || 'warning').toLowerCase() as any,
    projected_deficit: Number(raw.projected_deficit !== undefined ? raw.projected_deficit : (raw.ProjectedDeficit || 0)),
    description: raw.description || raw.Description || '',
    is_resolved: raw.is_resolved !== undefined ? raw.is_resolved : (raw.IsResolved !== undefined ? raw.IsResolved : false),
    created_at: raw.created_at || raw.CreatedAt || new Date().toISOString(),
    updated_at: raw.updated_at || raw.UpdatedAt || new Date().toISOString(),
  };
}

function normalizeCashFlowProjection(raw: any): CashFlowProjection {
  return {
    id: raw.id || raw.ID || '',
    company_id: raw.company_id || raw.CompanyID || '',
    projected_date: raw.projected_date || raw.ProjectedDate || '',
    projected_balance: Number(raw.projected_balance !== undefined ? raw.projected_balance : (raw.ProjectedBalance || 0)),
    generated_at: raw.generated_at || raw.GeneratedAt || new Date().toISOString(),
  };
}

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
    const raw = await this.request<any[]>('/platform/companies', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeCompany) : [];
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
    const raw = await this.request<any[]>('/company/vehicles', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeVehicle) : [];
  }

  async createVehicle(
    accessToken: string,
    payload: { type: string; identifier: string }
  ): Promise<Vehicle> {
    const raw = await this.request<any>(
      '/company/vehicles',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeVehicle(raw);
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
    const raw = await this.request<any[]>('/company/routes', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeRoute) : [];
  }

  async createRoute(
    accessToken: string,
    payload: { origin: string; destination: string; distance_km?: number | null }
  ): Promise<Route> {
    const raw = await this.request<any>(
      '/company/routes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeRoute(raw);
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
    const raw = await this.request<any[]>('/company/clients', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeClient) : [];
  }

  async createClient(
    accessToken: string,
    payload: { name: string; tax_id?: string | null }
  ): Promise<Client> {
    const raw = await this.request<any>(
      '/company/clients',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeClient(raw);
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
    const raw = await this.request<any[]>('/company/contracts', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeContract) : [];
  }

  async createContract(
    accessToken: string,
    payload: { client_id: string; reference: string; starts_on?: string | null; ends_on?: string | null }
  ): Promise<Contract> {
    const raw = await this.request<any>(
      '/company/contracts',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeContract(raw);
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

  // ==========================================
  // Treasury: Bank Accounts (Cuentas Bancarias)
  // ==========================================
  async listBankAccounts(accessToken: string): Promise<BankAccount[]> {
    const raw = await this.request<any[]>('/treasury/bank-accounts', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeBankAccount) : [];
  }

  async createBankAccount(
    accessToken: string,
    payload: CreateBankAccountPayload
  ): Promise<BankAccount> {
    const raw = await this.request<any>(
      '/treasury/bank-accounts',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeBankAccount(raw);
  }

  async updateBankAccount(
    accessToken: string,
    id: string,
    payload: Partial<CreateBankAccountPayload>
  ): Promise<void> {
    await this.request(
      `/treasury/bank-accounts/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteBankAccount(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/treasury/bank-accounts/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Treasury: Invoices (Cuentas por Cobrar)
  // ==========================================
  async listInvoices(accessToken: string): Promise<Invoice[]> {
    const raw = await this.request<any[]>('/treasury/invoices', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeInvoice) : [];
  }

  async createInvoice(
    accessToken: string,
    payload: CreateInvoicePayload
  ): Promise<Invoice> {
    const raw = await this.request<any>(
      '/treasury/invoices',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeInvoice(raw);
  }

  async updateInvoice(
    accessToken: string,
    id: string,
    payload: Partial<CreateInvoicePayload>
  ): Promise<void> {
    await this.request(
      `/treasury/invoices/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteInvoice(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/treasury/invoices/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  async recordInvoicePayment(
    accessToken: string,
    id: string,
    payload: RecordInvoicePaymentPayload
  ): Promise<void> {
    await this.request(
      `/treasury/invoices/${id}/payments`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  // ==========================================
  // Treasury: Expenses (Cuentas por Pagar)
  // ==========================================
  async listExpenses(accessToken: string): Promise<Expense[]> {
    const raw = await this.request<any[]>('/treasury/expenses', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeExpense) : [];
  }

  async createExpense(
    accessToken: string,
    payload: CreateExpensePayload
  ): Promise<Expense> {
    const raw = await this.request<any>(
      '/treasury/expenses',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
    return normalizeExpense(raw);
  }

  async updateExpense(
    accessToken: string,
    id: string,
    payload: Partial<CreateExpensePayload>
  ): Promise<void> {
    await this.request(
      `/treasury/expenses/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteExpense(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/treasury/expenses/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  async markExpensePaid(
    accessToken: string,
    id: string,
    payload: PayExpensePayload
  ): Promise<void> {
    await this.request(
      `/treasury/expenses/${id}/pay`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  // ==========================================
  // Treasury: Cash Flow Forecast (Pronóstico)
  // ==========================================
  async getForecast(accessToken: string, days: number = 30): Promise<CashFlowProjection[]> {
    const raw = await this.request<any[]>(`/treasury/forecast?days=${days}`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeCashFlowProjection) : [];
  }

  async recalculateForecast(accessToken: string): Promise<void> {
    await this.request(
      '/treasury/forecast/recalculate',
      { method: 'POST' },
      accessToken
    );
  }

  // ==========================================
  // Treasury: Liquidity Alerts (Alertas de Liquidez)
  // ==========================================
  async listAlerts(accessToken: string, resolved: boolean = false): Promise<CashAlert[]> {
    const raw = await this.request<any[]>(`/treasury/alerts?resolved=${resolved}`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeCashAlert) : [];
  }

  async setAlertResolved(accessToken: string, id: string, resolved: boolean): Promise<void> {
    await this.request(
      `/treasury/alerts/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ is_resolved: resolved }),
      },
      accessToken
    );
  }

  // ==========================================
  // Platform: Fuel Indexes (platform_admin write)
  // ==========================================
  async createPlatformFuelIndex(
    accessToken: string,
    payload: CreateFuelIndexPayload
  ): Promise<FuelIndexGlobal> {
    return this.request<FuelIndexGlobal>(
      '/platform/fuel-indexes',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  // ==========================================
  // Fuel: Indexes (any company role — read)
  // ==========================================
  async listFuelIndexes(
    accessToken: string,
    params?: { fuel_type?: FuelType; region?: string; limit?: number }
  ): Promise<FuelIndexGlobal[]> {
    const qs = new URLSearchParams();
    if (params?.fuel_type) qs.set('fuel_type', params.fuel_type);
    if (params?.region) qs.set('region', params.region);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await this.request<any[]>(`/fuel/indexes${query}`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  async getFuelWeeklyTrend(
    accessToken: string,
    params?: { fuel_type?: FuelType; region?: string; limit?: number }
  ): Promise<FuelWeeklyTrend[]> {
    const qs = new URLSearchParams();
    if (params?.fuel_type) qs.set('fuel_type', params.fuel_type);
    if (params?.region) qs.set('region', params.region);
    if (params?.limit) qs.set('limit', String(params.limit ?? 12));
    const query = qs.toString() ? `?${qs}` : '';
    const raw = await this.request<any[]>(`/fuel/indexes/weekly-trend${query}`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  // ==========================================
  // Fuel: Trip Logs (read=all, write=admin+operations)
  // ==========================================
  async listTripFuelLogs(accessToken: string): Promise<TripFuelLog[]> {
    const raw = await this.request<any[]>('/fuel/trip-logs', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  async listTripFuelLogsByTrip(accessToken: string, tripId: string): Promise<TripFuelLog[]> {
    const raw = await this.request<any[]>(`/fuel/trip-logs/trip/${tripId}`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  async createTripFuelLog(
    accessToken: string,
    payload: CreateTripFuelLogPayload
  ): Promise<TripFuelLog> {
    return this.request<TripFuelLog>(
      '/fuel/trip-logs',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async deleteTripFuelLog(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/fuel/trip-logs/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  // ==========================================
  // Fuel: Surcharge Rules (admin+finance)
  // ==========================================
  async listSurchargeRules(accessToken: string): Promise<SurchargeRule[]> {
    const raw = await this.request<any[]>('/fuel/surcharge-rules', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  async createSurchargeRule(
    accessToken: string,
    payload: CreateSurchargeRulePayload
  ): Promise<SurchargeRule> {
    return this.request<SurchargeRule>(
      '/fuel/surcharge-rules',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async updateSurchargeRule(
    accessToken: string,
    id: string,
    payload: UpdateSurchargeRulePayload
  ): Promise<void> {
    await this.request(
      `/fuel/surcharge-rules/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  // ==========================================
  // Módulo 2 — Fricciones en ruta, riesgo y colchón de contingencia
  // ==========================================

  /**
   * El listado de viajes se lee de /logistics/trips (ya viene con vehículo,
   * ruta y cliente resueltos); /routecost queda para lo propio del módulo 2.
   */
  async changeTripStatus(
    accessToken: string,
    tripId: string,
    status: string,
    actualArrivalDate?: string | null
  ): Promise<void> {
    await this.request(
      `/routecost/trips/${tripId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status, actual_arrival_date: actualArrivalDate || null }),
      },
      accessToken
    );
  }

  async deleteSurchargeRule(accessToken: string, id: string): Promise<void> {
    await this.request(
      `/fuel/surcharge-rules/${id}`,
      { method: 'DELETE' },
      accessToken
    );
  }

  async recalculateSurcharges(accessToken: string): Promise<void> {
    await this.request(
      '/fuel/surcharge-rules/recalculate',
      { method: 'POST' },
      accessToken
    );
  }

  // ==========================================
  // Fuel: Margin Impact (admin+finance)
  // ==========================================
  async listMarginImpacts(accessToken: string): Promise<MarginImpact[]> {
    const raw = await this.request<any[]>('/fuel/margin-impacts', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw : [];
  }

  async getRouteMarginImpact(
    accessToken: string,
    routeId: string,
    fuelType: FuelType
  ): Promise<MarginImpact> {
    return this.request<MarginImpact>(
      `/fuel/routes/${routeId}/margin-impact?fuel_type=${fuelType}`,
      { method: 'GET' },
      accessToken
    );
  }

  async simulateMarginImpact(
    accessToken: string,
    routeId: string,
    payload: SimulateMarginImpactPayload
  ): Promise<SimulateMarginImpactResponse> {
    return this.request<SimulateMarginImpactResponse>(
      `/fuel/routes/${routeId}/margin-impact/simulate`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      accessToken
    );
  }

  async getTripImpact(accessToken: string, tripId: string): Promise<TripImpact> {
    const raw = await this.request<any>(`/routecost/trips/${tripId}/impact`, { method: 'GET' }, accessToken);
    return normalizeTripImpact(raw);
  }

  async listFrictions(accessToken: string, onlyOpen: boolean = false): Promise<Friction[]> {
    const raw = await this.request<any[]>(
      `/routecost/frictions${onlyOpen ? '?open=true' : ''}`,
      { method: 'GET' },
      accessToken
    );
    return Array.isArray(raw) ? raw.map(normalizeFriction) : [];
  }

  async listTripFrictions(accessToken: string, tripId: string): Promise<Friction[]> {
    const raw = await this.request<any[]>(`/routecost/trips/${tripId}/frictions`, { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeFriction) : [];
  }

  async registerFriction(
    accessToken: string,
    tripId: string,
    payload: RegisterFrictionPayload
  ): Promise<Friction> {
    const raw = await this.request<any>(
      `/routecost/trips/${tripId}/frictions`,
      { method: 'POST', body: JSON.stringify(payload) },
      accessToken
    );
    return normalizeFriction(raw);
  }

  async closeFriction(
    accessToken: string,
    frictionId: string,
    payload: CloseFrictionPayload
  ): Promise<Friction> {
    const raw = await this.request<any>(
      `/routecost/frictions/${frictionId}/close`,
      { method: 'PATCH', body: JSON.stringify(payload) },
      accessToken
    );
    return normalizeFriction(raw);
  }

  async listRouteRiskProfiles(accessToken: string): Promise<RouteRiskProfile[]> {
    const raw = await this.request<any[]>('/routecost/risk-profiles', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeRouteRiskProfile) : [];
  }

  async recalculateRouteRisk(accessToken: string, routeId?: string): Promise<RouteRiskProfile[]> {
    const raw = await this.request<any[]>(
      `/routecost/risk-profiles/recalculate${routeId ? `?route_id=${routeId}` : ''}`,
      { method: 'POST' },
      accessToken
    );
    return Array.isArray(raw) ? raw.map(normalizeRouteRiskProfile) : [];
  }

  async listContingencyFunds(accessToken: string): Promise<ContingencyFund[]> {
    const raw = await this.request<any[]>('/routecost/contingency', { method: 'GET' }, accessToken);
    return Array.isArray(raw) ? raw.map(normalizeContingencyFund) : [];
  }

  async allocateContingency(accessToken: string, tripId: string): Promise<ContingencyFund> {
    const raw = await this.request<any>(
      `/routecost/trips/${tripId}/contingency/allocate`,
      { method: 'POST' },
      accessToken
    );
    return normalizeContingencyFund(raw);
  }

  async releaseContingency(accessToken: string, tripId: string): Promise<ContingencyFund> {
    const raw = await this.request<any>(
      `/routecost/trips/${tripId}/contingency/release`,
      { method: 'POST' },
      accessToken
    );
    return normalizeContingencyFund(raw);
  }

  /** Asigna colchón a los viajes abiertos que nunca lo tuvieron. */
  async allocateMissingContingency(accessToken: string): Promise<number> {
    const raw = await this.request<any>(
      '/routecost/contingency/allocate-all',
      { method: 'POST' },
      accessToken
    );
    return num(raw?.allocated);
  }

  async getCostSettings(accessToken: string): Promise<CostSettings> {
    const raw = await this.request<any>('/routecost/settings', { method: 'GET' }, accessToken);
    return {
      company_id: raw?.company_id || '',
      idle_hourly_rate: raw?.idle_hourly_rate ?? null,
      currency: raw?.currency || 'MXN',
      updated_at: raw?.updated_at || new Date().toISOString(),
    };
  }

  async updateCostSettings(
    accessToken: string,
    payload: UpdateCostSettingsPayload
  ): Promise<CostSettings> {
    const raw = await this.request<any>(
      '/routecost/settings',
      { method: 'PUT', body: JSON.stringify(payload) },
      accessToken
    );
    return {
      company_id: raw?.company_id || '',
      idle_hourly_rate: raw?.idle_hourly_rate ?? null,
      currency: raw?.currency || 'MXN',
      updated_at: raw?.updated_at || new Date().toISOString(),
    };
  }
}

export const api = new ApiClient();
