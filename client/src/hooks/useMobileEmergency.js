// ─────────────────────────────────────────────────────────────
// client/src/hooks/useMobileEmergency.js
// Hook centralizado para la experiencia móvil (StandAlone + Simulator)
// Unifica el 100% de la lógica de alertas, pulsación, ubicación y carrusel.
// ─────────────────────────────────────────────────────────────

import { useState, useMemo, useEffect, useRef } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import { soundService } from '../services/soundService.js';

export const CATALOGO_UBICACIONES = [
  {
    id: 'ed-central',
    nombre: 'Monoblock Central',
    pisos: [
      {
        id: 'piso-1',
        nombre: 'Piso 1 - Guardia y Shockroom',
        salas: [
          { id: 'sala-shock', nombre: 'Shockroom', camas: ['Shockroom-01', 'Shockroom-02'] },
          { id: 'sala-guardia', nombre: 'Guardia General', camas: ['Cama 01', 'Cama 02', 'Cama 03', 'Cama 04'] },
        ],
      },
      {
        id: 'piso-2',
        nombre: 'Piso 2 - Centro Quirúrgico',
        salas: [
          { id: 'sala-quirofano', nombre: 'Quirófano Central', camas: ['Quirófano 1', 'Quirófano 2'] },
          { id: 'sala-recuperacion', nombre: 'Recuperación Anestésica', camas: ['Cama R-01', 'Cama R-02'] },
        ],
      },
    ],
  },
  {
    id: 'ed-criticos',
    nombre: 'Pabellón Críticos',
    pisos: [
      {
        id: 'piso-3',
        nombre: 'Piso 3 - Cuidados Intensivos',
        salas: [
          { id: 'sala-uti', nombre: 'Terapia Intensiva (UTI)', camas: ['UCI-01', 'UCI-02', 'UCI-03', 'UCI-04'] },
          { id: 'sala-uco', nombre: 'Unidad Coronaria (UCO)', camas: ['UCO-01', 'UCO-02'] },
        ],
      },
    ],
  },
];

export function useMobileEmergency(rolActivo = 'enfermero') {
  const {
    llamadosActivos,
    tomarLlamado,
    atenderLlamado,
    cancelarLlamado,
    dispararCodigoAzul,
    sirenaSilenciada,
    silenciarSirena,
    reactivarSirena,
  } = useIncidentes();

  const { segundosADuracion } = useUI();

  // Selector de Ubicación
  const [pasoSelector, setPasoSelector] = useState(1);
  const [edificioSel, setEdificioSel] = useState(CATALOGO_UBICACIONES[0]);
  const [pisoSel, setPisoSel] = useState(CATALOGO_UBICACIONES[0].pisos[0]);
  const [salaSel, setSalaSel] = useState(CATALOGO_UBICACIONES[0].pisos[0].salas[0]);
  const [camaSel, setCamaSel] = useState('Shockroom-01');

  const pisosDisponibles = edificioSel?.pisos || [];
  const salasDisponibles = pisoSel?.salas || [];
  const camasDisponibles = salaSel?.camas || [];

  // Pulsación Larga (Hold-to-Activate)
  const [armando, setArmando] = useState(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const holdTimerRef = useRef(null);

  const handlePointerDown = () => {
    setArmando(true);
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40]);
    }
    holdTimerRef.current = setTimeout(() => {
      setArmando(false);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
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

  // Manejo de Lista Concurrente de Códigos Azules
  const incidentesCodAzul = useMemo(() => {
    return llamadosActivos.filter((l) => l.tipo === 'codigo-azul');
  }, [llamadosActivos]);

  const [indiceSel, setIndiceSel] = useState(0);

  useEffect(() => {
    if (indiceSel >= incidentesCodAzul.length && incidentesCodAzul.length > 0) {
      setIndiceSel(incidentesCodAzul.length - 1);
    }
  }, [incidentesCodAzul.length, indiceSel]);

  const incidenteActivo = useMemo(() => {
    if (incidentesCodAzul.length === 0) return null;
    return incidentesCodAzul[indiceSel] || incidentesCodAzul[0];
  }, [incidentesCodAzul, indiceSel]);

  // Sincronización Sonora Multiemergencia
  useEffect(() => {
    if (incidentesCodAzul.length === 0) {
      soundService.stop();
    } else if (rolActivo === 'reanimador') {
      const hayDesatendidos = incidentesCodAzul.some((l) => !l.atendido);
      if (hayDesatendidos && !soundService.isSilenciado()) {
        soundService.start().catch(() => {});
      } else {
        soundService.stop();
      }
    } else {
      soundService.stop();
    }
  }, [rolActivo, incidentesCodAzul]);

  // Ticker de Tiempo en Vivo
  const [tiempoActual, setTiempoActual] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const cronometroTexto = useMemo(() => {
    if (!incidenteActivo) return '00:00';
    const inicio = new Date(incidenteActivo.horaInicio).getTime();
    const seg = Math.max(0, Math.floor((tiempoActual - inicio) / 1000));
    return segundosADuracion ? segundosADuracion(seg) : `${Math.floor(seg / 60)}:${seg % 60 < 10 ? '0' : ''}${seg % 60}`;
  }, [incidenteActivo, tiempoActual, segundosADuracion]);

  // Ejecutar Disparo de Emergencia
  const ejecutarDisparoPanico = async () => {
    setModalConfirmarAbierto(false);
    await dispararCodigoAzul({
      edificio: edificioSel.nombre,
      piso: pisoSel.nombre,
      sala: salaSel.nombre,
      cama: camaSel,
    });
  };

  return {
    // Ubicación
    pasoSelector,
    setPasoSelector,
    edificioSel,
    setEdificioSel,
    pisoSel,
    setPisoSel,
    salaSel,
    setSalaSel,
    camaSel,
    setCamaSel,
    catalogoUbicaciones: CATALOGO_UBICACIONES,
    pisosDisponibles,
    salasDisponibles,
    camasDisponibles,

    // Botón de Pánico
    armando,
    modalConfirmarAbierto,
    setModalConfirmarAbierto,
    handlePointerDown,
    handlePointerCancel,
    ejecutarDisparoPanico,

    // Gestión de Incidentes
    incidentesCodAzul,
    incidenteActivo,
    indiceSel,
    setIndiceSel,
    cronometroTexto,
    tiempoActual,
    segundosADuracion,

    // Acciones y Sirena
    sirenaSilenciada,
    silenciarSirena,
    reactivarSirena,
    tomarLlamado,
    atenderLlamado,
    cancelarLlamado,
  };
}
