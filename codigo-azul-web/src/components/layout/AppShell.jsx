// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/components/layout/AppShell.jsx
// Layout principal (Sidebar + Topbar + Menú responsive + Dropdowns)
// Replica 1:1 la estructura, clases y comportamiento de la suite.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import Icono from '../common/Icono.jsx';
import { initialNotificaciones } from '../../data/mockData.js';

const MENU_ITEMS = [
  { grupo: 'Operación' },
  { ruta: 'dashboard',       label: 'Dashboard',        icono: 'dashboard', titulo: 'Dashboard' },
  { ruta: 'tablero',         label: 'Tablero en vivo',  icono: 'tablero',   titulo: 'Tablero en Vivo' },
  { ruta: 'historial',       label: 'Historial',        icono: 'historial', titulo: 'Historial de Eventos' },
  { ruta: 'reportes',        label: 'Reportes',         icono: 'reportes',  titulo: 'Reportes y Métricas' },
  { grupo: 'Gestión' },
  { ruta: 'pacientes',       label: 'Pacientes',        icono: 'pacientes', titulo: 'Gestión de Pacientes' },
  { ruta: 'usuarios',        label: 'Usuarios',         icono: 'usuarios',       soloAdmin: true, titulo: 'Administración de Usuarios' },
  { ruta: 'areas',           label: 'Áreas',            icono: 'areas',          soloAdmin: true, titulo: 'Áreas y Pabellones' },
  { ruta: 'configuracion',   label: 'Configuración',    icono: 'configuracion',  soloAdmin: true, titulo: 'Configuración del Sistema' },
  { grupo: 'Otros' },
  { ruta: 'mobile-preview',  label: 'Vista mobile',     icono: 'mobile',    titulo: 'Simulador App Móvil' },
  { ruta: 'perfil',          label: 'Mi perfil',        icono: 'perfil',    titulo: 'Mi Perfil' },
  { ruta: 'notificaciones',  label: 'Notificaciones',   icono: 'notificaciones', titulo: 'Centro de Notificaciones' },
  { ruta: 'ayuda',           label: 'Ayuda',            icono: 'ayuda',     titulo: 'Ayuda y Protocolos' },
];

export default function AppShell() {
  const { user, rol, logout, cambiarRol } = useAuth();
  const { tema, toggleTema, toast, confirmar, haceCuanto } = useUI();
  const location = useLocation();
  const navigate = useNavigate();

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownNotifAbierto, setDropdownNotifAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState(initialNotificaciones);
  const notifBtnRef = useRef(null);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
    setDropdownNotifAbierto(false);
  }, [location.pathname]);

  // Obtener el título dinámico según la ruta activa
  const rutaActual = location.pathname.replace('/', '') || 'dashboard';
  const itemActual = MENU_ITEMS.find((m) => m.ruta === rutaActual);
  const tituloPagina = itemActual ? itemActual.titulo : 'Dashboard';

  const notifNoLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const handleLogout = async () => {
    const ok = await confirmar({
      titulo: 'Cerrar sesión',
      mensaje: '¿Estás seguro de que querés cerrar tu sesión?',
      textoOk: 'Cerrar sesión',
      peligroso: true,
    });
    if (ok) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleRolSwitch = (e) => {
    const nuevoRol = e.target.value;
    cambiarRol(nuevoRol);
    toast({
      titulo: 'Rol cambiado',
      msj: `Ahora navegás como ${nuevoRol === 'admin' ? 'Administrador' : 'Enfermero/a'}`,
      tipo: 'info',
    });
  };

  const handleMarcarTodasLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    setDropdownNotifAbierto(false);
    toast({ titulo: 'Notificaciones leídas', msj: 'Todas las alertas fueron marcadas como leídas.', tipo: 'exito' });
  };

  return (
    <div className="app-shell" data-menu-abierto={menuAbierto ? '1' : undefined}>
      {/* ─── Sidebar Principal ───────────────────────────────────── */}
      <aside className="sidebar">
        <div className="marca">
          <div className="logo">
            <Icono nombre="corazon" size={22} color="#ffffff" />
          </div>
          <div>
            <div className="nombre">Código Azul</div>
            <div className="subtitulo">Hospital Municipal</div>
          </div>
        </div>

        <nav>
          {MENU_ITEMS.map((m, idx) => {
            if (m.grupo) {
              return (
                <div key={idx} className="nav-grupo">
                  {m.grupo}
                </div>
              );
            }
            const bloqueado = m.soloAdmin && rol !== 'admin';

            return (
              <NavLink
                key={m.ruta}
                to={`/${m.ruta}`}
                data-ruta={m.ruta}
                className={({ isActive }) => `nav-item ${isActive ? 'activo' : ''}`}
                aria-disabled={bloqueado ? 'true' : undefined}
                title={bloqueado ? 'Requiere rol Administrador' : undefined}
                onClick={(e) => {
                  if (bloqueado) {
                    e.preventDefault();
                    toast({
                      titulo: 'Acceso restringido',
                      msj: 'Esta sección requiere permisos de Administrador.',
                      tipo: 'aviso',
                    });
                  }
                }}
              >
                <Icono nombre={m.icono} size={18} />
                <span>{m.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="usuario-card">
          <img
            className="avatar"
            src={user?.avatar}
            alt={user?.nombreCompleto || user?.nombre || 'Usuario'}
          />
          <div>
            <div className="nombre">{user?.nombreCompleto || user?.nombre || 'Usuario'}</div>
            <div className="rol">{rol === 'admin' ? 'Administrador' : 'Enfermero/a'}</div>
          </div>
          <button
            type="button"
            title="Cerrar sesión"
            id="btnSalir"
            onClick={handleLogout}
          >
            <Icono nombre="salir" size={18} />
          </button>
        </div>
      </aside>

      {/* Backdrop móvil */}
      <div
        className="backdrop-menu"
        id="backdropMenu"
        onClick={() => setMenuAbierto(false)}
      />

      {/* ─── Contenedor Central ─────────────────────────────────── */}
      <div className="contenido">
        {/* Topbar */}
        <div className="topbar">
          <button
            type="button"
            className="hamburguesa"
            id="btnMenu"
            aria-label="Menú"
            onClick={() => setMenuAbierto((prev) => !prev)}
          >
            <Icono nombre="menu" size={22} />
          </button>

          <h2 className="titulo" id="tituloPagina">
            {tituloPagina}
          </h2>

          <div className="buscador">
            <Icono nombre="lupa" size={18} />
            <input
              type="text"
              placeholder="Buscar pacientes, llamados, áreas..."
              aria-label="Buscar"
            />
          </div>

          <div className="acciones">
            <div className="rol-switch" title="Cambiar rol para demostración">
              <span>DEMO</span>
              <select id="rolSwitch" value={rol} onChange={handleRolSwitch}>
                <option value="admin">Administrador</option>
                <option value="enfermero">Enfermero/a</option>
              </select>
            </div>

            <button
              type="button"
              className="icono-btn"
              id="btnTema"
              title="Cambiar tema"
              onClick={toggleTema}
            >
              <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} size={20} />
            </button>

            <button
              ref={notifBtnRef}
              type="button"
              className="icono-btn"
              id="btnNotif"
              title="Notificaciones"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownNotifAbierto((prev) => !prev);
              }}
            >
              <Icono nombre="campana" size={20} />
              {notifNoLeidas > 0 && <span className="badge">{notifNoLeidas}</span>}
            </button>
          </div>
        </div>

        {/* Dropdown flotante de Notificaciones */}
        {dropdownNotifAbierto && (
          <div
            className="dropdown"
            id="dropdownNotif"
            style={{
              position: 'fixed',
              top: `${(notifBtnRef.current?.getBoundingClientRect().bottom || 68) + 8}px`,
              right: '24px',
            }}
          >
            <div className="cab">
              <strong>Notificaciones</strong>
              <button
                type="button"
                className="btn btn-fantasma btn-sm"
                id="marcarLeidas"
                onClick={handleMarcarTodasLeidas}
              >
                Marcar todas
              </button>
            </div>
            <div className="lista">
              {notificaciones.slice(0, 6).map((n) => (
                <div
                  key={n.id}
                  className={`item ${n.leida ? 'leida' : ''}`}
                  onClick={() => {
                    setNotificaciones((prev) =>
                      prev.map((item) => (item.id === n.id ? { ...item, leida: true } : item))
                    );
                  }}
                >
                  <span className="puntito" />
                  <div className="txt">
                    {n.texto}
                    <div className="hora">{haceCuanto(n.hora)}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pie">
              <NavLink
                to="/notificaciones"
                id="verNotif"
                onClick={() => setDropdownNotifAbierto(false)}
              >
                Ver todas las notificaciones
              </NavLink>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
