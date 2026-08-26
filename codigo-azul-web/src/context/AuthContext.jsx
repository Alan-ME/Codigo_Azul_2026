import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiClient, setAuthToken } from '../services/apiClient.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'codigo_azul_auth';

function loadStoredSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => loadStoredSession());

  useEffect(() => {
    setAuthToken(session?.token || null);
  }, [session]);

  const login = useCallback(async (email, password) => {
    const { data } = await apiClient.post('/api/v1/auth/login', { email, password });
    const payload = data?.data;
    if (!payload?.token) {
      throw new Error('Respuesta de autenticación inválida.');
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    setSession(payload);
    return payload;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      token: session?.token || null,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  return ctx;
}
