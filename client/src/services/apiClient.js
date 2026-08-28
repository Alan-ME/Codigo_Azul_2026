// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/services/apiClient.js
// Cliente HTTP unificado para el Backend Core con JWT y WebSockets.
// ─────────────────────────────────────────────────────────────

const API_BASE = '/api/v1';

export const STORAGE_KEYS = {
  token:  'codigo_azul_jwt_token',
  user:   'codigo_azul_user',
  sesion: 'codigo_azul_sesion',
  tema:   'codigo_azul_tema',
};

export const apiClient = {
  getToken() {
    try {
      const t = sessionStorage.getItem(STORAGE_KEYS.token) || localStorage.getItem(STORAGE_KEYS.token) || null;
      if (t && t.startsWith('mock-')) return null;
      return t;
    } catch {
      return null;
    }
  },

  saveSession(token, user) {
    try {
      if (token && !token.startsWith('mock-')) {
        sessionStorage.setItem(STORAGE_KEYS.token, token);
        localStorage.setItem(STORAGE_KEYS.token, token);
      }
      if (user) {
        sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      }
    } catch (e) {
      console.warn('[STORAGE] Error guardando sesión:', e);
    }
  },

  clearSession() {
    try {
      sessionStorage.removeItem(STORAGE_KEYS.token);
      sessionStorage.removeItem(STORAGE_KEYS.user);
      sessionStorage.removeItem(STORAGE_KEYS.sesion);
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.user);
    } catch {}
  },

  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (res.status === 401) {
      console.warn('[API] Token inválido o expirado (401). Limpiando token obsoleto...');
      this.clearSession();
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || 'Error en la petición al servidor');
      err.status = res.status;
      err.data = json;
      throw err;
    }
    return json;
  },

  async detectarBackend() {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      const json = await res.json();
      return res.ok && json.success && (json.data.status === 'online' || json.data.status === 'degraded');
    } catch {
      return false;
    }
  },

  auth: {
    login(email, password) {
      return apiClient.request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
    },
    getMe() {
      return apiClient.request('/auth/me');
    },
  },
};

export default apiClient;
