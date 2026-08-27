// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/PanicoScreen.jsx
// Pantalla de activación con botón de pánico de retención 0.8s
// ─────────────────────────────────────────────────────────────

import Icono from '../../common/Icono.jsx';

export default function PanicoScreen({
  edificioSel,
  salaSel,
  camaSel,
  armando,
  onAbrirSelector,
  onPointerDown,
  onPointerCancel,
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 18px',
        textAlign: 'center',
      }}
    >
      {/* Card de Ubicación */}
      <button
        type="button"
        onClick={onAbrirSelector}
        style={{
          width: '100%',
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '12px 14px',
          textAlign: 'left',
          cursor: 'pointer',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px',
        }}
      >
        <div
          style={{
            fontSize: '10.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#38bdf8',
            fontWeight: 700,
          }}
        >
          📍 Ubicación de disparo (tocar para cambiar)
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f1f5f9' }}>
          {edificioSel?.nombre} · {salaSel?.nombre} · {camaSel}
        </div>
      </button>

      {/* Gran Botón de Pánico Circular Rojo */}
      <div style={{ position: 'relative', margin: 'auto 0' }}>
        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onPointerCancel={onPointerCancel}
          style={{
            position: 'relative',
            width: '210px',
            height: '210px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 25%, #ff5b5b, #dc2626 60%, #991b1b 100%)',
            color: '#fff',
            display: 'grid',
            placeItems: 'center',
            border: '4px solid rgba(255, 255, 255, 0.4)',
            boxShadow: armando
              ? '0 0 50px rgba(220, 38, 38, 0.95), 0 0 100px rgba(220, 38, 38, 0.5)'
              : '0 12px 35px rgba(220, 38, 38, 0.55)',
            transform: armando ? 'scale(0.96)' : 'scale(1)',
            transition: 'transform 0.15s ease, box-shadow 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            cursor: 'pointer',
          }}
        >
          {/* Anillo de Carga SVG (800ms) */}
          <svg
            style={{
              position: 'absolute',
              inset: '-12px',
              width: '234px',
              height: '234px',
              pointerEvents: 'none',
              transform: 'rotate(-90deg)',
            }}
          >
            <circle
              cx="117"
              cy="117"
              r="110"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeDasharray="691"
              strokeDashoffset={armando ? '0' : '691'}
              style={{
                transition: armando ? 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' : 'stroke-dashoffset 0.2s ease-out',
              }}
            />
          </svg>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <Icono nombre="alerta" size={40} color="#ffffff" />
            <div style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.1 }}>
              CÓDIGO
              <br />
              AZUL
            </div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.9, fontWeight: 700 }}>
              {armando ? '¡SOLTÁ PARA CONFIRMAR!' : 'MANTENER 0.8s'}
            </div>
          </div>
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '270px' }}>
        Presioná y mantené presionado durante 0,8 s para convocar de urgencia al equipo de reanimación médica.
      </div>
    </div>
  );
}
