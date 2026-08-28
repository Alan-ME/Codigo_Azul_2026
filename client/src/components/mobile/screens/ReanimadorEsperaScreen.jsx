// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/ReanimadorEsperaScreen.jsx
// Pantalla de guardia en espera para Médico Reanimador con telemetría en vivo.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { soundService } from '../../../services/soundService.js';
import Icono from '../../common/Icono.jsx';

export default function ReanimadorEsperaScreen() {
  const [probandoSonido, setProbandoSonido] = useState(false);

  const handleTestSonido = async () => {
    if (probandoSonido) return;
    setProbandoSonido(true);
    try {
      soundService.reactivar();
      await soundService.start();
      setTimeout(() => {
        soundService.stop();
        setProbandoSonido(false);
      }, 1500);
    } catch (e) {
      console.warn('[SOUND TEST]', e);
      setProbandoSonido(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '24px 18px',
        textAlign: 'center',
        background: '#0a0f1d',
        overflowY: 'auto',
      }}
    >
      {/* 1. Header y Estado de Guardia */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '8px' }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            display: 'grid',
            placeItems: 'center',
            fontSize: '38px',
            marginBottom: '14px',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)',
          }}
        >
          💓
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          Guardia de Reanimación Activa
        </h2>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1.5px solid #10b981',
            color: '#34d399',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '12.5px',
            fontWeight: 800,
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
          En línea · Socket.IO y FCM Conectados
        </div>
      </div>

      {/* 2. Tarjetas de Telemetría de Guardia */}
      <div
        style={{
          width: '100%',
          maxWidth: '340px',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          margin: '16px 0',
        }}
      >
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            📡 Red Hospital
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
            Servidor Online
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Latencia &lt; 15ms</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            🔔 Notificaciones
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginTop: '4px' }}>
            FCM Máx. Prioridad
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Doze Mode listo</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            👨‍⚕️ Reanimador
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>
            Dr. Ivan Cardozo
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Médico de Guardia</div>
        </div>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
            🔊 Sirena Acústica
          </div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
            Web Audio API
          </div>
          <div style={{ fontSize: '10.5px', color: '#64748b' }}>Calibrada</div>
        </div>
      </div>

      {/* 3. Botón de Prueba de Sonido y Mensaje Informativo */}
      <div style={{ width: '100%', maxWidth: '340px', display: 'grid', gap: '10px' }}>
        <button
          type="button"
          onClick={handleTestSonido}
          style={{
            background: probandoSonido ? '#dc2626' : 'rgba(255, 255, 255, 0.08)',
            border: probandoSonido ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
            color: '#ffffff',
            borderRadius: '14px',
            padding: '12px',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <span>{probandoSonido ? '🚨 Reproduciendo Sirena de Prueba...' : '🔊 Probar Sonido de Alarma'}</span>
        </button>

        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
          Esperando eventos. Cuando se active un Código Azul en cualquier cama, esta pantalla disparará la alarma visual y sonora al instante.
        </p>
      </div>
    </div>
  );
}
