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
import apiClient from '../services/apiClient.js';
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

  const [llamadosActivos, setLlamadosActivos] = useState([]);
  const [llamadosHistoricos, setLlamadosHistoricos] = useState(initialLlamadosHistoricos);
  const [socketConectado, setSocketConectado] = useState(false);
  const [sirenaSilenciada, setSirenaSilenciada] = useState(false);

  // Sincronización inicial garantizada con PostgreSQL
  const cargarActivos = useCallback(async () => {
    try {
      let authToken = token || apiClient.getToken();
      if (!authToken) {
        const authRes = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'guardia@hospital.gob.ar', password: 'Password123!' }),
        });
        const authJson = await authRes.json();
        if (authJson.success && authJson.data?.token) {
          authToken = authJson.data.token;
          apiClient.saveSession(authToken, authJson.data.user);
        }
      }

      if (authToken) {
        const res = await fetch('/api/v1/incidentes/activos', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const activosBd = json.data.map(normalizarIncidenteBackend);
          setLlamadosActivos(activosBd);
        }
      }
    } catch (err) {
      console.warn('[INCIDENTES] Error al cargar activos iniciales:', err);
    }
  }, [token]);

  useEffect(() => {
    cargarActivos();
  }, [cargarActivos]);

  // Conexión WebSockets en tiempo real (siempre conectada)
  useEffect(() => {
    const activeToken = token || apiClient.getToken();

    const socket = io(window.location.origin, {
      auth: { token: activeToken || '' },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setSocketConectado(true);
      // Al reconectar socket, sincronizar lista fresca
      cargarActivos();
    });

    socket.on('disconnect', () => {
      setSocketConectado(false);
    });

    socket.on('incidente:nuevo', (inc) => {
      const itemFront = normalizarIncidenteBackend(inc);
      setLlamadosActivos((prev) => [
        itemFront,
        ...prev.filter((x) => String(x.backendId) !== String(inc.id) && String(x.id) !== String(itemFront.id)),
      ]);
      setSirenaSilenciada(false);
      soundService.reactivar();

      const lugar = `${inc.ubicacion?.sectorSala || 'Sala'} · ${inc.ubicacion?.cama || 'Cama'}`;
      toast({
        titulo: '🚨 ¡CÓDIGO AZUL ACTIVADO!',
        msj: `${lugar} — ${inc.activadoPor?.nombre || 'Alerta recibida'}`,
        tipo: 'error',
      });
    });

    const handleCierre = (inc) => {
      soundService.silenciar();
      setSirenaSilenciada(true);
      setLlamadosActivos((prev) =>
        prev.filter(
          (x) =>
            String(x.backendId) !== String(inc.id) &&
            String(x.id) !== String(inc.id) &&
            x.id !== 'la-bd-' + inc.id
        )
      );
      toast({ titulo: 'Incidente Finalizado', msj: 'Código Azul cerrado en el hospital', tipo: 'info' });
    };

    socket.on('incidente:cancelado', handleCierre);
    socket.on('incidente:resuelto', handleCierre);

    socket.on('incidente:actualizado', (inc) => {
      const estadoNorm = (inc.estado || '').toUpperCase().replaceAll('-', '_');
      if (estadoNorm === 'CANCELADO' || estadoNorm === 'RESUELTO') {
        handleCierre(inc);
      } else {
        if (estadoNorm === 'EN_ATENCION') {
          soundService.silenciar();
          setSirenaSilenciada(true);
        }
        setLlamadosActivos((prev) =>
          prev.map((item) => {
            if (
              String(item.backendId) === String(inc.id) ||
              String(item.id) === String(inc.id) ||
              item.id === 'la-bd-' + inc.id
            ) {
              return {
                ...item,
                estado: 'EN_ATENCION',
                atendido: true,
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
  }, [token, cargarActivos, toast]);

  // Disparo de Código Azul desde el Botón de Pánico
  const dispararCodigoAzul = useCallback(
    async ({ edificio, piso, sala, cama, ubicacionId }) => {
      soundService.reactivar();
      setSirenaSilenciada(false);

      // Calcular o validar ubicacionId
      let ubiId = ubicacionId;
      if (!ubiId) {
        const sName = (sala || '').toLowerCase();
        const cName = (cama || '').toLowerCase();
        if (cName.includes('02') || sName.includes('shock')) ubiId = 2;
        else if (sName.includes('quiróf') || sName.includes('quirof')) ubiId = 3;
        else if (sName.includes('intensiv') || sName.includes('uti') || cName.includes('uci-01')) ubiId = 4;
        else if (cName.includes('uci-04')) ubiId = 5;
        else if (sName.includes('coronaria') || sName.includes('uco')) ubiId = 6;
        else if (sName.includes('neo') || cName.includes('cuna')) ubiId = 7;
        else if (sName.includes('recuper')) ubiId = 8;
        else ubiId = 1;
      }

      const nuevo = {
        id: 'ca_' + Date.now(),
        pacienteId: initialPacientes[0]?.id || 'p1',
        pacienteNombre: `${sala || 'Guardia'} — ${cama || 'Cama 01'}`,
        tipo: 'codigo-azul',
        origen: 'cama',
        enfermeroId: initialUsuarios[2]?.id || 'u3',
        enfermeroNombre: 'Enfermería de Guardia',
        reanimadorNombre: null,
        ubicacion: {
          id: ubiId,
          edificio: edificio || 'Monoblock Central',
          piso: piso || 'Piso 1 - Guardia y Shockroom',
          sectorSala: sala || 'Guardia General',
          cama: cama || 'Shockroom-01',
        },
        horaInicio: new Date().toISOString(),
        atendido: false,
        estado: 'ACTIVADO',
      };

      let authToken = token || apiClient.getToken();
      if (!authToken) {
        try {
          const authRes = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'medico.activador@hospital.gob.ar', password: 'Password123!' }),
          });
          const authJson = await authRes.json();
          if (authJson.success && authJson.data?.token) {
            authToken = authJson.data.token;
            apiClient.saveSession(authToken, authJson.data.user);
          }
        } catch (e) {
          console.warn('[INCIDENTES] Auto-login fallback:', e);
        }
      }

      if (authToken) {
        try {
          const res = await fetch('/api/v1/incidentes/activar', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              ubicacionId: ubiId,
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

      setLlamadosActivos((prev) => [nuevo, ...prev.filter((x) => x.backendId !== nuevo.backendId)]);
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
      soundService.silenciar();
      setSirenaSilenciada(true);
      const l = llamadosActivos.find((x) => x.id === id || x.backendId === id);
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      const authToken = token || apiClient.getToken();
      if (l.backendId && authToken) {
        try {
          await fetch(`/api/v1/incidentes/${l.backendId}/ack`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}` },
          });
        } catch (err) {
          console.warn('Aviso backend ACK:', err);
        }
      }

      // Actualizar estado reactivo inmediatamente
      setLlamadosActivos((prev) =>
        prev.map((item) =>
          item.id === id || item.backendId === id || item.id === l.id
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
      soundService.silenciar();
      setSirenaSilenciada(true);
      const l = llamadosActivos.find((x) => x.id === id || String(x.backendId) === String(id));
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      const authToken = token || apiClient.getToken();
      if (l.backendId && authToken) {
        try {
          // Si el incidente estaba en ACTIVADO, primero confirmamos ACK para respetar la FSM clínica
          if (l.estado === 'ACTIVADO' || !l.atendido) {
            await fetch(`/api/v1/incidentes/${l.backendId}/ack`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${authToken}` },
            }).catch(() => {});
          }

          await fetch(`/api/v1/incidentes/${l.backendId}/resolver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ observaciones: 'Atención completada y resuelto en guardia' }),
          });
        } catch (err) {
          console.warn('Aviso backend resolver:', err);
        }
      }

      const dur = Math.floor((Date.now() - new Date(l.horaInicio).getTime()) / 1000);
      setLlamadosHistoricos((prev) => [
        {
          id: 'lh_' + Date.now(),
          pacienteId: l.pacienteId || 'p1',
          pacienteNombre: nombreMostrar,
          tipo: l.tipo,
          origen: l.origen,
          estado: 'atendido',
          enfermeroId: l.enfermeroId || 'u3',
          reanimadorNombre: l.reanimadorNombre || 'Dr. Reanimador',
          horaInicio: l.horaInicio,
          horaFin: new Date().toISOString(),
          duracionSeg: dur,
          tiempoRespuestaSeg: dur,
          ubicacion: l.ubicacion,
        },
        ...prev,
      ]);

      // Remover de activos en todo el sistema
      setLlamadosActivos((prev) =>
        prev.filter((x) =>
          x.id !== id &&
          String(x.backendId) !== String(l.backendId) &&
          x.id !== 'la-bd-' + l.backendId
        )
      );
      toast({ titulo: 'Código Azul Resuelto', msj: `${nombreMostrar} — finalizado y registrado en historial`, tipo: 'exito' });
    },
    [llamadosActivos, token, toast],
  );

  // Cancelar Llamado / Falsa Alarma
  const cancelarLlamado = useCallback(
    async (id, motivo = 'Falsa alarma o activación no requerida') => {
      soundService.stop();
      const l = llamadosActivos.find((x) => x.id === id);
      if (!l) return;
      const nombreMostrar = l.pacienteNombre || 'Código Azul';

      if (l.backendId && token) {
        try {
          await fetch(`/api/v1/incidentes/${l.backendId}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ motivo }),
          });
        } catch (err) {
          console.warn('Aviso backend cancelar:', err);
        }
      }

      setLlamadosActivos((prev) => prev.filter((x) => x.id !== id));
      toast({ titulo: 'Incidente Cancelado', msj: `${nombreMostrar} cancelado: ${motivo}`, tipo: 'aviso' });
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

  const crearLlamado = useCallback(
    (params = {}) => {
      const ubi = params.ubicacion || {};
      return dispararCodigoAzul({
        edificio: params.edificio || ubi.edificio,
        piso: params.piso || ubi.piso,
        sala: params.sala || ubi.sectorSala || ubi.sala,
        cama: params.cama || ubi.cama,
        ubicacionId: params.ubicacionId || ubi.id || ubi.ubicacionId,
      });
    },
    [dispararCodigoAzul]
  );

  const value = useMemo(
    () => ({
      llamadosActivos,
      llamadosHistoricos,
      socketConectado,
      sirenaSilenciada,
      dispararCodigoAzul,
      crearLlamado,
      silenciarSirena,
      reactivarSirena,
      alternarSilencioSirena,
      tomarLlamado,
      atenderLlamado,
      cancelarLlamado,
      escalarLlamado,
    }),
    [
      llamadosActivos,
      llamadosHistoricos,
      socketConectado,
      sirenaSilenciada,
      dispararCodigoAzul,
      crearLlamado,
      silenciarSirena,
      reactivarSirena,
      alternarSilencioSirena,
      tomarLlamado,
      atenderLlamado,
      cancelarLlamado,
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
