import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { incidentesService } from '../services/incidentesService.js';
import { hapticaService } from '../services/hapticaService.js';
import { offlineQueue } from '../services/offlineQueue.js';
import SelectorUbicacionModal from '../components/SelectorUbicacionModal.jsx';

const DURACION_HOLD_MS = 800;

export default function PanicoPage() {
  const { user, logout } = useAuth();
  const [cama, setCama] = useState(null);
  const [modalSelectorAbierto, setModalSelectorAbierto] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [notificacion, setNotificacion] = useState(null);

  const holdTimerRef = useRef(null);
  const animFrameRef = useRef(null);
  const startTimeRef = useRef(0);

  // Cargar última cama seleccionada desde localStorage
  useEffect(() => {
    try {
      const guardada = localStorage.getItem('codigo_azul_cama_seleccionada');
      if (guardada) {
        setCama(JSON.parse(guardada));
      } else {
        // Cargar primera cama por defecto
        incidentesService.listarUbicaciones().then((lista) => {
          if (Array.isArray(lista) && lista.length > 0) {
            setCama(lista[0]);
            localStorage.setItem('codigo_azul_cama_seleccionada', JSON.stringify(lista[0]));
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Escuchar alertas offline entregadas con éxito
  useEffect(() => {
    const handler = (ev) => {
      hapticaService.confirmacion();
      setNotificacion({
        tipo: 'exito',
        titulo: 'RECONEXIÓN EXITOSA',
        mensaje: `Alarma previamente encolada por falta de señal entregada con éxito (#${ev.detail?.id || 'OK'})`,
      });
      setTimeout(() => setNotificacion(null), 6000);
    };
    window.addEventListener('codigo_azul:alerta_despachada_offline', handler);
    return () => window.removeEventListener('codigo_azul:alerta_despachada_offline', handler);
  }, []);

  const iniciarHold = (e) => {
    e.preventDefault();
    if (!cama) {
      hapticaService.error();
      setNotificacion({
        tipo: 'error',
        titulo: 'Ubicación requerida',
        mensaje: 'Seleccioná primero la sala y cama de la emergencia.',
      });
      return;
    }

    hapticaService.toque();
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const transcurrido = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (transcurrido / DURACION_HOLD_MS) * 100);
      setProgreso(pct);

      if (transcurrido < DURACION_HOLD_MS) {
        animFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        cancelarHold();
        setModalConfirmarAbierto(true);
        hapticaService.confirmacion();
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const cancelarHold = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    setProgreso(0);
  };

  const dispararAlarma = async () => {
    if (!cama) return;
    setEnviando(true);
    try {
      const res = await incidentesService.activar(cama.id);
      hapticaService.alarma();
      setModalConfirmarAbierto(false);
      setNotificacion({
        tipo: 'exito',
        titulo: '🚨 CÓDIGO AZUL ACTIVADO',
        mensaje: `Alarma despachada correctamente en ${cama.cama} (#${res.id || res.incidenteId})`,
      });
      setTimeout(() => setNotificacion(null), 8000);
    } catch (err) {
      // Error de red / sin Wi-Fi: Tolerancia offline (Outbox pattern)
      if (!err.response) {
        offlineQueue.encolar(cama.id);
        hapticaService.error();
        setModalConfirmarAbierto(false);
        setNotificacion({
          tipo: 'aviso',
          titulo: '⚠️ MODO FUERA DE LÍNEA (Zona Muerta)',
          mensaje: 'Sin conexión Wi-Fi. Alarma encolada localmente: se reintenta automáticamente con backoff.',
        });
      } else {
        hapticaService.error();
        setNotificacion({
          tipo: 'error',
          titulo: 'Error al activar',
          mensaje: err.response?.data?.message || err.message || 'No se pudo enviar la alerta.',
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  const tieneCarro = cama ? (cama.tiene_carro_paro ?? cama.tieneCarroParo) : false;

  return (
    <div className="mobile-shell">
      {/* Barra superior */}
      <header className="mobile-topbar">
        <div className="topbar-left">
          <span className="logo-corazon">🫀</span>
          <div>
            <h1 className="topbar-title">Código Azul</h1>
            <p className="topbar-sub">Disparo de Emergencia</p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="user-badge">{user?.nombre || 'Médico'}</span>
          <button type="button" className="btn-logout-mini" onClick={logout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </header>

      {/* Banner de Notificación / Toast */}
      {notificacion && (
        <div className={`alerta-banner alerta-banner--${notificacion.tipo}`}>
          <div className="alerta-banner-title">{notificacion.titulo}</div>
          <div className="alerta-banner-msg">{notificacion.mensaje}</div>
        </div>
      )}

      <main className="mobile-content">
        {/* Selector de Ubicación */}
        <button
          type="button"
          className="ubicacion-card"
          onClick={() => setModalSelectorAbierto(true)}
        >
          <div className="ubicacion-tag">UBICACIÓN SELECCIONADA (Tocá para cambiar)</div>
          {cama ? (
            <>
              <div className="ubicacion-nombre">
                📍 {cama.edificio} · Piso {cama.piso} · {cama.sector_sala || cama.sectorSala}
              </div>
              <div className="ubicacion-cama">🛏️ {cama.cama}</div>
              <div className={`carro-badge ${tieneCarro ? 'carro-badge--si' : 'carro-badge--no'}`}>
                {tieneCarro
                  ? '🟢 Carro de Paro / AED asignado en sala'
                  : '⚠️ Sala SIN Carro — Reanimador debe transportar DEA'}
              </div>
            </>
          ) : (
            <div className="ubicacion-vacia">Sin ubicación — tocá para elegir cama</div>
          )}
        </button>

        {/* Botón Central de Pánico con Aro de Progreso */}
        <div className="panico-contenedor">
          <button
            type="button"
            className={`panico-boton ${progreso > 0 ? 'panico-boton--holding' : ''}`}
            onPointerDown={iniciarHold}
            onPointerUp={cancelarHold}
            onPointerLeave={cancelarHold}
            onPointerCancel={cancelarHold}
            aria-label="Botón de Código Azul (mantené 0,8 s)"
          >
            <svg className="aro-svg" viewBox="0 0 240 240">
              <circle className="aro-fondo" cx="120" cy="120" r="110" />
              <circle
                className="aro-progreso"
                cx="120"
                cy="120"
                r="110"
                style={{
                  strokeDasharray: 691.15,
                  strokeDashoffset: 691.15 - (691.15 * progreso) / 100,
                }}
              />
            </svg>

            <div className="panico-inner">
              <div className="panico-tag">CÓDIGO AZUL</div>
              <div className="panico-icon">⚡</div>
              <div className="panico-instruccion">
                {progreso > 0 ? 'MANTENIENDO…' : 'Mantené 0.8s'}
              </div>
            </div>
          </button>

          <p className="panico-ayuda">
            Mantené presionado el botón circular durante <strong>0.8 s</strong> para prevenir disparos accidentales.
          </p>
        </div>
      </main>

      {/* Modal de Selector de Ubicación */}
      <SelectorUbicacionModal
        isOpen={modalSelectorAbierto}
        onClose={() => setModalSelectorAbierto(false)}
        ubicacionActual={cama}
        onSelect={(nuevaCama) => setCama(nuevaCama)}
      />

      {/* Modal de Confirmación de Disparo */}
      {modalConfirmarAbierto && (
        <div className="modal-backdrop">
          <div className="modal modal--confirmar-panico">
            <div className="modal-header">
              <h2 className="modal-title">🚨 Confirmar Disparo de Código Azul</h2>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                Vas a notificar en tiempo real a todo el equipo de reanimación hospitalario para la siguiente ubicación:
              </p>
              <div className="resumen-box">
                <div><strong>Edificio:</strong> {cama?.edificio}</div>
                <div><strong>Piso:</strong> {cama?.piso}</div>
                <div><strong>Sector/Sala:</strong> {cama?.sector_sala || cama?.sectorSala}</div>
                <div><strong>Cama:</strong> {cama?.cama}</div>
                <div style={{ marginTop: '8px' }}>
                  {tieneCarro ? (
                    <span className="badge badge--success">🟢 Carro de Paro presente</span>
                  ) : (
                    <span className="badge badge--warning">⚠️ Requiere traslado de DEA móvil</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setModalConfirmarAbierto(false)}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={dispararAlarma}
                disabled={enviando}
              >
                {enviando ? 'Despachando…' : '¡Disparar Código Azul Ahora!'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
