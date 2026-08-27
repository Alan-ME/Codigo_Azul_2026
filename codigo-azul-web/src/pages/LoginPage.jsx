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

  const onSubmit = async (e, customEmail = null, customPass = null) => {
    if (e) e.preventDefault();
    setError('');
    setEnviando(true);
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      const usr = await login(targetEmail.trim(), targetPass);
      // Desbloqueamos el AudioContext dentro del mismo gesto del usuario.
      soundService.prime().catch(() => { /* sin sonido si el navegador lo bloquea */ });

      // Redirección inteligente según el rol hospitalario
      if (usr.rol === 'REANIMADOR_MEDICO') {
        navigate('/reanimador', { replace: true });
      } else if (usr.rol === 'MEDICO_ACTIVADOR') {
        navigate('/alarma', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error de autenticación.');
    } finally {
      setEnviando(false);
    }
  };

  const loginRapido = (usuarioDemo) => {
    setEmail(usuarioDemo);
    setPassword('azul123');
    onSubmit(null, usuarioDemo, 'azul123');
  };

  return (
    <div className="login-shell">
      <form className="login-card" onSubmit={onSubmit}>
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '2.5rem' }}>🫀</span>
          <h1 className="login-title">Código Azul</h1>
          <p className="login-subtitle">Plataforma Hospitalaria de Emergencia</p>
        </div>

        <label className="login-field">
          <span>Usuario o Correo</span>
          <input
            type="text"
            autoComplete="username"
            placeholder="ej. enfermero o correo@hospital.gob.ar"
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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn--primary btn--block" disabled={enviando}>
          {enviando ? 'Autenticando…' : 'Ingresar'}
        </button>

        {/* Accesos rápidos de DEMO para el jurado */}
        <div className="demo-accesos">
          <p className="demo-accesos-label">Accesos rápidos DEMO</p>
          <div className="demo-grid">
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => loginRapido('enfermero')}
              disabled={enviando}
            >
              👩‍⚕️ Enfermero/a (Pánico)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => loginRapido('reanimador')}
              disabled={enviando}
            >
              🩺 Reanimador/a (ACK)
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => loginRapido('guardia')}
              disabled={enviando}
            >
              🖥️ Operador Guardia
            </button>
            <button
              type="button"
              className="btn-demo-pill"
              onClick={() => loginRapido('admin')}
              disabled={enviando}
            >
              🛡️ Administrador
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
