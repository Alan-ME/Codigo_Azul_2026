import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { IncidentesProvider } from './context/IncidentesContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PanicoPage from './pages/PanicoPage.jsx';
import ReanimadorPage from './pages/ReanimadorPage.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  if (user?.rol === 'REANIMADOR_MEDICO') return <Navigate to="/reanimador" replace />;
  if (user?.rol === 'MEDICO_ACTIVADOR') return <Navigate to="/alarma" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <IncidentesProvider>
                <DashboardPage />
              </IncidentesProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/alarma"
          element={
            <ProtectedRoute>
              <PanicoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/panico"
          element={<Navigate to="/alarma" replace />}
        />

        <Route
          path="/reanimador"
          element={
            <ProtectedRoute>
              <IncidentesProvider>
                <ReanimadorPage />
              </IncidentesProvider>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomeRedirect />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

