// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/MobilePreviewPage.jsx
// Vista Mobile — Simulador interactivo de la App Móvil y Botón de Pánico
// Integrado 1:1 en React dentro del marco de Smartphone.
// ─────────────────────────────────────────────────────────────

import Icono from '../components/common/Icono.jsx';
import MobileAppSimulator from '../components/mobile/MobileAppSimulator.jsx';

export default function MobilePreviewPage() {
  return (
    <div className="mobile-preview-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Móvil · Simulador Interactivo</div>
          <h1>App Móvil Código Azul</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Simulador de la aplicación móvil de guardia con botón de pánico (hold 0.8s), selección de cama y sincronización en tiempo real.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            className="btn btn-primario"
            href="/alarma"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icono nombre="ojo" size={18} /> Abrir app móvil en pestaña nueva
          </a>
        </div>
      </div>

      <div className="mobile-preview-fondo" style={{ padding: '20px 0 40px' }}>
        <div
          className="phone-frame"
          style={{
            width: '380px',
            height: '740px',
            background: '#111827',
            borderRadius: '44px',
            padding: '12px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            border: '4px solid #374151',
            margin: '0 auto',
            position: 'relative',
          }}
        >
          {/* Notch / Isla dinámica superior */}
          <div
            style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '110px',
              height: '24px',
              background: '#000',
              borderRadius: '14px',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '10px',
                height: '10px',
                background: '#1e293b',
                borderRadius: '50%',
                marginRight: '8px',
              }}
            />
            <div
              style={{
                width: '8px',
                height: '8px',
                background: '#0284c7',
                borderRadius: '50%',
              }}
            />
          </div>

          {/* Pantalla del Smartphone */}
          <div
            className="phone-screen"
            style={{
              width: '100%',
              height: '100%',
              borderRadius: '34px',
              overflow: 'hidden',
              background: '#0A0F1D',
              position: 'relative',
            }}
          >
            <MobileAppSimulator />
          </div>
        </div>
      </div>
    </div>
  );
}
