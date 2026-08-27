// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/LoginPage.jsx
// Pantalla de Login institucional 1:1 idéntica a la suite hospitalaria.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';

export default function LoginPage() {
  const { isAuthenticated, isBackendOnline, login } = useAuth();
  const { abrirModal, cerrarModal } = useUI();
  const navigate = useNavigate();

  const [emailOrUser, setEmailOrUser] = useState(
    isBackendOnline ? 'medico.activador@hospital.gob.ar' : 'jmolina'
  );
  const [password, setPassword] = useState(
    isBackendOnline ? 'Password123!' : 'demo1234'
  );
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const modoIndicador = isBackendOnline ? (
    <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>
      En Vivo (PostgreSQL)
    </span>
  ) : (
    <span style={{ color: '#F59E0B', fontSize: '12px', fontWeight: 600 }}>
      Demo (Datos Mock)
    </span>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);

    try {
      if (isBackendOnline) {
        await login({ email: emailOrUser.trim(), password });
      } else {
        await login({ usuario: emailOrUser.trim(), password });
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error de autenticación.');
    } finally {
      setEnviando(false);
    }
  };

  const handleDemoLogin = async (rol) => {
    setError('');
    setEnviando(true);
    try {
      await login({ rol });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Error al ingresar en modo demo.');
    } finally {
      setEnviando(false);
    }
  };

  const handleOlvidaste = (e) => {
    e.preventDefault();
    abrirModal({
      titulo: 'Recuperar contraseña',
      angosto: true,
      cuerpo: (
        <p>
          Contacta al área de <strong>Sistemas del Hospital</strong> al interno{' '}
          <strong>2010</strong> o al correo{' '}
          <a href="mailto:sistemas@hospital.gob.ar">sistemas@hospital.gob.ar</a>{' '}
          para restablecer tu clave.
        </p>
      ),
      pie: (
        <button type="button" className="btn btn-primario" onClick={cerrarModal}>
          Entendido
        </button>
      ),
    });
  };

  return (
    <div className="login-fondo">
      <div className="login-tarjeta aparecer">
        <div className="login-marca">
          <div className="logo">
            <Icono nombre="corazon" size={22} color="#ffffff" />
          </div>
          <div>
            <h1>Codigo Azul</h1>
            <p>Sistema hospitalario - ONETP 2026</p>
          </div>
        </div>

        <h2>Inicia sesion</h2>
        <p className="subtitulo">
          Ingresa con tus credenciales institucionales para acceder al panel. {modoIndicador}
        </p>

        {error && (
          <div
            id="loginError"
            style={{
              display: 'block',
              color: '#DC2626',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '12px',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} id="formLogin">
          {isBackendOnline ? (
            <>
              <div className="campo">
                <label htmlFor="usr">Email institucional</label>
                <input
                  id="usr"
                  type="email"
                  placeholder="usuario@hospital.gob.ar"
                  required
                  autoComplete="username"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="pass">Contraseña</label>
                <input
                  id="pass"
                  type="password"
                  placeholder="Password123!"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="campo">
                <label htmlFor="usr">Usuario</label>
                <input
                  id="usr"
                  type="text"
                  placeholder="usuario.hospital"
                  required
                  autoComplete="username"
                  value={emailOrUser}
                  onChange={(e) => setEmailOrUser(e.target.value)}
                />
              </div>
              <div className="campo">
                <label htmlFor="pass">Contraseña</label>
                <input
                  id="pass"
                  type="password"
                  placeholder="demo1234"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="opciones">
            <label className="check">
              <input type="checkbox" defaultChecked /> Recordarme
            </label>
            <a href="#olvido" onClick={handleOlvidaste}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button
            className="btn btn-primario btn-bloque btn-lg"
            type="submit"
            disabled={enviando}
          >
            {enviando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="demo">
          <p>Accesos rapidos DEMO</p>
          <div className="demo-fila">
            <button
              type="button"
              className="btn btn-secundario"
              disabled={enviando}
              onClick={() => handleDemoLogin('admin')}
            >
              Entrar como Administrador
            </button>
            <button
              type="button"
              className="btn btn-secundario"
              disabled={enviando}
              onClick={() => handleDemoLogin('enfermero')}
            >
              Entrar como Enfermero
            </button>
          </div>
        </div>

        <p className="login-pie">&copy; 2026 - Hospital Municipal - ONETP Programacion</p>
      </div>
    </div>
  );
}
