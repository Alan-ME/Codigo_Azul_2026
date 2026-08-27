// ─────────────────────────────────────────────────────────────
// client/src/pages/MobileAppStandalonePage.jsx
// Aplicación Móvil PWA Standalone modular para celulares reales (/alarma).
// ─────────────────────────────────────────────────────────────

import { useState, useEffect, useMemo, useRef } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { soundService } from '../services/soundService.js';
import Icono from '../components/common/Icono.jsx';

import PanicoScreen from '../components/mobile/screens/PanicoScreen.jsx';
import SelectorUbicacionPicker from '../components/mobile/screens/SelectorUbicacionPicker.jsx';
import AlertaReanimadorScreen from '../components/mobile/screens/AlertaReanimadorScreen.jsx';
import ReanimadorEsperaScreen from '../components/mobile/screens/ReanimadorEsperaScreen.jsx';

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

export default function MobileAppStandalonePage() {
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

  const [sesion, setSesion] = useState(() => {
    const s = localStorage.getItem('codazul_movil_sesion');
    return s ? JSON.parse(s) : null;
  });

  const [usuarioInput, setUsuarioInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  const [pantalla, setPantalla] = useState(() => {
    if (!sesion) return 'login';
    return sesion.rol === 'enfermero' ? 'panico' : 'reanimador';
  });

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
      if (sesion?.rol === 'reanimador' && pantalla === 'alerta') {
        setPantalla('reanimador');
      }
    } else if (sesion?.rol === 'reanimador') {
      if (pantalla !== 'alerta') {
        setPantalla('alerta');
      }
      if (!incidenteActivo.atendido && !soundService.isSilenciado()) {
        soundService.start().catch(() => {});
      } else {
        soundService.stop();
      }
    } else {
      soundService.stop();
    }
  }, [incidenteActivo, sesion, pantalla]);

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

  const handleLogin = (u, p) => {
    const uVal = u || usuarioInput;
    const pVal = p || passwordInput;
    if (uVal.toLowerCase() === 'enfermero' || uVal.toLowerCase() === 'enfermera') {
      const data = { nombre: 'Camila Herrera', rol: 'enfermero', matricula: 'ENF-4482' };
      setSesion(data);
      localStorage.setItem('codazul_movil_sesion', JSON.stringify(data));
      setPantalla('panico');
    } else if (uVal.toLowerCase() === 'reanimador' || uVal.toLowerCase() === 'medico') {
      const data = { nombre: 'Dr. Reanimador', rol: 'reanimador', matricula: 'MED-9081' };
      setSesion(data);
      localStorage.setItem('codazul_movil_sesion', JSON.stringify(data));
      setPantalla('reanimador');
      soundService.prime();
    } else {
      setErrorLogin('Credenciales inválidas. Usa los accesos rápidos demo.');
    }
  };

  const handleCerrarSesion = () => {
    setSesion(null);
    localStorage.removeItem('codazul_movil_sesion');
    soundService.stop();
    setPantalla('login');
  };

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
      {/* Topbar */}
      {sesion && (
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
            <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: 1.1 }}>{sesion.nombre}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
              {sesion.rol === 'enfermero' ? 'Enfermería de Guardia' : 'Médico Reanimador'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrarSesion}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '11.5px',
              cursor: 'pointer',
            }}
          >
            Salir
          </button>
        </header>
      )}

      {/* Login */}
      {!sesion && (
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', padding: '24px' }}>
          <div style={{ width: '100%', maxWidth: '340px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: 'linear-gradient(135deg, #0b5fff, #0aa5ff)',
                margin: '0 auto 16px',
                display: 'grid',
                placeItems: 'center',
                boxShadow: '0 10px 25px rgba(11, 95, 255, 0.4)',
              }}
            >
              <Icono nombre="corazon" size={32} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 4px', color: '#fff' }}>
              Código Azul Móvil
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px' }}>
              Sistema de respuesta y pánico hospitalario
            </p>

            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                type="button"
                onClick={() => handleLogin('enfermero', '1234')}
                style={{
                  background: '#0b5fff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🩺 Ingresar como Enfermero/a (Botón Pánico)
              </button>
              <button
                type="button"
                onClick={() => handleLogin('reanimador', '1234')}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🚨 Ingresar como Reanimador/a (Alarma Sonora)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pantallas de Enfermero */}
      {sesion?.rol === 'enfermero' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {pantalla === 'panico' ? (
            <PanicoScreen
              edificioSel={edificioSel}
              salaSel={salaSel}
              camaSel={camaSel}
              armando={armando}
              onAbrirSelector={() => {
                setPasoSelector(1);
                setPantalla('selector');
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
              pisosDisponibles={edificioSel?.pisos || []}
              salasDisponibles={pisoSel?.salas || []}
              camasDisponibles={salaSel?.camas || []}
              onFinalizar={(cama) => {
                setPantalla('panico');
                toast({
                  titulo: 'Ubicación seleccionada',
                  msj: `${salaSel.nombre} — ${cama}`,
                  tipo: 'exito',
                });
              }}
              onCancelar={() => setPantalla('panico')}
            />
          )}
        </div>
      )}

      {/* Pantallas de Reanimador */}
      {sesion?.rol === 'reanimador' && (
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
