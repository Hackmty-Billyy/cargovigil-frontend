export type UserRole = 'platform_admin' | 'admin' | 'operations' | 'finance' | string;

export interface UserProfile {
  id: string;
  company_id: string;
  email: string;
  role_id: number;
  role_name: UserRole;
  totp_enabled: boolean;
  created_at: string;
}

export interface LoginResponse {
  stage: 'mfa_required' | 'authenticated';
  mfa_token?: string;
  access_token?: string;
  refresh_token?: string;
}

export interface TOTPEnrollResponse {
  secret: string;
  otpauth_url: string;
}

export interface RecoveryCodesResponse {
  recovery_codes: string[];
}

export interface ApiError {
  error: string;
}
