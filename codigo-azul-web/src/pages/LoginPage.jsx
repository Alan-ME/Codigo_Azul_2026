import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { soundService } from '../services/soundService.js';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await login(email.trim(), password);
      // Desbloqueamos el AudioContext dentro del mismo gesto del usuario.
      soundService.prime().catch(() => { /* sin sonido si el navegador lo bloquea */ });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error de autenticación.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <h1 className="login-title">Código Azul</h1>
        <p className="login-subtitle">Panel de Guardia</p>

        <label className="login-field">
          <span>Correo electrónico</span>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="login-field">
          <span>Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
          {enviando ? 'Autenticando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
