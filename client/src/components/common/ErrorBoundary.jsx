import React from 'react';

/**
 * Error Boundary para la Suite Hospitalaria Código Azul.
 * Captura errores de renderizado y fallos de red en chunks, ofreciendo un botón de recuperación rápida.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado en la aplicación:', error, errorInfo);
  }

  handleReload = () => {
    try {
      window.sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.update();
          }
        });
      }
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0B132B',
            color: '#F8FAFC',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            padding: '24px',
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              backgroundColor: '#1C2541',
              borderRadius: '16px',
              padding: '36px 28px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(11, 95, 255, 0.15)',
                color: '#3B82F6',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px', color: '#FFFFFF' }}>
              Actualización del Sistema
            </h2>

            <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: '1.6', marginBottom: '24px' }}>
              Se detectó una nueva versión de los módulos hospitalarios o una interrupción temporal de red. Haga clic abajo para sincronizar con la última versión.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                backgroundColor: '#0B5FFF',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 20px',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(11, 95, 255, 0.3)',
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0047D4')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0B5FFF')}
            >
              Sincronizar y Recargar Sistema
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
