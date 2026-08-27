import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { soundService } from '../services/soundService.js';
import { hapticaService } from '../services/hapticaService.js';
import CronometroLatencia from '../components/CronometroLatencia.jsx';
import ModalResolucion from '../components/ModalResolucion.jsx';

export default function ReanimadorPage() {
  const { user, logout } = useAuth();
  const { incidentes, confirmarAck, registrarEventoClinico, resolver, cargando } = useIncidentes();
  const [incidenteResolviendo, setIncidenteResolviendo] = useState(null);
  const [procesandoAckId, setProcesandoAckId] = useState(null);

  // Encontrar si hay algún incidente que requiera atención inmediata (ACTIVADO o NOTIFICADO)
  const incidenteCritico = incidentes.find(
    (i) => i.estado === 'ACTIVADO' || i.estado === 'NOTIFICADO'
  );

  // Efecto de alarma: si hay un incidente crítico no atendido, sonar, vibrar y mantener pantalla prendida
  useEffect(() => {
    if (incidenteCritico) {
      soundService.start().catch(() => {});
      hapticaService.iniciarAlarma();
    } else {
      soundService.stop();
      hapticaService.detenerAlarma();
    }

    return () => {
      soundService.stop();
      hapticaService.detenerAlarma();
    };
  }, [incidenteCritico]);

  const handleAck = async (incidenteId) => {
    setProcesandoAckId(incidenteId);
    try {
      hapticaService.confirmacion();
      await confirmarAck(incidenteId);
      soundService.stop();
      hapticaService.detenerAlarma();
    } catch (err) {
      hapticaService.error();
      alert(err?.response?.data?.message || err.message || 'Error al confirmar asistencia');
    } finally {
      setProcesandoAckId(null);
    }
  };

  const handleEventoClinico = async (incidenteId, tipoEvento) => {
    try {
      hapticaService.confirmacion();
      await registrarEventoClinico(incidenteId, tipoEvento);
    } catch (err) {
      hapticaService.error();
      alert(err?.response?.data?.message || err.message || 'Error al registrar evento clínico');
    }
  };

  const handleCerrarResolucion = async (resultadoClinico, observaciones) => {
    if (!incidenteResolviendo) return;
    try {
      hapticaService.confirmacion();
      await resolver(incidenteResolviendo.id, resultadoClinico, observaciones);
      setIncidenteResolviendo(null);
    } catch (err) {
      hapticaService.error();
      alert(err?.response?.data?.message || err.message || 'Error al cerrar incidente');
    }
  };

  return (
    <div className="mobile-shell mobile-shell--reanimador">
      {/* Topbar */}
      <header className="mobile-topbar">
        <div className="topbar-left">
          <span className="logo-corazon">🩺</span>
          <div>
            <h1 className="topbar-title">Reanimador Móvil</h1>
            <p className="topbar-sub">Equipo de Respuesta Rápida</p>
          </div>
        </div>
        <div className="topbar-right">
          <span className="user-badge user-badge--reanimador">
            {user?.nombre ? `Dr/a. ${user.nombre}` : 'Reanimador'}
          </span>
          <button type="button" className="btn-logout-mini" onClick={logout} title="Cerrar sesión">
            🚪
          </button>
        </div>
      </header>

      {/* CASO A: ALERTA CRÍTICA ENTRANTE (Pantalla completa de emergencia) */}
      {incidenteCritico ? (
        <main className="alerta-critica-fullscreen">
          <div className="alerta-header">
            <span className="alerta-sirena-icon">🚨</span>
            <h2 className="alerta-header-title">¡CÓDIGO AZUL DISPARADO!</h2>
            <p className="alerta-header-sub">Paro Cardiorrespiratorio en Curso</p>
          </div>

          <div className="alerta-tiempo-box">
            <div className="alerta-tiempo-label">TIEMPO TRANSCURRIDO (LÍMITE 3 MIN AHA)</div>
            <CronometroLatencia createdAt={incidenteCritico.created_at || incidenteCritico.createdAt} />
          </div>

          {/* Información de Ubicación */}
          <div className="alerta-ubicacion-card">
            <div className="ubicacion-row-main">
              <span className="ubicacion-cama-big">
                🛏️ {incidenteCritico.ubicacion?.cama || 'Cama'}
              </span>
              <span className="badge badge--danger">URGENTE</span>
            </div>
            <div className="ubicacion-detalles">
              📍 <strong>{incidenteCritico.ubicacion?.edificio || 'Edificio'}</strong> · Piso {incidenteCritico.ubicacion?.piso} · {incidenteCritico.ubicacion?.sectorSala || incidenteCritico.ubicacion?.sector_sala}
            </div>

            {/* Indicador de Carro de Paro / DEA */}
            <div className={`carro-banner ${incidenteCritico.ubicacion?.tieneCarroParo ? 'carro-banner--si' : 'carro-banner--no'}`}>
              {incidenteCritico.ubicacion?.tieneCarroParo
                ? '🟢 CARRO DE PARO / DEA PRESENTE EN SALA'
                : '⚠️ SALA SIN CARRO — REANIMADOR DEBE TRANSPORTAR DEA MÓVIL'}
            </div>
          </div>

          {/* Botón Gigante de ACK */}
          <div className="alerta-acciones">
            <button
              type="button"
              className="btn-ack-gigante"
              onClick={() => handleAck(incidenteCritico.id)}
              disabled={procesandoAckId === incidenteCritico.id}
            >
              {procesandoAckId === incidenteCritico.id ? (
                'CONFIRMANDO…'
              ) : (
                <>
                  <span>🏃‍♂️</span>
                  <span>CONFIRMAR ASISTENCIA (ACK)</span>
                </>
              )}
            </button>
          </div>
        </main>
      ) : (
        /* CASO B: EN ESPERA / GUARDIA ACTIVA */
        <main className="reanimador-espera-content">
          <div className="radar-box">
            <div className="radar-pulse">
              <div className="radar-circle"></div>
              <div className="radar-circle radar-circle--2"></div>
              <span className="radar-heart">🫀</span>
            </div>
            <h2 className="radar-title">Escuchando Códigos Azules</h2>
            <p className="radar-sub">
              Conexión en tiempo real activa. Si se activa un paro, tu teléfono vibrará y sonará al máximo volumen.
            </p>
            <div className="radar-status-badge">
              <span className="dot dot--green"></span> Guardia Lista
            </div>
          </div>

          {/* Lista de incidentes en atención / curso */}
          <section className="seccion-activos">
            <h3 className="seccion-titulo">Incidentes en Atención ({incidentes.length})</h3>

            {cargando ? (
              <p className="tenue">Cargando estado de la guardia…</p>
            ) : incidentes.length === 0 ? (
              <div className="sin-incidentes-card">
                <p>✅ Ningún Código Azul activo en el hospital en este momento.</p>
              </div>
            ) : (
              <div className="lista-atencion">
                {incidentes.map((inc) => (
                  <div key={inc.id} className="item-atencion-card">
                    <div className="item-atencion-header">
                      <div>
                        <strong>🛏️ {inc.ubicacion?.cama}</strong>
                        <div className="tenue" style={{ fontSize: '0.85rem' }}>
                          {inc.ubicacion?.sectorSala || inc.ubicacion?.sector_sala} · Piso {inc.ubicacion?.piso}
                        </div>
                      </div>
                      <span className={`badge ${inc.estado === 'EN_ATENCION' ? 'badge--success' : 'badge--danger'}`}>
                        {inc.estado === 'EN_ATENCION' ? 'En Atención' : inc.estado}
                      </span>
                    </div>

                    {/* Hitos Clínicos y Cierre ROSC */}
                    <div className="hitos-mini-bar">
                      <button
                        type="button"
                        className="btn-hito-mini"
                        onClick={() => handleEventoClinico(inc.id, 'DESCARGA_AED')}
                        title="1ra Descarga Desfibrilador"
                      >
                        ⚡ 1ra Descarga AED
                      </button>
                      <button
                        type="button"
                        className="btn-hito-mini"
                        onClick={() => handleEventoClinico(inc.id, 'INICIO_RCP')}
                        title="Inicio Compresiones RCP"
                      >
                        🫀 Inicio RCP
                      </button>
                      <button
                        type="button"
                        className="btn-hito-mini"
                        onClick={() => handleEventoClinico(inc.id, 'DROGA_ADRENALINA')}
                        title="Adrenalina 1mg"
                      >
                        💉 Adrenalina
                      </button>
                    </div>

                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn--primary btn--block"
                        style={{ background: 'var(--verde)' }}
                        onClick={() => setIncidenteResolviendo(inc)}
                      >
                        🏥 Cierre Clínico (ROSC)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {/* Modal de Cierre Clínico / Métrica ROSC */}
      <ModalResolucion
        isOpen={Boolean(incidenteResolviendo)}
        onClose={() => setIncidenteResolviendo(null)}
        onSubmit={handleCerrarResolucion}
        incidente={incidenteResolviendo}
      />
    </div>
  );
}
