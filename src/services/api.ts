import type {
  LoginResponse,
  UserProfile,
  TOTPEnrollResponse,
  RecoveryCodesResponse,
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

  // Auth Endpoints
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

  async register(
    email: string,
    password: string,
    role: string = 'operations'
  ): Promise<{ id: string; email: string; role: string }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
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
}

export const api = new ApiClient();
