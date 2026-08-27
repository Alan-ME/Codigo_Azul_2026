// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/context/IncidentesContext.jsx
// Contexto de llamados e incidentes en tiempo real.
// Sincronización Total: Mobile (Enfermero/Reanimador) ↔ Dashboard PC ↔ Backend.
// ─────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useUI } from './UIContext.jsx';
import { initialLlamadosActivos, initialLlamadosHistoricos, initialPacientes, initialUsuarios } from '../data/mockData.js';
import { soundService } from '../services/soundService.js';
import { io } from 'socket.io-client';

const IncidentesContext = createContext(null);

function normalizarIncidenteBackend(inc) {
  const ubi = inc.ubicacion || {};
  const actNom = inc.activado_por?.nombre || inc.activadoPor?.nombre || 'Personal Médico';
  const reaNom = inc.reanimador?.nombre || null;

  return {
    id:               'la-bd-' + inc.id,
    backendId:        inc.id,
    codigoUUID:       inc.codigo_uuid || inc.codigoUUID,
    pacienteId:       null,
    pacienteNombre:   'Emergencia en ' + (ubi.cama || 'Cama'),
    tipo:             'codigo-azul',
    origen:           'cama',
    enfermeroId:      null,
    enfermeroNombre:  actNom,
    reanimadorNombre: reaNom,
    ubicacion:        ubi,
    horaInicio:       inc.created_at || inc.creadoEn || inc.createdAt || new Date().toISOString(),
    estado:           (inc.estado || 'ACTIVADO').toUpperCase(),
    atendido:         inc.estado === 'EN_ATENCION' || inc.estado === 'en-atencion',
  };
}

export function IncidentesProvider({ children }) {
  const { token, isBackendOnline } = useAuth();
  const { toast } = useUI();

  const [llamadosActivos, setLlamadosActivos] = useState(initialLlamadosActivos);
  const [llamadosHistoricos, setLlamadosHistoricos] = useState(initialLlamadosHistoricos);
  const [socketConectado, setSocketConectado] = useState(false);
  const [sirenaSilenciada, setSirenaSilenciada] = useState(false);

  // Sincronización inicial con PostgreSQL si está online
  useEffect(() => {
    if (!isBackendOnline || !token) return;

    fetch('/api/v1/incidentes/activos', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const activosBd = json.data.map(normalizarIncidenteBackend);
          setLlamadosActivos((prev) => {
            const mockLocales = prev.filter((x) => !x.backendId);
            return [...activosBd, ...mockLocales];
          });
        }
      })
      .catch((err) => console.warn('[INCIDENTES] Error cargando activos:', err));
  }, [isBackendOnline, token]);

  // Conexión WebSockets en tiempo real
  useEffect(() => {
    if (!token) return;

    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConectado(true);
    });

    socket.on('disconnect', () => {
      setSocketConectado(false);
    });

    socket.on('incidente:nuevo', (inc) => {
      const itemFront = normalizarIncidenteBackend(inc);
      setLlamadosActivos((prev) => [itemFront, ...prev.filter((x) => x.backendId !== inc.id)]);
      setSirenaSilenciada(false);
      soundService.reactivar();

      const lugar = `${inc.ubicacion?.sectorSala || 'Sala'} · ${inc.ubicacion?.cama || 'Cama'}`;
      toast({
        titulo: '🚨 ¡CÓDIGO AZUL ACTIVADO!',
        msj: `${lugar} — ${inc.activadoPor?.nombre || 'Alerta recibida'}`,
        tipo: 'error',
      });
    });

    socket.on('incidente:actualizado', (inc) => {
      const estadoNorm = (inc.estado || '').toUpperCase();
      if (estadoNorm === 'CANCELADO' || estadoNorm === 'RESUELTO') {
        soundService.stop();
        setLlamadosActivos((prev) => prev.filter((x) => x.backendId !== inc.id && x.id !== 'la-bd-' + inc.id));
        toast({ titulo: 'Incidente Resuelto', msj: `Código Azul cerrado en el hospital`, tipo: 'info' });
      } else {
        if (estadoNorm === 'EN_ATENCION') {
          soundService.stop();
        }
        setLlamadosActivos((prev) =>
          prev.map((item) => {
            if (item.backendId === inc.id || item.id === 'la-bd-' + inc.id) {
              return {
                ...item,
                estado: inc.estado,
                atendido: inc.estado === 'EN_ATENCION' || inc.estado === 'en-atencion',
                reanimadorNombre: inc.reanimador?.nombre || item.reanimadorNombre || 'Dr. Reanimador',
              };
            }
            return item;
          })
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, toast]);

  // Disparo de Código Azul desde el Botón de Pánico
  const dispararCodigoAzul = useCallback(
    async ({ edificio, piso, sala, cama }) => {
      soundService.reactivar();
      setSirenaSilenciada(false);

      const nuevo = {
        id: 'ca_' + Date.now(),
        pacienteId: initialPacientes[0]?.id || 'p1',
        pacienteNombre: `${sala} — ${cama}`,
        tipo: 'codigo-azul',
        origen: 'cama',
        enfermeroId: initialUsuarios[2]?.id || 'u3',
        enfermeroNombre: 'Enfermería de Guardia',
        reanimadorNombre: null,
        ubicacion: {
          edificio: edificio || 'Edificio Central',
          piso: piso || 'Piso 1 - Críticos',
          sectorSala: sala || 'UTI Adultos',
          cama: cama || 'Cama 01',
        },
        horaInicio: new Date().toISOString(),
        atendido: false,
        estado: 'ACTIVADO',
      };

      if (token && isBackendOnline) {
        try {
          const res = await fetch('/api/v1/incidentes/activar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ubicacionId: 1,
              cama: cama || 'Cama 01',
            }),
          });
          const json = await res.json();
          if (json.success && json.data) {
            nuevo.backendId = json.data.id;
            nuevo.codigoUUID = json.data.codigo_uuid || json.data.codigoUUID;
          }
        } catch (err) {
          console.warn('[INCIDENTES] Disparo registrado localmente:', err);
        }
      }

      setLlamadosActivos((prev) => [nuevo, ...prev]);
      toast({
        titulo: '🚨 ¡CÓDIGO AZUL DISPARADO!',
        msj: `${nuevo.ubicacion.sectorSala} · ${nuevo.ubicacion.cama}`,
        tipo: 'error',
      });
      return nuevo;
    },
    [token, isBackendOnline, toast]
  );

  // Silenciar Sirena
  const silenciarSirena = useCallback(() => {
    soundService.silenciar();
    setSirenaSilenciada(true);
    toast({ titulo: 'Sirena Silenciada', msj: 'El incidente continúa activo en curso', tipo: 'info' });
  }, [toast]);

  // Reactivar Sirena
  const reactivarSirena = useCallback(() => {
    soundService.reactivar();
    setSirenaSilenciada(false);
    toast({ titulo: 'Sirena Reactivada', msj: 'Alarma sonora en curso', tipo: 'aviso' });
  }, [toast]);

  const alternarSilencioSirena = useCallback(() => {
    if (sirenaSilenciada) {
      reactivarSirena();
    } else {
      silenciarSirena();
    }
  }, [sirenaSilenciada, reactivarSirena, silenciarSirena]);

  // Tomar Llamado / Confirmar Asistencia (ACK)
  const tomarLlamado = useCallback(
    async (id) => {
      soundService.stop();
      const l = llamadosActivos.find((x) => x.id === id);
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      if (l.backendId && token) {
        try {
          await fetch(`/api/v1/incidentes/${l.backendId}/ack`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (err) {
          console.warn('Aviso backend ACK:', err);
        }
      }

      // Actualizar estado reactivo inmediatamente
      setLlamadosActivos((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, atendido: true, estado: 'EN_ATENCION', reanimadorNombre: 'Dr. Reanimador' }
            : item
        )
      );
      toast({ titulo: 'Asistencia Confirmada', msj: `${nombreMostrar} — equipo de reanimación en camino`, tipo: 'exito' });
    },
    [llamadosActivos, token, toast],
  );

  // Atender Llamado / Finalizar Emergencia (Cierra en Dashboard, Tablero y Mobile)
  const atenderLlamado = useCallback(
    async (id) => {
      soundService.stop();
      const l = llamadosActivos.find((x) => x.id === id);
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      if (l.backendId && token) {
        try {
          await fetch(`/api/v1/incidentes/${l.backendId}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ motivo: 'Atendido y resuelto en guardia' }),
          });
        } catch (err) {
          console.warn('Aviso backend cancelar:', err);
        }
      }

      const dur = Math.floor((Date.now() - new Date(l.horaInicio).getTime()) / 1000);
      setLlamadosHistoricos((prev) => [
        {
          id: 'lh_' + Date.now(),
          pacienteId: l.pacienteId,
          tipo: l.tipo,
          origen: l.origen,
          estado: 'atendido',
          enfermeroId: l.enfermeroId,
          reanimadorNombre: l.reanimadorNombre || 'Dr. Reanimador',
          horaInicio: l.horaInicio,
          horaFin: new Date().toISOString(),
          duracionSeg: dur,
          tiempoRespuestaSeg: dur,
        },
        ...prev,
      ]);

      // Remover de activos en todo el sistema
      setLlamadosActivos((prev) => prev.filter((x) => x.id !== id));
      toast({ titulo: 'Código Azul Resuelto', msj: `${nombreMostrar} — finalizado y registrado en historial`, tipo: 'exito' });
    },
    [llamadosActivos, token, toast],
  );

  const escalarLlamado = useCallback(
    (id) => {
      const l = llamadosActivos.find((x) => x.id === id);
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      setLlamadosActivos((prev) =>
        prev.map((item) => (item.id === id ? { ...item, tipo: 'codigo-azul' } : item))
      );
      toast({ titulo: '🚨 Escalado a Código Azul', msj: `${nombreMostrar} — protocolo de emergencia activado`, tipo: 'aviso' });
    },
    [llamadosActivos, toast],
  );

  const value = useMemo(
    () => ({
      llamadosActivos,
      llamadosHistoricos,
      socketConectado,
      sirenaSilenciada,
      dispararCodigoAzul,
      silenciarSirena,
      reactivarSirena,
      alternarSilencioSirena,
      tomarLlamado,
      atenderLlamado,
      escalarLlamado,
    }),
    [
      llamadosActivos,
      llamadosHistoricos,
      socketConectado,
      sirenaSilenciada,
      dispararCodigoAzul,
      silenciarSirena,
      reactivarSirena,
      alternarSilencioSirena,
      tomarLlamado,
      atenderLlamado,
      escalarLlamado,
    ],
  );

  return <IncidentesContext.Provider value={value}>{children}</IncidentesContext.Provider>;
}

export function useIncidentes() {
  const ctx = useContext(IncidentesContext);
  if (!ctx) throw new Error('useIncidentes debe usarse dentro de un <IncidentesProvider>');
  return ctx;
}
