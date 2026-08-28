// ─────────────────────────────────────────────────────────────
// client/src/pages/MobileAppStandalonePage.jsx
// Aplicación Móvil PWA Standalone modular para celulares reales (/alarma).
// Acceso directo e instantáneo sin pantalla de login previa.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { useMobileEmergency } from '../hooks/useMobileEmergency.js';
import { soundService } from '../services/soundService.js';
import Icono from '../components/common/Icono.jsx';

import PanicoScreen from '../components/mobile/screens/PanicoScreen.jsx';
import SelectorUbicacionPicker from '../components/mobile/screens/SelectorUbicacionPicker.jsx';
import AlertaReanimadorScreen from '../components/mobile/screens/AlertaReanimadorScreen.jsx';
import ReanimadorEsperaScreen from '../components/mobile/screens/ReanimadorEsperaScreen.jsx';

export default function MobileAppStandalonePage() {
  const { login: authLogin, token } = useAuth();
  const { toast } = useUI();

  // Rol activo directo (sin formulario de inicio de sesión)
  const [rolActivo, setRolActivo] = useState(() => {
    return localStorage.getItem('codazul_movil_rol') || 'enfermero';
  });

  const [pantallaEnfermero, setPantallaEnfermero] = useState('panico');

  const mobile = useMobileEmergency(rolActivo);

  // Auto-sincronizar JWT según el rol activo en tiempo real
  useEffect(() => {
    localStorage.setItem('codazul_movil_rol', rolActivo);
    const email = rolActivo === 'reanimador' ? 'reanimador1@hospital.gob.ar' : 'medico.activador@hospital.gob.ar';
    authLogin({ email, password: 'Password123!', rol: rolActivo }).catch(() => {});
  }, [rolActivo, authLogin]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: '#0a0f1d',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* Topbar con Selector Rápido de Rol */}
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
          <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.1 }}>
            {rolActivo === 'enfermero' ? 'Camila Herrera' : 'Dr. Ivan Cardozo'}
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
            {rolActivo === 'enfermero' ? 'Enfermería de Guardia' : 'Médico Reanimador'}
          </div>
        </div>

        {/* Switcher de Rol */}
        <select
          value={rolActivo}
          onChange={(e) => {
            const nuevo = e.target.value;
            setRolActivo(nuevo);
            if (nuevo === 'enfermero') soundService.stop();
            else soundService.prime();
            toast({
              titulo: 'Modo Móvil Actualizado',
              msj: nuevo === 'enfermero' ? '🩺 Modo Enfermería (Botón de pánico)' : '🚨 Modo Reanimación (Receptor de alarmas)',
              tipo: 'info',
            });
          }}
          style={{
            background: rolActivo === 'reanimador' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(11, 95, 255, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: rolActivo === 'reanimador' ? '#fca5a5' : '#38bdf8',
            borderRadius: '8px',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <option value="enfermero">🩺 Enfermero/a</option>
          <option value="reanimador">🚨 Reanimador/a</option>
        </select>
      </header>

      {/* Pantallas de Enfermero */}
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

      {/* Pantallas de Reanimador */}
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
              puedeFinalizar={mobile.puedeFinalizar}
              segundosADuracion={mobile.segundosADuracion}
              tiempoActual={mobile.tiempoActual}
            />
          )}
        </div>
      )}

      {/* Modal de Confirmación de Disparo */}
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
              Se convocará inmediatamente al equipo de reanimación a:{' '}
              <strong style={{ color: '#ffffff' }}>
                {mobile.salaSel?.nombre} — {mobile.camaSel}
              </strong>
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                type="button"
                onClick={mobile.ejecutarDisparoPanico}
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '15px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 6px 18px rgba(239, 68, 68, 0.4)',
                }}
              >
                🚨 SÍ, ACTIVAR ALERTA
              </button>
              <button
                type="button"
                onClick={() => mobile.setModalConfirmarAbierto(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
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
