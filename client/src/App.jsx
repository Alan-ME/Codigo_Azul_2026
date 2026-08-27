// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/App.jsx
// Enrutador central con AuthProvider, IncidentesProvider, ProtectedRoute y AppShell.
// Conecta 1:1 los 12 módulos de escritorio + la App Móvil de Alarma (/alarma).
// ─────────────────────────────────────────────────────────────

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { IncidentesProvider } from './context/IncidentesContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/layout/AppShell.jsx';

import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TableroPage from './pages/TableroPage.jsx';
import PacientesPage from './pages/PacientesPage.jsx';
import HistorialPage from './pages/HistorialPage.jsx';
import ReportesPage from './pages/ReportesPage.jsx';
import UsuariosPage from './pages/UsuariosPage.jsx';
import AreasPage from './pages/AreasPage.jsx';
import ConfiguracionPage from './pages/ConfiguracionPage.jsx';
import MobilePreviewPage from './pages/MobilePreviewPage.jsx';
import PerfilPage from './pages/PerfilPage.jsx';
import NotificacionesPage from './pages/NotificacionesPage.jsx';
import AyudaPage from './pages/AyudaPage.jsx';
import MobileAppStandalonePage from './pages/MobileAppStandalonePage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <IncidentesProvider>
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
      </IncidentesProvider>
    </AuthProvider>
  );
}
