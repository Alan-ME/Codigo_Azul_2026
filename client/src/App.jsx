// ─────────────────────────────────────────────────────────────
// client/src/App.jsx
// Enrutador central optimizado con Code Splitting (React.lazy y Suspense).
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { IncidentesProvider } from './context/IncidentesContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';
import { lazyWithRetry } from './utils/lazyWithRetry.js';

// Carga diferida de páginas con autoreintento ante actualización de versión
const LoginPage = lazyWithRetry(() => import('./pages/LoginPage.jsx'));
const DashboardPage = lazyWithRetry(() => import('./pages/DashboardPage.jsx'));
const TableroPage = lazyWithRetry(() => import('./pages/TableroPage.jsx'));
const PacientesPage = lazyWithRetry(() => import('./pages/PacientesPage.jsx'));
const HistorialPage = lazyWithRetry(() => import('./pages/HistorialPage.jsx'));
const ReportesPage = lazyWithRetry(() => import('./pages/ReportesPage.jsx'));
const UsuariosPage = lazyWithRetry(() => import('./pages/UsuariosPage.jsx'));
const AreasPage = lazyWithRetry(() => import('./pages/AreasPage.jsx'));
const ConfiguracionPage = lazyWithRetry(() => import('./pages/ConfiguracionPage.jsx'));
const MobilePreviewPage = lazyWithRetry(() => import('./pages/MobilePreviewPage.jsx'));
const PerfilPage = lazyWithRetry(() => import('./pages/PerfilPage.jsx'));
const NotificacionesPage = lazyWithRetry(() => import('./pages/NotificacionesPage.jsx'));
const AyudaPage = lazyWithRetry(() => import('./pages/AyudaPage.jsx'));
const MobileAppStandalonePage = lazyWithRetry(() => import('./pages/MobileAppStandalonePage.jsx'));

function LoadingFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: '#0B5FFF' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, fontSize: '14px' }}>
        <div
          style={{
            width: '22px',
            height: '22px',
            border: '3px solid rgba(11,95,255,0.2)',
            borderTopColor: '#0B5FFF',
            borderRadius: '50%',
            animation: 'girar 0.8s linear infinite',
          }}
        />
        <span>Cargando módulo hospitalario…</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <IncidentesProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Ruta directa para la App Móvil / Botón de Pánico */}
            <Route path="/alarma" element={<MobileAppStandalonePage />} />
            <Route path="/mobile" element={<MobileAppStandalonePage />} />

            {/* Login de Escritorio */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas con AppShell (Desktop Suite) */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tablero" element={<TableroPage />} />
              <Route path="/historial" element={<HistorialPage />} />
              <Route path="/reportes" element={<ReportesPage />} />
              <Route path="/pacientes" element={<PacientesPage />} />
              <Route path="/usuarios" element={<UsuariosPage />} />
              <Route path="/areas" element={<AreasPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
              <Route path="/mobile-preview" element={<MobilePreviewPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/notificaciones" element={<NotificacionesPage />} />
              <Route path="/ayuda" element={<AyudaPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </IncidentesProvider>
    </AuthProvider>
  );
}
