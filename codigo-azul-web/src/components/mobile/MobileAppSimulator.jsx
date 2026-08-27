// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/components/mobile/MobileAppSimulator.jsx
// Simulador React 1:1 de la App Móvil de Guardia y Botón de Pánico.
// Flujo Hospitalario Real:
//   - Enfermero: Selecciona cama y dispara el botón de pánico (0.8s hold).
//   - Reanimador: Recibe la alarma crítica, escucha la sirena y confirma ACK.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useIncidentes } from '../../context/IncidentesContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import Icono from '../common/Icono.jsx';
import { soundService } from '../../services/soundService.js';

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

export default function MobileAppSimulator() {
  const { llamadosActivos, dispararCodigoAzul, sirenaSilenciada, silenciarSirena, reactivarSirena, tomarLlamado, atenderLlamado } = useIncidentes();
  const { toast, segundosADuracion } = useUI();

  // Rol activo en el simulador: 'enfermero' | 'reanimador'
  const [rolActivo, setRolActivo] = useState('enfermero');

  // Pantalla interna para enfermero: 'panico' | 'selector' | 'disparado_exito'
  const [pantallaEnfermero, setPantallaEnfermero] = useState('panico');

  // Selección de ubicación para el enfermero
  const [edificioSel, setEdificioSel] = useState(ARBOL_UBICACIONES[0]);
  const [pisoSel, setPisoSel] = useState(ARBOL_UBICACIONES[0].pisos[1]);
  const [salaSel, setSalaSel] = useState(ARBOL_UBICACIONES[0].pisos[1].salas[0]);
  const [camaSel, setCamaSel] = useState('Cama UTI-01');
  const [pasoSelector, setPasoSelector] = useState(1);

  // Estado del botón de pánico
  const [armando, setArmando] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const holdTimerRef = useRef(null);

  // Incidente Activo en tiempo real
  const incidenteActivo = useMemo(() => {
    return llamadosActivos.find((l) => l.tipo === 'codigo-azul');
  }, [llamadosActivos]);

  // Sincronización de sirena para el Reanimador
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

  // Lógica de mantener presionado 800ms
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
    setPantallaEnfermero('disparado_exito');
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
      {/* ─── Topbar Móvil con Selector de Rol ────────────────────── */}
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

        {/* Selector de rol para probar ambos extremos */}
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

      {/* ════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: ENFERMERO (BOTÓN DE PÁNICO Y SELECCIÓN DE CAMA)      */}
      {/* ════════════════════════════════════════════════════════════ */}
      {rolActivo === 'enfermero' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Pantalla Pánico */}
          {pantallaEnfermero === 'panico' && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 18px',
                textAlign: 'center',
              }}
            >
              {/* Card de Ubicación */}
              <button
                type="button"
                onClick={() => {
                  setPasoSelector(1);
                  setPantallaEnfermero('selector');
                }}
                style={{
                  width: '100%',
                  background: 'rgba(30, 41, 59, 0.7)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '12px 14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div
                  style={{
                    fontSize: '10.5px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: '#38bdf8',
                    fontWeight: 700,
                  }}
                >
                  📍 Ubicación de disparo (tocar para cambiar)
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#f1f5f9' }}>
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
                    width: '210px',
                    height: '210px',
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
                    <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.04em' }}>
                      CÓDIGO AZUL
                    </div>
                    <Icono nombre="corazon" size={38} color="#ffffff" />
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        opacity: 0.9,
                        textTransform: 'uppercase',
                        letterSpacing: '0.12em',
                      }}
                    >
                      {armando ? 'MANTENIENDO...' : 'MANTENÉ PRESIONADO'}
                    </div>
                  </div>
                </button>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '12px', maxWidth: '280px', margin: 0 }}>
                Mantené presionado el botón durante <strong style={{ color: '#f87171' }}>0,8 s</strong> para disparar la alarma.
              </p>
            </div>
          )}

          {/* Pantalla Selector Jerárquico */}
          {pantallaEnfermero === 'selector' && (
            <div
              style={{
                flex: 1,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Elegir Ubicación de Cama</h3>
                <button
                  type="button"
                  className="btn btn-fantasma btn-sm"
                  onClick={() => setPantallaEnfermero('panico')}
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
                        padding: '12px 14px',
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
                        padding: '12px 14px',
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
                        padding: '12px 14px',
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
                        setPantallaEnfermero('panico');
                        toast({ titulo: 'Ubicación seleccionada', msj: `${salaSel.nombre} · ${ca}`, tipo: 'exito' });
                      }}
                      style={{
                        background: camaSel === ca ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '12px 14px',
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

          {/* Pantalla Confirmación de Disparo Exitoso (Enfermero) */}
          {pantallaEnfermero === 'disparado_exito' && (
            <div
              style={{
                flex: 1,
                padding: '24px 20px',
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
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#10b981',
                    display: 'grid',
                    placeItems: 'center',
                    margin: '10px auto 16px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <Icono nombre="check" size={34} color="#ffffff" />
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                  ¡Código Azul Disparado!
                </h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>
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
                <div style={{ fontSize: '14px', color: '#cbd5e1', marginTop: '2px' }}>
                  {salaSel.nombre} — <strong style={{ color: '#f87171' }}>{camaSel}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPantallaEnfermero('panico')}
                style={{
                  background: '#0b5fff',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '16px',
                  fontWeight: 700,
                  fontSize: '14.5px',
                  cursor: 'pointer',
                }}
              >
                Volver a la cabecera / Disparar otro
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════ */}
      {/* VISTA 2: REANIMADOR (RECEPTOR DE LA ALARMA Y ASISTENCIA)     */}
      {/* ════════════════════════════════════════════════════════════ */}
      {rolActivo === 'reanimador' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Si NO hay Código Azul activo -> Guardia en Espera */}
          {!incidenteActivo ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(11, 95, 255, 0.25), transparent 70%)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#38bdf8',
                  boxShadow: '0 0 30px rgba(11, 95, 255, 0.2)',
                }}
              >
                <Icono nombre="corazon" size={50} color="#38bdf8" />
              </div>

              <h3 style={{ margin: 0, fontSize: '19px', color: '#ffffff' }}>Guardia de Reanimación Activa</h3>
              <p style={{ margin: 0, fontSize: '12.5px', color: '#94a3b8', maxWidth: '280px' }}>
                Esperando eventos. Cuando un enfermero presione el botón de Código Azul, tu pantalla sonará y mostrará la ubicación al instante.
              </p>
            </div>
          ) : (
            /* Si HAY un Código Azul activo -> PANTALLA CRÍTICA DE ALERTA CON SIRENA */
            <div
              style={{
                flex: 1,
                background: 'radial-gradient(circle at 50% 30%, #581c87, #450a0a 40%, #0a0f1d 80%)',
                padding: '24px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#f87171',
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    marginBottom: '4px',
                  }}
                >
                  🚨 ALERTA DE CÓDIGO AZUL RECIBIDA
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  EMERGENCIA EN CURSO
                </h1>
                <div
                  style={{
                    fontSize: '30px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: '#38bdf8',
                    margin: '8px 0',
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
                <div style={{ fontSize: '10.5px', color: '#94a3b8', textTransform: 'uppercase' }}>
                  Ubicación Paciente
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                  {incidenteActivo.ubicacion?.edificio || edificioSel.nombre} · {incidenteActivo.ubicacion?.piso || pisoSel.nombre}
                </div>
                <div style={{ fontSize: '14.5px', color: '#cbd5e1', marginTop: '2px' }}>
                  {incidenteActivo.ubicacion?.sectorSala || salaSel.nombre} —{' '}
                  <strong style={{ color: '#f87171' }}>{incidenteActivo.ubicacion?.cama || camaSel}</strong>
                </div>
                {incidenteActivo.atendido && (
                  <div style={{ marginTop: '8px', color: '#10b981', fontWeight: 700, fontSize: '12px' }}>
                    ✓ Asistencia confirmada por médico
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleConfirmarACK}
                  style={{
                    background: incidenteActivo.atendido ? '#047857' : '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '16px',
                    fontSize: '15px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(22, 163, 74, 0.4)',
                  }}
                >
                  {incidenteActivo.atendido ? '✓ ASISTENCIA CONFIRMADA' : '✅ CONFIRMAR ASISTENCIA (ACK)'}
                </button>

                <button
                  type="button"
                  onClick={sirenaSilenciada ? reactivarSirena : silenciarSirena}
                  style={{
                    background: sirenaSilenciada ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#ffffff',
                    borderRadius: '12px',
                    padding: '11px',
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
                    atenderLlamado(incidenteActivo.id);
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
                  Finalizar Atención / Cerrar
                </button>
              </div>
            </div>
          )}
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
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'rgba(220, 38, 38, 0.2)',
                color: '#f87171',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto',
              }}
            >
              <Icono nombre="alerta" size={24} color="#f87171" />
            </div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#ffffff' }}>
              Confirmar Disparo
            </h3>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              Vas a activar un <strong>CÓDIGO AZUL</strong> en:
            </p>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '10px 12px',
                fontSize: '12.5px',
                textAlign: 'left',
                display: 'grid',
                gap: '3px',
              }}
            >
              <div><strong>Edificio:</strong> {edificioSel.nombre}</div>
              <div><strong>Piso:</strong> {pisoSel.nombre}</div>
              <div><strong>Sala:</strong> {salaSel.nombre}</div>
              <div><strong style={{ color: '#f87171' }}>Cama:</strong> {camaSel}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setModalConfirmarAbierto(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px',
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
                  padding: '11px',
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
  );
}
