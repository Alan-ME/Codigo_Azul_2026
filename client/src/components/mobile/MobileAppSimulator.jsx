// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/MobileAppSimulator.jsx
// Simulador móvil reactivo con separación en subcomponentes modulares.
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef } from 'react';
import { useIncidentes } from '../../context/IncidentesContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { soundService } from '../../services/soundService.js';
import Icono from '../common/Icono.jsx';

import PanicoScreen from './screens/PanicoScreen.jsx';
import SelectorUbicacionPicker from './screens/SelectorUbicacionPicker.jsx';
import AlertaReanimadorScreen from './screens/AlertaReanimadorScreen.jsx';
import ReanimadorEsperaScreen from './screens/ReanimadorEsperaScreen.jsx';

const CATALOGO_UBICACIONES = [
  {
    id: 'ed-central',
    nombre: 'Edificio Central',
    pisos: [
      {
        id: 'piso-1',
        nombre: 'Piso 1 - Guardia y Shockroom',
        salas: [
          { id: 'sala-shock', nombre: 'Shockroom', camas: ['Cama 01', 'Cama 02', 'Cama 03', 'Cama 04'] },
          { id: 'sala-obs', nombre: 'Observación', camas: ['Cama 01', 'Cama 02', 'Cama 03', 'Cama 04', 'Cama 05', 'Cama 06'] },
        ],
      },
      {
        id: 'piso-2',
        nombre: 'Piso 2 - Cuidados Críticos',
        salas: [
          { id: 'sala-uti', nombre: 'Terapia Intensiva (UTI)', camas: ['Cama 01', 'Cama 02', 'Cama 03', 'Cama 04', 'Cama 05', 'Cama 06', 'Cama 07', 'Cama 08'] },
          { id: 'sala-uco', nombre: 'Unidad Coronaria (UCO)', camas: ['Cama 01', 'Cama 02', 'Cama 03', 'Cama 04'] },
        ],
      },
    ],
  },
  {
    id: 'ed-maternidad',
    nombre: 'Pabellón Materno-Infantil',
    pisos: [
      {
        id: 'piso-mat',
        nombre: 'Piso 1 - Maternidad y Neo',
        salas: [
          { id: 'sala-neo', nombre: 'Neonatología', camas: ['Incubadora 01', 'Incubadora 02', 'Incubadora 03', 'Incubadora 04'] },
          { id: 'sala-parto', nombre: 'Centro Obstétrico', camas: ['Cama 01', 'Cama 02'] },
        ],
      },
    ],
  },
];

export default function MobileAppSimulator() {
  const {
    llamadosActivos,
    crearLlamado,
    tomarLlamado,
    atenderLlamado,
    sirenaSilenciada,
    silenciarSirena,
    reactivarSirena,
  } = useIncidentes();
  const { toast, segundosADuracion } = useUI();

  const [rolActivo, setRolActivo] = useState('enfermero');
  const [pantallaEnfermero, setPantallaEnfermero] = useState('panico');
  const [pasoSelector, setPasoSelector] = useState(1);

  const [edificioSel, setEdificioSel] = useState(CATALOGO_UBICACIONES[0]);
  const [pisoSel, setPisoSel] = useState(CATALOGO_UBICACIONES[0].pisos[0]);
  const [salaSel, setSalaSel] = useState(CATALOGO_UBICACIONES[0].pisos[0].salas[0]);
  const [camaSel, setCamaSel] = useState('Cama 01');

  const [armando, setArmando] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const holdTimerRef = useRef(null);

  const incidenteActivo = useMemo(() => {
    return llamadosActivos.find((l) => l.tipo === 'codigo-azul');
  }, [llamadosActivos]);

  useEffect(() => {
    if (!incidenteActivo) {
      soundService.stop();
    } else if (rolActivo === 'reanimador') {
      if (!incidenteActivo.atendido && !soundService.isSilenciado()) {
        soundService.start().catch(() => {});
      } else {
        soundService.stop();
      }
    } else {
      soundService.stop();
    }
  }, [rolActivo, incidenteActivo]);

  const [tiempoActual, setTiempoActual] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cronometroTexto = useMemo(() => {
    if (!incidenteActivo) return '00:00';
    const inicio = new Date(incidenteActivo.horaInicio).getTime();
    const seg = Math.max(0, Math.floor((tiempoActual - inicio) / 1000));
    return segundosADuracion(seg);
  }, [incidenteActivo, tiempoActual, segundosADuracion]);

  const pisosDisponibles = edificioSel?.pisos || [];
  const salasDisponibles = pisoSel?.salas || [];
  const camasDisponibles = salaSel?.camas || [];

  const handlePointerDown = () => {
    setArmando(true);
    holdTimerRef.current = setTimeout(() => {
      setArmando(false);
      setModalConfirmarAbierto(true);
    }, 800);
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setArmando(false);
  };

  const handleDispararEmergencia = () => {
    crearLlamado({
      tipo: 'codigo-azul',
      origen: 'cama',
      pacienteId: 'p2',
      ubicacion: {
        edificio: edificioSel.nombre,
        piso: pisoSel.nombre,
        sectorSala: salaSel.nombre,
        cama: camaSel,
      },
    });
    setModalConfirmarAbierto(false);
    toast({
      titulo: '¡CÓDIGO AZUL ACTIVADO!',
      msj: `Alerta convocada en ${salaSel.nombre} · ${camaSel}`,
      tipo: 'peligro',
    });
  };

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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {pantallaEnfermero === 'panico' ? (
            <PanicoScreen
              edificioSel={edificioSel}
              salaSel={salaSel}
              camaSel={camaSel}
              armando={armando}
              onAbrirSelector={() => {
                setPasoSelector(1);
                setPantallaEnfermero('selector');
              }}
              onPointerDown={handlePointerDown}
              onPointerCancel={handlePointerCancel}
            />
          ) : (
            <SelectorUbicacionPicker
              pasoSelector={pasoSelector}
              setPasoSelector={setPasoSelector}
              edificioSel={edificioSel}
              setEdificioSel={setEdificioSel}
              pisoSel={pisoSel}
              setPisoSel={setPisoSel}
              salaSel={salaSel}
              setSalaSel={setSalaSel}
              camaSel={camaSel}
              setCamaSel={setCamaSel}
              catalogoUbicaciones={CATALOGO_UBICACIONES}
              pisosDisponibles={pisosDisponibles}
              salasDisponibles={salasDisponibles}
              camasDisponibles={camasDisponibles}
              onFinalizar={(cama) => {
                setPantallaEnfermero('panico');
                toast({
                  titulo: 'Ubicación seleccionada',
                  msj: `${salaSel.nombre} — ${cama}`,
                  tipo: 'exito',
                });
              }}
              onCancelar={() => setPantallaEnfermero('panico')}
            />
          )}
        </div>
      )}

      {rolActivo === 'reanimador' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!incidenteActivo ? (
            <ReanimadorEsperaScreen />
          ) : (
            <AlertaReanimadorScreen
              incidenteActivo={incidenteActivo}
              edificioSel={edificioSel}
              pisoSel={pisoSel}
              salaSel={salaSel}
              camaSel={camaSel}
              cronometroTexto={cronometroTexto}
              sirenaSilenciada={sirenaSilenciada}
              onConfirmarACK={() => tomarLlamado(incidenteActivo.id)}
              onToggleSirena={sirenaSilenciada ? reactivarSirena : silenciarSirena}
              onFinalizarAtencion={() => atenderLlamado(incidenteActivo.id)}
            />
          )}
        </div>
      )}

      {/* Modal de Disparo */}
      {modalConfirmarAbierto && (
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
                {salaSel.nombre} — {camaSel}
              </strong>
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              <button
                type="button"
                onClick={handleDispararEmergencia}
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
                onClick={() => setModalConfirmarAbierto(false)}
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
