// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/MobileAppStandalonePage.jsx
// Aplicación Móvil PWA 1:1 en React para Guardia y Botón de Pánico.
// Flujo Hospitalario Real:
//   - Enfermero: Selecciona cama y dispara el botón de pánico (0.8s hold).
//   - Reanimador: Recibe la alarma crítica, escucha la sirena y confirma ACK.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { soundService } from '../services/soundService.js';

const ARBOL_UBICACIONES = [
  {
    id: 'ed-1',
    nombre: 'Edificio Central',
    pisos: [
      {
        id: 'p-1',
        nombre: 'Planta Baja',
        salas: [
          { id: 's-gua', nombre: 'Guardia Médica', camas: ['Cama G-01', 'Cama G-02', 'Cama G-03', 'Shock Room'] },
          { id: 's-obs', nombre: 'Observación', camas: ['Cama OB-01', 'Cama OB-02'] },
        ],
      },
      {
        id: 'p-2',
        nombre: 'Piso 1 - Críticos',
        salas: [
          { id: 's-uti', nombre: 'UTI Adultos', camas: ['Cama UTI-01', 'Cama UTI-02', 'Cama UTI-03', 'Cama UTI-04'] },
          { id: 's-uco', nombre: 'Unidad Coronaria', camas: ['Cama UCO-01', 'Cama UCO-02'] },
        ],
      },
      {
        id: 'p-3',
        nombre: 'Piso 2 - Cirugía',
        salas: [
          { id: 's-cir', nombre: 'Internación Quirúrgica', camas: ['Hab 201 · Cama 1', 'Hab 201 · Cama 2', 'Hab 202 · Cama 1'] },
        ],
      },
    ],
  },
  {
    id: 'ed-2',
    nombre: 'Pabellón Materno-Infantil',
    pisos: [
      {
        id: 'p-mat',
        nombre: 'Piso 1 - Maternidad',
        salas: [
          { id: 's-mat', nombre: 'Maternidad y Partos', camas: ['Hab 101 · Cama A', 'Hab 102 · Cama A'] },
          { id: 's-neo', nombre: 'Neonatología', camas: ['Incubadora N-01', 'Incubadora N-02'] },
        ],
      },
    ],
  },
];

export default function MobileAppStandalonePage() {
  const { llamadosActivos, dispararCodigoAzul, sirenaSilenciada, silenciarSirena, reactivarSirena, tomarLlamado, atenderLlamado } = useIncidentes();
  const { toast, segundosADuracion } = useUI();

  // Estados de sesión móvil
  const [sesion, setSesion] = useState(null); // null | { nombre, rol: 'enfermero' | 'reanimador' }
  const [usuarioInput, setUsuarioInput] = useState('');
  const [claveInput, setClaveInput] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Navegación de pantallas móvil: 'login' | 'panico' | 'selector' | 'disparado_exito' | 'reanimador' | 'alerta'
  const [pantalla, setPantalla] = useState('login');

  // Selección de ubicación
  const [edificioSel, setEdificioSel] = useState(ARBOL_UBICACIONES[0]);
  const [pisoSel, setPisoSel] = useState(ARBOL_UBICACIONES[0].pisos[1]);
  const [salaSel, setSalaSel] = useState(ARBOL_UBICACIONES[0].pisos[1].salas[0]);
  const [camaSel, setCamaSel] = useState('Cama UTI-01');
  const [pasoSelector, setPasoSelector] = useState(1);

  // Botón de Pánico Hold
  const [armando, setArmando] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const holdTimerRef = useRef(null);

  // Incidente Activo
  const incidenteActivo = useMemo(() => {
    return llamadosActivos.find((l) => l.tipo === 'codigo-azul');
  }, [llamadosActivos]);

  // Sincronización en tiempo real para el Reanimador
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

  const handleLoginSubmit = (e) => {
    if (e) e.preventDefault();
    if (!usuarioInput.trim() || !claveInput) {
      setErrorLogin('Completá usuario y clave.');
      return;
    }
    const rolDetectado = usuarioInput.toLowerCase().includes('reanimador') ? 'reanimador' : 'enfermero';
    const userObj = {
      nombre: rolDetectado === 'reanimador' ? 'Dr. Reanimador' : 'Enfermero/a de Guardia',
      rol: rolDetectado,
    };
    setSesion(userObj);
    setPantalla(rolDetectado === 'reanimador' ? (incidenteActivo ? 'alerta' : 'reanimador') : 'panico');
    toast({ titulo: `Bienvenido/a, ${userObj.nombre}`, tipo: 'exito' });
  };

  const handleLoginDemo = (rol) => {
    const userObj = {
      nombre: rol === 'reanimador' ? 'Dr. Reanimador' : 'Enfermero/a de Guardia',
      rol,
    };
    setSesion(userObj);
    setPantalla(rol === 'reanimador' ? (incidenteActivo ? 'alerta' : 'reanimador') : 'panico');
    toast({ titulo: `Sesión iniciada como ${rol === 'reanimador' ? 'Reanimador/a' : 'Enfermero/a'}`, tipo: 'exito' });
  };

  const handleLogout = () => {
    soundService.stop();
    setSesion(null);
    setPantalla('login');
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
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

  const handleConfirmarDisparo = () => {
    setModalConfirmarAbierto(false);
    dispararCodigoAzul({
      edificio: edificioSel.nombre,
      piso: pisoSel.nombre,
      sala: salaSel.nombre,
      cama: camaSel,
    });
    setPantalla('disparado_exito');
  };

  const handleSilenciar = () => {
    silenciarSirena();
  };

  const handleConfirmarACK = () => {
    if (incidenteActivo) {
      tomarLlamado(incidenteActivo.id);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#0a0f1d',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '430px',
          minHeight: '100vh',
          background: '#0a0f1d',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* ─── Topbar Móvil ────────────────────────────────────────── */}
        {sesion && (
          <header
            style={{
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: '#0f172a',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 20,
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #0b5fff, #0aa5ff)',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(11, 95, 255, 0.35)',
              }}
            >
              <Icono nombre="corazon" size={18} color="#ffffff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: 1.1 }}>Código Azul</div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                }}
              >
                {sesion.nombre}
              </div>
            </div>
            <span
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: sesion.rol === 'reanimador' ? 'rgba(220, 38, 38, 0.15)' : 'rgba(11, 95, 255, 0.15)',
                color: sesion.rol === 'reanimador' ? '#f87171' : '#38bdf8',
                fontWeight: 600,
              }}
            >
              {sesion.rol === 'reanimador' ? 'Reanimador/a' : 'Enfermero/a'}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              title="Salir"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Icono nombre="salir" size={18} />
            </button>
          </header>
        )}

        {/* ─── PANTALLA 1: LOGIN MÓVIL ──────────────────────────────── */}
        {pantalla === 'login' && (
          <div
            style={{
              flex: 1,
              background:
                'radial-gradient(1200px 700px at 80% -10%, rgba(11, 95, 255, 0.28), transparent 60%), radial-gradient(900px 600px at -10% 110%, rgba(220, 38, 38, 0.10), transparent 60%), linear-gradient(160deg, #0b1220 0%, #030712 100%)',
              padding: '32px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0b5fff, #0aa5ff)',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: '0 8px 22px rgba(11, 95, 255, 0.45)',
                }}
              >
                <Icono nombre="corazon" size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.1 }}>Código Azul</div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'rgba(255,255,255,0.65)',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    marginTop: '2px',
                  }}
                >
                  Alarma médica · App Móvil
                </div>
              </div>
            </div>

            <form
              onSubmit={handleLoginSubmit}
              style={{
                background: 'rgba(255, 255, 255, 0.98)',
                color: '#0f172a',
                borderRadius: '20px',
                padding: '28px 24px 22px',
                boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <h2 style={{ margin: 0, fontSize: '20px' }}>Ingresar a la Guardia</h2>
              <p style={{ margin: '-6px 0 0', color: '#64748b', fontSize: '13px' }}>
                Seleccioná tu rol asistencial para continuar
              </p>

              {errorLogin && (
                <div style={{ color: '#dc2626', fontSize: '12.5px', fontWeight: 600 }}>{errorLogin}</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Usuario</label>
                <input
                  type="text"
                  placeholder="usuario"
                  value={usuarioInput}
                  onChange={(e) => setUsuarioInput(e.target.value)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Clave</label>
                <input
                  type="password"
                  placeholder="••••••"
                  value={claveInput}
                  onChange={(e) => setClaveInput(e.target.value)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#0b5fff',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '14px',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Iniciar sesión
              </button>

              <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px dashed #cbd5e1', display: 'grid', gap: '8px' }}>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#64748b',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    margin: 0,
                  }}
                >
                  Accesos rápidos DEMO
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleLoginDemo('enfermero')}
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      borderRadius: '8px',
                      padding: '12px 8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🩺 Enfermero/a
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoginDemo('reanimador')}
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: '8px',
                      padding: '12px 8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    🚨 Reanimador/a
                  </button>
                </div>
              </div>
            </form>

            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', textAlign: 'center' }}>
              Código Azul PWA · ONETP 2026
            </div>
          </div>
        )}

        {/* ─── PANTALLA 2: BOTÓN DE PÁNICO (ENFERMERO) ──────────────── */}
        {pantalla === 'panico' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '24px 20px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            {/* Card de Ubicación */}
            <button
              type="button"
              onClick={() => {
                setPasoSelector(1);
                setPantalla('selector');
              }}
              style={{
                width: '100%',
                background: 'rgba(30, 41, 59, 0.7)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '14px 16px',
                textAlign: 'left',
                cursor: 'pointer',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: '#38bdf8',
                  fontWeight: 700,
                }}
              >
                📍 Ubicación de disparo (tocar para elegir)
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                {edificioSel.nombre} · {salaSel.nombre} · {camaSel}
              </div>
            </button>

            {/* Gran Botón de Pánico Circular Rojo */}
            <div style={{ position: 'relative', margin: 'auto 0' }}>
              <button
                type="button"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
                onPointerCancel={handlePointerCancel}
                style={{
                  position: 'relative',
                  width: '230px',
                  height: '230px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle at 30% 25%, #ff5b5b, #dc2626 60%, #991b1b 100%)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: armando
                    ? '0 0 0 10px rgba(220, 38, 38, 0.35), 0 25px 50px rgba(220, 38, 38, 0.6), inset 0 -10px 20px rgba(0,0,0,0.3)'
                    : '0 0 0 6px rgba(220, 38, 38, 0.15), 0 20px 45px rgba(220, 38, 38, 0.45), inset 0 -10px 20px rgba(0,0,0,0.25)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  touchAction: 'manipulation',
                  border: 'none',
                  transform: armando ? 'scale(0.96)' : 'scale(1)',
                  transition: 'transform 120ms, box-shadow 120ms',
                }}
              >
                <svg
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    pointerEvents: 'none',
                    transform: 'rotate(-90deg)',
                  }}
                  viewBox="0 0 240 240"
                >
                  <circle
                    cx="120"
                    cy="120"
                    r="112"
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="10"
                    strokeDasharray="703"
                    strokeDashoffset={armando ? '0' : '703'}
                    style={{
                      transition: armando ? 'stroke-dashoffset 800ms linear' : 'stroke-dashoffset 150ms ease-out',
                    }}
                  />
                </svg>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    zIndex: 2,
                  }}
                >
                  <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.04em' }}>
                    CÓDIGO AZUL
                  </div>
                  <Icono nombre="corazon" size={42} color="#ffffff" />
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      opacity: 0.9,
                      textTransform: 'uppercase',
                      letterSpacing: '0.14em',
                    }}
                  >
                    {armando ? 'MANTENIENDO...' : 'MANTENÉ PRESIONADO'}
                  </div>
                </div>
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '12.5px', maxWidth: '300px', margin: 0 }}>
              Mantené presionado el botón durante <strong style={{ color: '#f87171' }}>0,8 s</strong> para prevenir
              disparos accidentales.
            </p>
          </div>
        )}

        {/* ─── PANTALLA 3: SELECTOR JERÁRQUICO DE UBICACIÓN ───────── */}
        {pantalla === 'selector' && (
          <div
            style={{
              flex: 1,
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Elegir Ubicación de Cama</h3>
              <button
                type="button"
                className="btn btn-fantasma btn-sm"
                onClick={() => setPantalla('panico')}
                style={{ color: '#94a3b8' }}
              >
                Volver
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: '#94a3b8', flexWrap: 'wrap' }}>
              <span style={{ color: pasoSelector >= 1 ? '#38bdf8' : '#64748b' }}>1. Edificio</span> ›
              <span style={{ color: pasoSelector >= 2 ? '#38bdf8' : '#64748b' }}>2. Piso</span> ›
              <span style={{ color: pasoSelector >= 3 ? '#38bdf8' : '#64748b' }}>3. Sala</span> ›
              <span style={{ color: pasoSelector >= 4 ? '#38bdf8' : '#64748b' }}>4. Cama</span>
            </div>

            {pasoSelector === 1 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {ARBOL_UBICACIONES.map((ed) => (
                  <button
                    key={ed.id}
                    type="button"
                    onClick={() => {
                      setEdificioSel(ed);
                      setPasoSelector(2);
                    }}
                    style={{
                      background: edificioSel.id === ed.id ? 'rgba(11, 95, 255, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: '#fff',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🏢 {ed.nombre}
                  </button>
                ))}
              </div>
            )}

            {pasoSelector === 2 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {edificioSel.pisos.map((pi) => (
                  <button
                    key={pi.id}
                    type="button"
                    onClick={() => {
                      setPisoSel(pi);
                      setPasoSelector(3);
                    }}
                    style={{
                      background: pisoSel.id === pi.id ? 'rgba(11, 95, 255, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: '#fff',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📍 {pi.nombre}
                  </button>
                ))}
              </div>
            )}

            {pasoSelector === 3 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {pisoSel.salas.map((sa) => (
                  <button
                    key={sa.id}
                    type="button"
                    onClick={() => {
                      setSalaSel(sa);
                      setPasoSelector(4);
                    }}
                    style={{
                      background: salaSel.id === sa.id ? 'rgba(11, 95, 255, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: '#fff',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🚪 {sa.nombre}
                  </button>
                ))}
              </div>
            )}

            {pasoSelector === 4 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                {salaSel.camas.map((ca) => (
                  <button
                    key={ca}
                    type="button"
                    onClick={() => {
                      setCamaSel(ca);
                      setPantalla('panico');
                      toast({ titulo: 'Ubicación seleccionada', msj: `${salaSel.nombre} · ${ca}`, tipo: 'exito' });
                    }}
                    style={{
                      background: camaSel === ca ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '14px',
                      color: '#fff',
                      textAlign: 'left',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🛏️ {ca}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── PANTALLA 4: CONFIRMACIÓN ENFERMERO (DISPARO ENVIADO) ─── */}
        {pantalla === 'disparado_exito' && (
          <div
            style={{
              flex: 1,
              padding: '28px 22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
              background: 'radial-gradient(circle at 50% 30%, #064e3b, #0a0f1d 75%)',
            }}
          >
            <div>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: '#10b981',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '16px auto',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Icono nombre="check" size={36} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                ¡Código Azul Disparado!
              </h2>
              <p style={{ fontSize: '13.5px', color: '#94a3b8', marginTop: '8px' }}>
                El equipo de reanimación médica ha sido convocado y está en camino a la ubicación.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Ubicación Asignada</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '4px' }}>
                {edificioSel.nombre} · {pisoSel.nombre}
              </div>
              <div style={{ fontSize: '14.5px', color: '#cbd5e1', marginTop: '2px' }}>
                {salaSel.nombre} — <strong style={{ color: '#f87171' }}>{camaSel}</strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setPantalla('panico')}
              style={{
                background: '#0b5fff',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '16px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Volver a la cabecera / Disparar otro
            </button>
          </div>
        )}

        {/* ─── PANTALLA 5: REANIMADOR EN ESPERA ────────────────────── */}
        {pantalla === 'reanimador' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '18px',
              padding: '30px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(11, 95, 255, 0.25), transparent 70%)',
                display: 'grid',
                placeItems: 'center',
                color: '#38bdf8',
                boxShadow: '0 0 30px rgba(11, 95, 255, 0.2)',
              }}
            >
              <Icono nombre="corazon" size={54} color="#38bdf8" />
            </div>

            <h3 style={{ margin: 0, fontSize: '20px', color: '#ffffff' }}>Guardia de Reanimación Activa</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', maxWidth: '280px' }}>
              Esperando eventos. Cuando un enfermero presione el botón de Código Azul, tu pantalla sonará y mostrará la ubicación al instante.
            </p>
          </div>
        )}

        {/* ─── PANTALLA 6: ALERTA CRÍTICA (REANIMADOR) ─────────────── */}
        {pantalla === 'alerta' && (
          <div
            style={{
              flex: 1,
              background: 'radial-gradient(circle at 50% 30%, #581c87, #450a0a 40%, #0a0f1d 80%)',
              padding: '26px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              textAlign: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  color: '#f87171',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: '6px',
                }}
              >
                🚨 ALERTA DE CÓDIGO AZUL RECIBIDA
              </div>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                EMERGENCIA EN CURSO
              </h1>
              <div
                style={{
                  fontSize: '32px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#38bdf8',
                  margin: '10px 0',
                }}
              >
                ⏱️ {cronometroTexto}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Ubicación Paciente</div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                {incidenteActivo?.ubicacion?.edificio || edificioSel.nombre} · {incidenteActivo?.ubicacion?.piso || pisoSel.nombre}
              </div>
              <div style={{ fontSize: '15px', color: '#cbd5e1', marginTop: '2px' }}>
                {incidenteActivo?.ubicacion?.sectorSala || salaSel.nombre} —{' '}
                <strong style={{ color: '#f87171' }}>{incidenteActivo?.ubicacion?.cama || camaSel}</strong>
              </div>
              {incidenteActivo?.atendido && (
                <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 700, fontSize: '12.5px' }}>
                  ✓ Asistencia médica confirmada (En camino)
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <button
                type="button"
                onClick={handleConfirmarACK}
                style={{
                  background: incidenteActivo?.atendido ? '#047857' : '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '18px',
                  fontSize: '16px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(22, 163, 74, 0.4)',
                }}
              >
                {incidenteActivo?.atendido ? '✓ ASISTENCIA CONFIRMADA' : '✅ CONFIRMAR ASISTENCIA (ACK)'}
              </button>

              <button
                type="button"
                onClick={sirenaSilenciada ? reactivarSirena : silenciarSirena}
                style={{
                  background: sirenaSilenciada ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '12px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {sirenaSilenciada ? '🔊 Reactivar Sirena Sonora' : '🔇 Silenciar Sirena'}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (incidenteActivo) atenderLlamado(incidenteActivo.id);
                  setPantalla('reanimador');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '6px',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Finalizar Atención / Volver a Guardia
              </button>
            </div>
          </div>
        )}

        {/* ─── Modal de Confirmación de Disparo ────────────────────── */}
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
              zIndex: 100,
            }}
          >
            <div
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                padding: '22px',
                width: '100%',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'rgba(220, 38, 38, 0.2)',
                  color: '#f87171',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto',
                }}
              >
                <Icono nombre="alerta" size={26} color="#f87171" />
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Confirmar Disparo
              </h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8' }}>
                Vas a activar un <strong>CÓDIGO AZUL</strong> en:
              </p>
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  textAlign: 'left',
                  display: 'grid',
                  gap: '4px',
                }}
              >
                <div><strong>Edificio:</strong> {edificioSel.nombre}</div>
                <div><strong>Piso:</strong> {pisoSel.nombre}</div>
                <div><strong>Sala:</strong> {salaSel.nombre}</div>
                <div><strong style={{ color: '#f87171' }}>Cama:</strong> {camaSel}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModalConfirmarAbierto(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarDisparo}
                  style={{
                    background: '#dc2626',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '12px',
                    color: '#ffffff',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Disparar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
