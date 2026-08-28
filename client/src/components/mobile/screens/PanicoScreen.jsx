// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/PanicoScreen.jsx
// Pantalla de activación con botón de pánico de retención 0.8s
// Diseñada para máxima ergonomía y prevención de falsos positivos.
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
      {/* 1. Tarjeta de Ubicación Seleccionada con Indicador de Cambio */}
      <button
        type="button"
        onClick={onAbrirSelector}
        style={{
          width: '100%',
          background: 'rgba(15, 23, 42, 0.9)',
          border: '1.5px solid #0b5fff',
          borderRadius: '18px',
          padding: '14px 16px',
          textAlign: 'left',
          cursor: 'pointer',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(11, 95, 255, 0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(11, 95, 255, 0.25)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icono nombre="hospital" size={20} color="#38bdf8" />
          </div>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8', fontWeight: 800 }}>
              📍 UBICACIÓN DE DISPARO
            </div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginTop: '1px' }}>
              {salaSel?.nombre || 'Guardia General'} — <span style={{ color: '#38bdf8' }}>{camaSel || 'Cama 01'}</span>
            </div>
            <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              {edificioSel?.nombre}
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            borderRadius: '8px',
            padding: '6px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          Cambiar ✎
        </div>
      </button>

      {/* 2. Gran Botón de Pánico Circular Rojo con Anillo de Retención */}
      <div
        style={{
          position: 'relative',
          width: '244px',
          height: '244px',
          display: 'grid',
          placeItems: 'center',
          margin: 'auto 0',
        }}
      >
        {/* Anillo de Carga SVG Progresivo (800ms) Concéntrico Perfecto */}
        <svg
          viewBox="0 0 244 244"
          style={{
            position: 'absolute',
            inset: 0,
            width: '244px',
            height: '244px',
            pointerEvents: 'none',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            overflow: 'visible',
          }}
        >
          {/* Anillo de fondo sutil */}
          <circle
            cx="122"
            cy="122"
            r="114"
            fill="none"
            stroke={armando ? 'rgba(254, 240, 138, 0.25)' : 'rgba(255, 255, 255, 0.12)'}
            strokeWidth="8"
          />
          {/* Anillo activo de progreso */}
          <circle
            cx="122"
            cy="122"
            r="114"
            fill="none"
            stroke="#fef08a"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="716.28"
            strokeDashoffset={armando ? '0' : '716.28'}
            style={{
              transition: armando
                ? 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                : 'stroke-dashoffset 0.2s ease-out',
              filter: armando ? 'drop-shadow(0 0 12px #fef08a)' : 'none',
            }}
          />
        </svg>

        <button
          type="button"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onPointerCancel={onPointerCancel}
          style={{
            position: 'relative',
            zIndex: 2,
            width: '212px',
            height: '212px',
            borderRadius: '50%',
            background: armando
              ? 'radial-gradient(circle at 30% 25%, #ff4d4d, #b91c1c 60%, #7f1d1d 100%)'
              : 'radial-gradient(circle at 30% 25%, #ff5b5b, #dc2626 60%, #991b1b 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: armando ? '4px solid #ffffff' : '4px solid rgba(255, 255, 255, 0.4)',
            boxShadow: armando
              ? '0 0 60px rgba(239, 68, 68, 1), 0 0 120px rgba(220, 38, 38, 0.7)'
              : '0 14px 40px rgba(220, 38, 38, 0.55)',
            transform: armando ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.12s ease, box-shadow 0.2s ease, border-color 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            cursor: 'pointer',
            padding: 0,
            margin: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', pointerEvents: 'none' }}>
            <Icono nombre="alerta" size={42} color="#ffffff" />
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '0.04em', lineHeight: 1.05 }}>
              CÓDIGO
              <br />
              AZUL
            </div>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 900,
                color: armando ? '#fef08a' : 'rgba(255, 255, 255, 0.9)',
                letterSpacing: '0.05em',
                marginTop: '2px',
              }}
            >
              {armando ? '¡CONFIRMANDO...!' : 'MANTENER 0.8s'}
            </div>
          </div>
        </button>
      </div>

      {/* 3. Indicaciones de Seguridad y Claridad */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          padding: '10px 14px',
          maxWidth: '320px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4 }}>
          ⚠️ Mantené presionado el botón central durante <strong>0,8 s</strong> para convocar de inmediato a los médicos reanimadores a esta cama.
        </div>
      </div>
    </div>
  );
}
