// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/AlertaReanimadorScreen.jsx
// Pantalla de alerta de emergencia con cronómetro, ubicación, sirena y ACK
// ─────────────────────────────────────────────────────────────

export default function AlertaReanimadorScreen({
  incidenteActivo,
  edificioSel,
  pisoSel,
  salaSel,
  camaSel,
  cronometroTexto,
  sirenaSilenciada,
  onConfirmarACK,
  onToggleSirena,
  onFinalizarAtencion,
}) {
  return (
    <div
      style={{
        flex: 1,
        background: 'radial-gradient(circle at 50% 30%, #581c87, #450a0a 40%, #0a0f1d 80%)',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        textAlign: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: '#f87171',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            marginBottom: '4px',
          }}
        >
          🚨 ALERTA DE CÓDIGO AZUL RECIBIDA
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
          EMERGENCIA EN CURSO
        </h1>
        <div
          style={{
            fontSize: '30px',
            fontFamily: 'monospace',
            fontWeight: 700,
            color: '#38bdf8',
            margin: '8px 0',
          }}
        >
          ⏱️ {cronometroTexto}
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '16px',
          textAlign: 'left',
        }}
      >
        <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase' }}>
          Ubicación Paciente
        </div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
          {incidenteActivo?.ubicacion?.edificio || edificioSel?.nombre} · {incidenteActivo?.ubicacion?.piso || pisoSel?.nombre}
        </div>
        <div style={{ fontSize: '14.5px', color: '#cbd5e1', marginTop: '2px' }}>
          {incidenteActivo?.ubicacion?.sectorSala || salaSel?.nombre} —{' '}
          <strong style={{ color: '#f87171' }}>{incidenteActivo?.ubicacion?.cama || camaSel}</strong>
        </div>
        {incidenteActivo?.atendido && (
          <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 700, fontSize: '12px' }}>
            ✓ Asistencia confirmada por médico
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        <button
          type="button"
          onClick={onConfirmarACK}
          style={{
            background: incidenteActivo?.atendido ? '#047857' : '#16a34a',
            color: '#ffffff',
            border: 'none',
            borderRadius: '14px',
            padding: '16px',
            fontSize: '15px',
            fontWeight: 800,
            textTransform: 'uppercase',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(22, 163, 74, 0.4)',
          }}
        >
          {incidenteActivo?.atendido ? '✓ ASISTENCIA CONFIRMADA' : '✅ CONFIRMAR ASISTENCIA (ACK)'}
        </button>

        <button
          type="button"
          onClick={onToggleSirena}
          style={{
            background: sirenaSilenciada ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '11px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {sirenaSilenciada ? '🔊 Reactivar Sirena Sonora' : '🔇 Silenciar Sirena'}
        </button>

        <button
          type="button"
          onClick={onFinalizarAtencion}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Finalizar Atención / Cerrar
        </button>
      </div>
    </div>
  );
}
