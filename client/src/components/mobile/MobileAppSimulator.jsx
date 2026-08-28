// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/MobileAppSimulator.jsx
// Simulador móvil reactivo con separación en subcomponentes modulares.
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useUI } from '../../context/UIContext.jsx';
import { useMobileEmergency } from '../../hooks/useMobileEmergency.js';
import { soundService } from '../../services/soundService.js';
import Icono from '../common/Icono.jsx';

import PanicoScreen from './screens/PanicoScreen.jsx';
import SelectorUbicacionPicker from './screens/SelectorUbicacionPicker.jsx';
import AlertaReanimadorScreen from './screens/AlertaReanimadorScreen.jsx';
import ReanimadorEsperaScreen from './screens/ReanimadorEsperaScreen.jsx';

export default function MobileAppSimulator() {
  const { toast } = useUI();
  const [rolActivo, setRolActivo] = useState('enfermero');
  const [pantallaEnfermero, setPantallaEnfermero] = useState('panico');

  const mobile = useMobileEmergency(rolActivo);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0a0f1d',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Topbar */}
      <header
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(15, 23, 42, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #0b5fff, #0aa5ff)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icono nombre="corazon" size={17} color="#ffffff" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.1 }}>Código Azul</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
            {rolActivo === 'enfermero' ? 'Enfermería de Guardia' : 'Médico Reanimador'}
          </div>
        </div>

        <select
          value={rolActivo}
          onChange={(e) => {
            const nuevo = e.target.value;
            setRolActivo(nuevo);
            if (nuevo === 'enfermero') soundService.stop();
            toast({
              titulo: 'Vista Móvil Cambiada',
              msj: nuevo === 'enfermero' ? 'Modo Enfermero (Botón de pánico)' : 'Modo Reanimador (Receptor de alarmas)',
              tipo: 'info',
            });
          }}
          style={{
            background: rolActivo === 'reanimador' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(11, 95, 255, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: rolActivo === 'reanimador' ? '#f87171' : '#38bdf8',
            borderRadius: '8px',
            padding: '4px 8px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value="enfermero">Enfermero/a</option>
          <option value="reanimador">Reanimador/a</option>
        </select>
      </header>

      {/* Vistas */}
      {rolActivo === 'enfermero' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {pantallaEnfermero === 'panico' ? (
            <PanicoScreen
              edificioSel={mobile.edificioSel}
              salaSel={mobile.salaSel}
              camaSel={mobile.camaSel}
              armando={mobile.armando}
              onAbrirSelector={() => {
                mobile.setPasoSelector(1);
                setPantallaEnfermero('selector');
              }}
              onPointerDown={mobile.handlePointerDown}
              onPointerCancel={mobile.handlePointerCancel}
            />
          ) : (
            <SelectorUbicacionPicker
              pasoSelector={mobile.pasoSelector}
              setPasoSelector={mobile.setPasoSelector}
              edificioSel={mobile.edificioSel}
              setEdificioSel={mobile.setEdificioSel}
              pisoSel={mobile.pisoSel}
              setPisoSel={mobile.setPisoSel}
              salaSel={mobile.salaSel}
              setSalaSel={mobile.setSalaSel}
              camaSel={mobile.camaSel}
              setCamaSel={mobile.setCamaSel}
              catalogoUbicaciones={mobile.catalogoUbicaciones}
              pisosDisponibles={mobile.pisosDisponibles}
              salasDisponibles={mobile.salasDisponibles}
              camasDisponibles={mobile.camasDisponibles}
              onFinalizar={(cama) => {
                setPantallaEnfermero('panico');
                toast({
                  titulo: 'Ubicación seleccionada',
                  msj: `${mobile.salaSel.nombre} — ${cama}`,
                  tipo: 'exito',
                });
              }}
              onCancelar={() => setPantallaEnfermero('panico')}
            />
          )}
        </div>
      )}

      {rolActivo === 'reanimador' && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {!mobile.incidenteActivo ? (
            <ReanimadorEsperaScreen />
          ) : (
            <AlertaReanimadorScreen
              incidenteActivo={mobile.incidenteActivo}
              todosLosIncidentes={mobile.incidentesCodAzul}
              incidenteSeleccionadoIndex={mobile.indiceSel}
              onSeleccionarIncidente={(idx) => mobile.setIndiceSel(idx)}
              edificioSel={mobile.edificioSel}
              pisoSel={mobile.pisoSel}
              salaSel={mobile.salaSel}
              camaSel={mobile.camaSel}
              cronometroTexto={mobile.cronometroTexto}
              sirenaSilenciada={mobile.sirenaSilenciada}
              onConfirmarACK={(id) => mobile.tomarLlamado(id || mobile.incidenteActivo.id)}
              onToggleSirena={mobile.sirenaSilenciada ? mobile.reactivarSirena : mobile.silenciarSirena}
              onFinalizarAtencion={(id) => mobile.atenderLlamado(id || mobile.incidenteActivo.id)}
              segundosADuracion={mobile.segundosADuracion}
              tiempoActual={mobile.tiempoActual}
            />
          )}
        </div>
      )}

      {/* Modal de Disparo */}
      {mobile.modalConfirmarAbierto && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'grid',
            placeItems: 'center',
            padding: '20px',
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '2px solid #ef4444',
              borderRadius: '20px',
              padding: '24px 20px',
              width: '100%',
              maxWidth: '320px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>🚨</div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#f87171' }}>
              ¿Confirmar Código Azul?
            </h3>
            <p style={{ fontSize: '13px', color: '#cbd5e1', margin: '0 0 16px' }}>
              Se alertará inmediatamente al equipo de reanimación médica para:{' '}
              <strong style={{ color: '#fff' }}>
                {mobile.salaSel.nombre} — {mobile.camaSel}
              </strong>
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                type="button"
                onClick={mobile.ejecutarDisparoPanico}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)',
                }}
              >
                ¡SÍ, CONVOCAR AHORA!
              </button>
              <button
                type="button"
                onClick={() => mobile.setModalConfirmarAbierto(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#94a3b8',
                  borderRadius: '12px',
                  padding: '10px',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
