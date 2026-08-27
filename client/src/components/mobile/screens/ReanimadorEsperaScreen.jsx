// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/ReanimadorEsperaScreen.jsx
// Pantalla de guardia en espera con animación de latido cardíaco
// ─────────────────────────────────────────────────────────────

export default function ReanimadorEsperaScreen() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid rgba(16, 185, 129, 0.3)',
          display: 'grid',
          placeItems: 'center',
          fontSize: '44px',
          animation: 'pulso 2s ease-in-out infinite',
        }}
      >
        💓
      </div>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: '0 0 6px' }}>
          Guardia de Reanimación Activa
        </h2>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
          En línea y conectado
        </div>
      </div>
      <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', maxWidth: '280px' }}>
        Esperando eventos. Cuando un enfermero presione el botón de Código Azul, tu pantalla sonará y mostrará la ubicación al instante.
      </p>
    </div>
  );
}
