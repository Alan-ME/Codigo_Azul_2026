// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/context/AuthContext.jsx
// Autenticación Híbrida: Backend Real (PostgreSQL + JWT) + Mock (DEMO).
// Mapeo automático de roles y persistencia de sesión.
// ─────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient, { STORAGE_KEYS } from '../services/apiClient.js';
import { initialUsuarios, avatar } from '../data/mockData.js';

const AuthContext = createContext(null);

const ROL_MAP_BACKEND_TO_FRONT = {
  ADMINISTRADOR:     'admin',
  MEDICO_ACTIVADOR:  'enfermero',
  REANIMADOR_MEDICO: 'enfermero',
  OPERADOR_GUARDIA:  'admin',
};

const ROL_MAP_FRONT_TO_BACKEND = {
  admin:     'admin@hospital.gob.ar',
  enfermero: 'medico.activador@hospital.gob.ar',
};

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEYS.sesion) || localStorage.getItem(STORAGE_KEYS.sesion);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [cargandoAuth, setCargandoAuth] = useState(true);

  // Detectar estado del backend al montar
  useEffect(() => {
    let activo = true;
    apiClient.detectarBackend().then((online) => {
      if (activo) {
        setIsBackendOnline(online);
        setCargandoAuth(false);
      }
    });
    return () => { activo = false; };
  }, []);

  const guardarSesion = useCallback((nuevaSesion) => {
    setSesion(nuevaSesion);
    try {
      if (nuevaSesion) {
        sessionStorage.setItem(STORAGE_KEYS.sesion, JSON.stringify(nuevaSesion));
        localStorage.setItem(STORAGE_KEYS.sesion, JSON.stringify(nuevaSesion));
      } else {
        sessionStorage.removeItem(STORAGE_KEYS.sesion);
        localStorage.removeItem(STORAGE_KEYS.sesion);
      }
    } catch (e) {
      console.warn('[AUTH] Error en storage:', e);
    }
  }, []);

  const login = useCallback(
    async (params = {}) => {
      const online = await apiClient.detectarBackend();
      setIsBackendOnline(online);

      // 1. Modo Backend Real (email + password)
      if (online && params.email && params.password) {
        const json = await apiClient.auth.login(params.email, params.password);
        const bu = json.data.user;
        const rolFront = ROL_MAP_BACKEND_TO_FRONT[bu.rol] || 'enfermero';

        apiClient.saveSession(json.data.token, bu);
        const ses = {
          token: json.data.token,
          usuarioId: bu.id,
          rol: rolFront,
          backendUser: bu,
          mode: 'online',
        };
        guardarSesion(ses);
        return ses;
      }

      // 2. Modo Demo Rápido por Rol con Backend Online
      if (online && params.rol) {
        const emailDemo = ROL_MAP_FRONT_TO_BACKEND[params.rol] || 'admin@hospital.gob.ar';
        try {
          const json = await apiClient.auth.login(emailDemo, 'Password123!');
          const bu = json.data.user;
          const rolFront = params.rol;

          apiClient.saveSession(json.data.token, bu);
          const ses = {
            token: json.data.token,
            usuarioId: bu.id,
            rol: rolFront,
            backendUser: bu,
            mode: 'online',
          };
          guardarSesion(ses);
          return ses;
        } catch (err) {
          console.warn('[AUTH] Falló login demo en backend, cayendo a mock:', err.message);
        }
      }

      // 3. Modo Mock (Offline / Demostración)
      let u = null;
      if (params.usuario) {
        u = initialUsuarios.find((x) => x.usuario === params.usuario) || initialUsuarios[0];
      }
      if (!u && params.rol) {
        u = initialUsuarios.find((x) => x.rol === params.rol && x.estado === 'activo');
      }
      if (!u) u = initialUsuarios[0];

      const ses = {
        token: 'mock-jwt-token-demo-mode',
        usuarioId: u.id,
        rol: params.rol || u.rol,
        mode: 'mock',
      };
      guardarSesion(ses);
      return ses;
    },
    [guardarSesion],
  );

  const logout = useCallback(() => {
    guardarSesion(null);
    apiClient.clearSession();
  }, [guardarSesion]);

  const cambiarRol = useCallback(
    async (nuevoRol) => {
      if (isBackendOnline) {
        try {
          await login({ rol: nuevoRol });
          return;
        } catch (err) {
          console.warn('[AUTH] Error cambiando rol en backend:', err.message);
        }
      }
      // Modo mock
      const u = initialUsuarios.find((x) => x.rol === nuevoRol && x.estado === 'activo') || initialUsuarios[0];
      const ses = {
        token: sesion?.token || 'mock-jwt-token-demo-mode',
        usuarioId: u.id,
        rol: nuevoRol,
        mode: 'mock',
      };
      guardarSesion(ses);
    },
    [isBackendOnline, login, sesion, guardarSesion],
  );

  // Construir objeto usuario activo
  const user = useMemo(() => {
    if (!sesion) return null;
    if (sesion.backendUser) {
      const bu = sesion.backendUser;
      const nombreCompleto = `${bu.nombre || ''} ${bu.apellido || ''}`.trim() || bu.email;
      return {
        id: bu.id,
        nombre: bu.nombre || bu.email.split('@')[0],
        apellido: bu.apellido || '',
        nombreCompleto,
        usuario: bu.email.split('@')[0],
        email: bu.email,
        rol: sesion.rol,
        rolBackend: bu.rol,
        estado: 'activo',
        avatar: avatar(nombreCompleto),
      };
    }
    const mockUser = initialUsuarios.find((u) => u.id === sesion.usuarioId) || initialUsuarios[0];
    return {
      ...mockUser,
      rol: sesion.rol,
      nombreCompleto: mockUser.nombre,
    };
  }, [sesion]);

  const value = useMemo(
    () => ({
      isAuthenticated: !!sesion,
      token: sesion?.token || null,
      user,
      rol: sesion?.rol || 'admin',
      isBackendOnline,
      cargandoAuth,
      login,
      logout,
      cambiarRol,
    }),
    [sesion, user, isBackendOnline, cargandoAuth, login, logout, cambiarRol],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  return ctx;
}
