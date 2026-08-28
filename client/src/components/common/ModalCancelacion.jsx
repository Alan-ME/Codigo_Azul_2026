// ─────────────────────────────────────────────────────────────
// client/src/components/common/ModalCancelacion.jsx
// Modal de cancelación de Código Azul / Falsa Alarma
// Cumple con la normativa SAD v1.0 / SRS IEEE 830 (Motivo obligatorio)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Icono from './Icono.jsx';

const MOTIVOS_PREDETERMINADOS = [
  'Pulsación accidental / sin paciente en paro',
  'Simulacro o prueba técnica de guardia',
  'Paciente estabilizado previo a maniobras',
  'Error de selección de ubicación/cama',
];

export default function ModalCancelacion({
  abierto,
  incidente,
  onConfirmar,
  onCerrar,
}) {
  const [motivo, setMotivo] = useState(MOTIVOS_PREDETERMINADOS[0]);
  const [motivoPersonalizado, setMotivoPersonalizado] = useState('');
  const [usarPersonalizado, setUsarPersonalizado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  if (!abierto || !incidente) return null;

  const motivoFinal = usarPersonalizado ? motivoPersonalizado.trim() : motivo;
  const esValido = motivoFinal.length >= 3;

  const handleCancelar = async () => {
    if (!esValido || enviando) return;
    setEnviando(true);
    try {
      await onConfirmar(incidente.id || incidente.backendId, motivoFinal);
      onCerrar();
    } catch (e) {
      console.warn('Error cancelando:', e);
    } finally {
      setEnviando(false);
    }
  };

  const ubi = incidente.ubicacion || {};
  const sector = ubi.sectorSala || ubi.sala || 'Guardia';
  const cama = ubi.cama || 'Cama';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: '#0f172a',
          border: '1.5px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(220, 38, 38, 0.2)',
          color: '#ffffff',
          textAlign: 'left',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icono nombre="alerta" size={24} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
              Cancelar Código Azul
            </h3>
            <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '2px' }}>
              {sector} — <strong style={{ color: '#38bdf8' }}>{cama}</strong>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 16px' }}>
          La cancelación silenciará las sirenas en todo el hospital y registrará el motivo en la bitácora inmutable de auditoría médica.
        </p>

        {/* Selector de Motivo */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Motivo de cancelación (Obligatorio)
          </label>

          <div style={{ display: 'grid', gap: '8px', marginBottom: '10px' }}>
            {MOTIVOS_PREDETERMINADOS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMotivo(m);
                  setUsarPersonalizado(false);
                }}
                style={{
                  textAlign: 'left',
                  background: !usarPersonalizado && motivo === m ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  border: !usarPersonalizado && motivo === m ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: !usarPersonalizado && motivo === m ? '#ffffff' : '#cbd5e1',
                  fontSize: '12.5px',
                  fontWeight: !usarPersonalizado && motivo === m ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {!usarPersonalizado && motivo === m ? '✓ ' : ''}{m}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setUsarPersonalizado(true)}
              style={{
                textAlign: 'left',
                background: usarPersonalizado ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: usarPersonalizado ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: usarPersonalizado ? '#ffffff' : '#cbd5e1',
                fontSize: '12.5px',
                fontWeight: usarPersonalizado ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {usarPersonalizado ? '✓ ' : ''}Escribir otro motivo...
            </button>
          </div>

          {usarPersonalizado && (
            <input
              type="text"
              autoFocus
              value={motivoPersonalizado}
              onChange={(e) => setMotivoPersonalizado(e.target.value)}
              placeholder="Describí el motivo de cancelación..."
              style={{
                width: '100%',
                background: '#020617',
                border: '1.5px solid #ef4444',
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          )}
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button
            type="button"
            onClick={onCerrar}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#cbd5e1',
              borderRadius: '10px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Volver
          </button>

          <button
            type="button"
            disabled={!esValido || enviando}
            onClick={handleCancelar}
            style={{
              background: esValido ? '#dc2626' : 'rgba(220, 38, 38, 0.4)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: esValido && !enviando ? 'pointer' : 'not-allowed',
              boxShadow: esValido ? '0 4px 15px rgba(220, 38, 38, 0.4)' : 'none',
            }}
          >
            {enviando ? 'Cancelando...' : 'Confirmar Cancelación'}
          </button>
        </div>
      </div>
    </div>
  );
}
