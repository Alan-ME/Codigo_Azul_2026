import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from '../hooks/useSocket.js';
import { incidentesService } from '../services/incidentesService.js';
import { soundService } from '../services/soundService.js';

const IncidentesContext = createContext(null);

const ESTADOS_VISIBLES = new Set(['ACTIVADO', 'NOTIFICADO', 'EN_ATENCION', 'CANCELADO', 'RESUELTO']);
const ESTADOS_ALARMA = new Set(['ACTIVADO', 'NOTIFICADO']);

function normalizar(raw) {
  const d = raw?.data || raw;
  if (!d) return null;
  return {
    id: d.incidenteId ?? d.id,
    codigoUUID: d.codigoUUID ?? d.codigo_uuid ?? null,
    estado: (d.estado || 'ACTIVADO').toUpperCase(),
    ubicacion: d.ubicacion || null,
    activadoPor: d.activadoPor ?? d.activado_por ?? null,
    reanimador: d.reanimador ?? null,
    resultadoClinico: d.resultadoClinico ?? d.resultado_clinico ?? null,
    resultadoClinicoDescripcion: d.resultadoClinicoDescripcion ?? null,
    observaciones: d.observaciones ?? null,
    createdAt: d.createdAt ?? d.created_at ?? d.timestamp ?? new Date().toISOString(),
    latenciaSegundos: d.latenciaRespuestaSegundos ?? d.latenciaSegundos ?? null,
    motivoCancelacion: d.motivoCancelacion ?? d.motivo_cancelacion ?? null,
  };
}

export function IncidentesProvider({ children }) {
  const { token } = useAuth();
  const { socket, connected } = useSocket(token);
  const [incidentes, setIncidentes] = useState([]);

  useEffect(() => {
    if (!token) return;
    incidentesService
      .listarActivos()
      .then((activos) => setIncidentes(activos.map(normalizar).filter(Boolean)))
      .catch(() => setIncidentes([]));
  }, [token]);

  const upsert = useCallback((incidente) => {
    if (!incidente?.id) return;
    setIncidentes((prev) => {
      const idx = prev.findIndex((i) => i.id === incidente.id);
      if (idx === -1) return [incidente, ...prev];
      const clone = [...prev];
      clone[idx] = { ...clone[idx], ...incidente };
      return clone;
    });
  }, []);

  const remove = useCallback((id) => {
    setIncidentes((prev) => prev.filter((i) => i.id !== id));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    const onAlerta = (payload) => {
      const inc = normalizar(payload);
      if (inc) upsert({ ...inc, estado: 'ACTIVADO' });
    };
    const onAtendido = (payload) => {
      const inc = normalizar(payload);
      if (inc) upsert({ ...inc, estado: 'EN_ATENCION' });
    };
    const onCancelado = (payload) => {
      const inc = normalizar(payload);
      if (!inc) return;
      upsert({ ...inc, estado: 'CANCELADO' });
      // Desmontar la tarjeta luego de un breve pulso visual.
      setTimeout(() => remove(inc.id), 4000);
    };
    const onResuelto = (payload) => {
      const inc = normalizar(payload);
      if (!inc) return;
      upsert({ ...inc, estado: 'RESUELTO' });
      // Desmontar la tarjeta luego de un breve pulso visual.
      setTimeout(() => remove(inc.id), 4000);
    };

    socket.on('codigo_azul_alerta', onAlerta);
    socket.on('incidente:nuevo', onAlerta);
    socket.on('codigo_azul_atendido', onAtendido);
    socket.on('incidente:actualizado', onAtendido);
    socket.on('codigo_azul_cancelado', onCancelado);
    socket.on('incidente:cancelado', onCancelado);
    socket.on('codigo_azul_resuelto', onResuelto);
    socket.on('incidente:resuelto', onResuelto);

    return () => {
      socket.off('codigo_azul_alerta', onAlerta);
      socket.off('incidente:nuevo', onAlerta);
      socket.off('codigo_azul_atendido', onAtendido);
      socket.off('incidente:actualizado', onAtendido);
      socket.off('codigo_azul_cancelado', onCancelado);
      socket.off('incidente:cancelado', onCancelado);
      socket.off('codigo_azul_resuelto', onResuelto);
      socket.off('incidente:resuelto', onResuelto);
    };
  }, [socket, upsert, remove]);

  useEffect(() => {
    const hayAlarma = incidentes.some((i) => ESTADOS_ALARMA.has(i.estado));
    if (hayAlarma) {
      soundService.start().catch(() => { /* autoplay bloqueado hasta gesto del usuario */ });
    } else {
      soundService.stop();
    }
  }, [incidentes]);

  useEffect(() => () => soundService.stop(), []);

  const confirmarAck = useCallback((id) => incidentesService.confirmarAck(id), []);
  const cancelar = useCallback((id, motivo) => incidentesService.cancelar(id, motivo), []);
  const resolver = useCallback((id, resultadoClinico, observaciones) =>
    incidentesService.resolver(id, resultadoClinico, observaciones), []);
  const registrarEventoClinico = useCallback((id, tipoEvento, detalle) =>
    incidentesService.registrarEventoClinico(id, tipoEvento, detalle), []);

  const value = useMemo(
    () => ({
      incidentes: incidentes.filter((i) => ESTADOS_VISIBLES.has(i.estado)),
      conectado: connected,
      confirmarAck,
      cancelar,
      resolver,
      registrarEventoClinico,
    }),
    [incidentes, connected, confirmarAck, cancelar, resolver, registrarEventoClinico],
  );

  return <IncidentesContext.Provider value={value}>{children}</IncidentesContext.Provider>;
}

export function useIncidentes() {
  const ctx = useContext(IncidentesContext);
  if (!ctx) throw new Error('useIncidentes debe usarse dentro de <IncidentesProvider>.');
  return ctx;
}

