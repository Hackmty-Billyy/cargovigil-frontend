import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { UserProfile, LoginResponse } from '../types/auth';
import { api } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  accessToken: string | null;
  pendingMFAToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyTOTP: (code: string) => Promise<LoginResponse>;
  cancelMFA: () => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCESS_TOKEN_KEY = 'cargovigil_access_token';
const REFRESH_TOKEN_KEY = 'cargovigil_refresh_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pendingMFAToken, setPendingMFAToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (token: string) => {
    try {
      const profile = await api.getMe(token);
      setUser(profile);
    } catch (err: unknown) {
      console.error('Failed to fetch user profile:', err);
    }
  }, []);

  const handleAuthenticated = useCallback(async (res: LoginResponse) => {
    if (res.access_token) {
      setAccessToken(res.access_token);
      localStorage.setItem(ACCESS_TOKEN_KEY, res.access_token);
    }
    if (res.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, res.refresh_token);
    }
    setPendingMFAToken(null);
    if (res.access_token) {
      await fetchProfile(res.access_token);
    }
  }, [fetchProfile]);

  // Initial load check
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      // 1. Try to restore with stored access token if valid
      if (storedAccessToken) {
        try {
          const profile = await api.getMe(storedAccessToken);
          if (isMounted) {
            setAccessToken(storedAccessToken);
            setUser(profile);
            setLoading(false);
            return;
          }
        } catch {
          // Access token might be expired, proceed to refresh token rotation
        }
      }

      // 2. If access token is expired or missing, rotate session with refresh token
      if (storedRefreshToken) {
        try {
          const res = await api.refresh(storedRefreshToken);
          if (isMounted) {
            await handleAuthenticated(res);
          }
        } catch {
          if (isMounted) {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            setAccessToken(null);
            setUser(null);
          }
        }
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [handleAuthenticated]);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    setError(null);
    try {
      const res = await api.login(email, password);
      if (res.stage === 'mfa_required' && res.mfa_token) {
        setPendingMFAToken(res.mfa_token);
        return res;
      }
      await handleAuthenticated(res);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(message);
      throw err;
    }
  };

  const verifyTOTP = async (code: string): Promise<LoginResponse> => {
    if (!pendingMFAToken) {
      throw new Error('No hay sesión MFA pendiente');
    }
    setError(null);
    try {
      const res = await api.verifyTOTP(pendingMFAToken, code);
      await handleAuthenticated(res);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código 2FA incorrecto o expirado';
      setError(message);
      throw err;
    }
  };

  const cancelMFA = () => {
    setPendingMFAToken(null);
    setError(null);
  };

  const logout = async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (storedRefreshToken) {
      try {
        await api.logout(storedRefreshToken, accessToken);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setPendingMFAToken(null);
  };

  const logoutAll = async () => {
    if (accessToken) {
      try {
        await api.logoutAll(accessToken);
      } catch (err) {
        console.error('Logout all error:', err);
      }
    }
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setPendingMFAToken(null);
  };

  const refreshProfile = async () => {
    if (accessToken) {
      await fetchProfile(accessToken);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        pendingMFAToken,
        loading,
        error,
        login,
        verifyTOTP,
        cancelMFA,
        logout,
        logoutAll,
        refreshProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
