// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/AlertaReanimadorScreen.jsx
// Pantalla de alerta crítica para Médico Reanimador.
// Diseñada para máxima ergonomía, legibilidad bajo estrés,
// targets táctiles de gran tamaño y ubicación ultra-prominente.
// ─────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import Icono from '../../common/Icono.jsx';

export default function AlertaReanimadorScreen({
  incidenteActivo,
  todosLosIncidentes = [],
  incidenteSeleccionadoIndex = 0,
  onSeleccionarIncidente,
  edificioSel,
  pisoSel,
  salaSel,
  camaSel,
  cronometroTexto,
  sirenaSilenciada,
  onConfirmarACK,
  onToggleSirena,
  onFinalizarAtencion,
  puedeFinalizar = true,
  segundosADuracion,
  tiempoActual = Date.now(),
}) {
  const estaAtendido = !!incidenteActivo?.atendido;
  const hayConcurrentes = todosLosIncidentes.length > 1;

  // Incidentes pendientes distintos al actual
  const incidentesPendientesOtros = useMemo(() => {
    return todosLosIncidentes.filter(
      (inc, idx) => !inc.atendido && idx !== incidenteSeleccionadoIndex
    );
  }, [todosLosIncidentes, incidenteSeleccionadoIndex]);

  const ubicacionTexto = {
    edificio: incidenteActivo?.ubicacion?.edificio || edificioSel?.nombre || 'Monoblock Central',
    piso: incidenteActivo?.ubicacion?.piso || pisoSel?.nombre || 'Piso 1',
    sector: incidenteActivo?.ubicacion?.sectorSala || salaSel?.nombre || 'Guardia General',
    cama: incidenteActivo?.ubicacion?.cama || camaSel || 'Cama 01',
    activadoPor: incidenteActivo?.enfermeroNombre || 'Enfermería de Guardia',
  };

  return (
    <div
      style={{
        flex: 1,
        minHeight: 'min-content',
        background: estaAtendido
          ? 'radial-gradient(circle at 50% 15%, #064e3b, #042f2e 45%, #0a0f1d 85%)'
          : 'radial-gradient(circle at 50% 15%, #7f1d1d, #450a0a 45%, #0a0f1d 85%)',
        padding: '16px 16px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        gap: '14px',
        transition: 'background 0.5s ease',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* 1. Banner Superior de Alertas Concurrentes */}
        {incidentesPendientesOtros.length > 0 && (
          <div
            onClick={() => {
              const nextPendingIdx = todosLosIncidentes.findIndex((x) => !x.atendido);
              if (nextPendingIdx >= 0 && onSeleccionarIncidente) {
                onSeleccionarIncidente(nextPendingIdx);
              }
            }}
            style={{
              background: 'linear-gradient(90deg, #dc2626, #b91c1c)',
              color: '#ffffff',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '12px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(220, 38, 38, 0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              border: '1.5px solid rgba(255, 255, 255, 0.4)',
              animation: 'pulso 1.5s ease-in-out infinite',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fef08a' }}>
                🚨 {incidentesPendientesOtros.length === 1 ? '¡CÓDIGO AZUL ADICIONAL SIN ASIGNAR!' : `¡${incidentesPendientesOtros.length} CÓDIGOS AZULES SIN ASIGNAR!`}
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '2px' }}>
                {incidentesPendientesOtros[0]?.ubicacion?.sectorSala || 'Sector'} · {incidentesPendientesOtros[0]?.ubicacion?.cama || 'Cama'}
              </div>
            </div>
            <div style={{ background: '#ffffff', color: '#dc2626', borderRadius: '8px', padding: '6px 10px', fontSize: '12px', fontWeight: 900 }}>
              VER ➔
            </div>
          </div>
        )}

        {/* 2. Carrusel Horizontal de Incidentes Concurrentes */}
        {hayConcurrentes && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '12px',
              justifyContent: todosLosIncidentes.length <= 2 ? 'center' : 'flex-start',
            }}
          >
            {todosLosIncidentes.map((inc, idx) => {
              const esActual = idx === incidenteSeleccionadoIndex;
              const atend = inc.atendido;
              const inicio = new Date(inc.horaInicio).getTime();
              const seg = Math.max(0, Math.floor((tiempoActual - inicio) / 1000));
              const crono = segundosADuracion ? segundosADuracion(seg) : `${Math.floor(seg / 60)}:${seg % 60 < 10 ? '0' : ''}${seg % 60}`;

              return (
                <button
                  key={inc.id || idx}
                  type="button"
                  onClick={() => onSeleccionarIncidente && onSeleccionarIncidente(idx)}
                  style={{
                    flex: '0 0 auto',
                    background: esActual
                      ? atend
                        ? 'rgba(16, 185, 129, 0.35)'
                        : 'rgba(239, 68, 68, 0.45)'
                      : 'rgba(255, 255, 255, 0.08)',
                    border: esActual
                      ? atend
                        ? '2px solid #34d399'
                        : '2px solid #ef4444'
                      : '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '8px 12px',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '120px',
                    transform: esActual ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: atend ? '#34d399' : '#fca5a5' }}>
                      {atend ? '✓ ATENDIENDO' : '🚨 PENDIENTE'}
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc' }}>
                      {crono}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {inc.ubicacion?.sectorSala || `Emergencia ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    {inc.ubicacion?.cama || 'Cama'}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Encabezado de Estado y Cronómetro Dominante */}
        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: estaAtendido ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.25)',
              border: estaAtendido ? '1px solid #10b981' : '1px solid #ef4444',
              color: estaAtendido ? '#34d399' : '#fca5a5',
              fontSize: '11.5px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: estaAtendido ? '#34d399' : '#ef4444', display: 'inline-block' }} />
            {estaAtendido ? '✓ ASISTENCIA CONFIRMADA' : '🚨 ALERTA MÉDICA EN CURSO'}
            {hayConcurrentes && ` (${incidenteSeleccionadoIndex + 1}/${todosLosIncidentes.length})`}
          </div>

          <h1
            style={{
              fontSize: '24px',
              fontWeight: 900,
              color: '#ffffff',
              margin: '2px 0 6px',
              letterSpacing: '-0.02em',
            }}
          >
            {estaAtendido ? 'RCP Y ATENCIÓN EN PROCESO' : 'CÓDIGO AZUL ACTIVADO'}
          </h1>

          {/* Cronómetro Dominante */}
          <div
            style={{
              display: 'inline-block',
              background: 'rgba(0, 0, 0, 0.45)',
              border: estaAtendido ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '16px',
              padding: '6px 20px',
              boxShadow: estaAtendido ? '0 4px 20px rgba(16, 185, 129, 0.2)' : '0 4px 25px rgba(239, 68, 68, 0.3)',
            }}
          >
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
              TIEMPO TRANSCURRIDO
            </div>
            <div
              style={{
                fontSize: '40px',
                fontFamily: 'monospace',
                fontWeight: 900,
                color: estaAtendido ? '#34d399' : '#f87171',
                lineHeight: 1.1,
                letterSpacing: '0.02em',
              }}
            >
              {cronometroTexto}
            </div>
          </div>
        </div>

        {/* 4. Tarjeta de Ubicación Ultra-Prominente */}
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: estaAtendido ? '2px solid #10b981' : '2px solid #ef4444',
            borderRadius: '20px',
            padding: '16px 18px',
            textAlign: 'left',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              📍 UBICACIÓN EXACTA DEL PACIENTE
            </div>
            <div
              style={{
                background: estaAtendido ? '#064e3b' : '#7f1d1d',
                color: estaAtendido ? '#6ee7b7' : '#fca5a5',
                fontSize: '11px',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              CRÍTICO
            </div>
          </div>

          <div style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', lineHeight: 1.2 }}>
            {ubicacionTexto.sector}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
            <div
              style={{
                background: estaAtendido ? '#10b981' : '#dc2626',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 900,
                padding: '6px 14px',
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              }}
            >
              🛏️ {ubicacionTexto.cama}
            </div>
            <div style={{ fontSize: '13.5px', color: '#cbd5e1', fontWeight: 600 }}>
              🏢 {ubicacionTexto.edificio} · {ubicacionTexto.piso}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '12px', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Activado por: <strong style={{ color: '#ffffff' }}>{ubicacionTexto.activadoPor}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Prioridad: <strong style={{ color: '#f87171' }}>MÁXIMA</strong>
            </div>
          </div>
        </div>

        {/* 5. Estado de Confirmación de Reanimadores */}
        <div
          style={{
            marginTop: '10px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: estaAtendido ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.18)',
            border: estaAtendido ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '20px' }}>
            {estaAtendido ? '👨‍⚕️' : '⚠️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: estaAtendido ? '#34d399' : '#fca5a5' }}>
              {estaAtendido ? 'Reanimador en Sitio / Atención Iniciada' : 'Asistencia Médica Pendiente (ACK)'}
            </div>
            <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '1px' }}>
              {estaAtendido
                ? `Responsable: ${incidenteActivo?.reanimadorNombre || 'Dr. Ivan Cardozo'}`
                : 'Presioná el botón verde abajo para confirmar tu llegada y silenciar la alerta central.'}
            </div>
          </div>
        </div>
      </div>

      {/* 6. Botones de Acción de Gran Tamaño (Diseñados para Estrés / Guantes) */}
      <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
        {!estaAtendido ? (
          <button
            type="button"
            onClick={() => onConfirmarACK && onConfirmarACK(incidenteActivo.id)}
            style={{
              background: '#16a34a',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              height: '62px',
              fontSize: '16.5px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(22, 163, 74, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'transform 0.1s ease',
            }}
          >
            <Icono nombre="check" size={24} color="#ffffff" />
            <span>CONFIRMAR ASISTENCIA (ACK)</span>
          </button>
        ) : puedeFinalizar ? (
          <button
            type="button"
            onClick={() => onFinalizarAtencion && onFinalizarAtencion(incidenteActivo.id)}
            style={{
              background: '#059669',
              color: '#ffffff',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '16px',
              height: '62px',
              fontSize: '16px',
              fontWeight: 900,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(5, 150, 105, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <span>🏁 FINALIZAR ATENCIÓN / RESOLVER</span>
          </button>
        ) : (
          <div style={{ display: 'grid', gap: '8px' }}>
            <button
              type="button"
              onClick={() => onConfirmarACK && onConfirmarACK(incidenteActivo.id)}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '16px',
                height: '56px',
                fontSize: '15px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(22, 163, 74, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Icono nombre="check" size={20} color="#ffffff" />
              <span>➕ SUMARME AL EQUIPO DE RCP (ACK)</span>
            </button>
            <button
              type="button"
              disabled
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#94a3b8',
                borderRadius: '12px',
                height: '42px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'not-allowed',
                opacity: 0.6,
              }}
              title="Solo el personal médico que confirmó asistencia o un Administrador pueden finalizar el Código Azul."
            >
              🔒 Finalizar (Solo participantes del equipo)
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleSirena}
          style={{
            background: sirenaSilenciada ? 'rgba(11, 95, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)',
            border: '1.5px solid rgba(255, 255, 255, 0.25)',
            color: '#ffffff',
            borderRadius: '14px',
            height: '48px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>{sirenaSilenciada ? '🔊 Reactivar Sirena Sonora' : '🔇 Silenciar Sirena'}</span>
        </button>

        {!estaAtendido && (
          <button
            type="button"
            onClick={() => onFinalizarAtencion && onFinalizarAtencion(incidenteActivo.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              padding: '6px',
              fontSize: '12.5px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Descartar o Cerrar Emergencia
          </button>
        )}
      </div>
    </div>
  );
}
