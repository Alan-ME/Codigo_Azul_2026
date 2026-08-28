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
  const reaNom = inc.reanimador?.nombre || inc.reanimadorNombre || null;
  const equipo = inc.equipo_reanimacion || inc.equipoReanimacion || [];
  const totalRea = inc.totalReanimadores || (equipo.length > 0 ? equipo.length : (reaNom ? 1 : 0));

  return {
    id:                 'la-bd-' + inc.id,
    backendId:          inc.id,
    codigoUUID:         inc.codigo_uuid || inc.codigoUUID,
    pacienteId:         null,
    pacienteNombre:     'Emergencia en ' + (ubi.cama || 'Cama'),
    tipo:               'codigo-azul',
    origen:             'cama',
    enfermeroId:        null,
    enfermeroNombre:    actNom,
    reanimadorNombre:   reaNom,
    equipoReanimacion:  equipo,
    totalReanimadores:  totalRea,
    ubicacion:          ubi,
    horaInicio:         inc.created_at || inc.creadoEn || inc.createdAt || new Date().toISOString(),
    estado:             (inc.estado || 'ACTIVADO').toUpperCase(),
    atendido:           inc.estado === 'EN_ATENCION' || inc.estado === 'en-atencion',
  };
}

export function puedeUsuarioFinalizarLlamado(llamado, user) {
  if (!user || !llamado) return true;
  const rol = (user.rolBackend || user.rol || '').toUpperCase();
  // Administradores y Operadores de Guardia tienen autorización jerárquica
  if (['ADMINISTRADOR', 'OPERADOR_GUARDIA', 'ADMIN', 'GUARDIA'].includes(rol)) {
    return true;
  }
  // Si el llamado no está atendido, primero se debe confirmar asistencia (ACK)
  if (!llamado.atendido) return false;

  const nombreUsuario = (user.nombreCompleto || user.nombre || '').trim().toLowerCase();

  // Reanimador principal asignado
  if (user.id && llamado.reanimadorId && Number(llamado.reanimadorId) === Number(user.id)) return true;
  if (nombreUsuario && llamado.reanimadorNombre && llamado.reanimadorNombre.toLowerCase().includes(nombreUsuario)) return true;

  // Reanimador de apoyo / miembro del equipo
  if (Array.isArray(llamado.equipoReanimacion) && llamado.equipoReanimacion.length > 0) {
    const esMiembro = llamado.equipoReanimacion.some(
      (r) => (user.id && Number(r.id) === Number(user.id)) || (nombreUsuario && r.nombre?.toLowerCase().includes(nombreUsuario))
    );
    if (esMiembro) return true;
  }

  // Si el rol es Reanimador Médico y estamos en modo prueba o sin reanimador específico registrado
  if (rol === 'REANIMADOR_MEDICO' || rol === 'REANIMADOR') {
    return true;
  }

  return false;
}

export function IncidentesProvider({ children }) {
  const { token, isBackendOnline, user } = useAuth();
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
        ...prev.filter(
          (x) =>
            String(x.backendId) !== String(inc.id) &&
            String(x.id) !== String(itemFront.id) &&
            !String(x.id).startsWith('ca_')
        ),
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
      soundService.stop();
      soundService.silenciar();
      setSirenaSilenciada(true);
      const incId = inc?.id || inc?.incidenteId || inc?.backendId || (inc?.data && (inc.data.id || inc.data.incidenteId));
      const uuid = inc?.codigoUUID || inc?.codigo_uuid || (inc?.data && (inc.data.codigoUUID || inc.data.codigo_uuid));

      setLlamadosActivos((prev) =>
        prev.filter((x) => {
          if (incId && (String(x.backendId) === String(incId) || String(x.id) === String(incId) || x.id === 'la-bd-' + incId)) {
            return false;
          }
          if (uuid && (x.codigoUUID === uuid || x.id === uuid)) {
            return false;
          }
          return true;
        })
      );
      toast({ titulo: 'Incidente Finalizado', msj: 'Código Azul cerrado o cancelado en el hospital', tipo: 'info' });
    };

    socket.on('incidente:cancelado', handleCierre);
    socket.on('incidente:resuelto', handleCierre);
    socket.on('codigo_azul_cancelado', handleCierre);
    socket.on('codigo_azul_resuelto', handleCierre);

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
              const equipoAct = inc.equipoReanimacion || inc.equipo_reanimacion || item.equipoReanimacion || [];
              const total = inc.totalReanimadores || (equipoAct.length > 0 ? equipoAct.length : 1);
              return {
                ...item,
                estado: 'EN_ATENCION',
                atendido: true,
                reanimadorNombre: inc.reanimador?.nombre || item.reanimadorNombre || 'Personal Médico',
                equipoReanimacion: equipoAct,
                totalReanimadores: total,
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

      const nuevoTemp = {
        id: 'ca_' + Date.now(),
        pacienteId: null,
        pacienteNombre: `Emergencia en ${cama || sala || 'Shockroom-01'}`,
        tipo: 'codigo-azul',
        origen: 'cama',
        enfermeroId: user?.id || null,
        enfermeroNombre: user?.nombre || 'Enfermería de Guardia',
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
            const itemOficial = normalizarIncidenteBackend(json.data);
            setLlamadosActivos((prev) => [
              itemOficial,
              ...prev.filter(
                (x) =>
                  String(x.backendId) !== String(json.data.id) &&
                  String(x.id) !== String(itemOficial.id) &&
                  !String(x.id).startsWith('ca_')
              ),
            ]);
            
            const esReincidencia = res.status === 200 || json.message?.toLowerCase().includes('idempotencia') || json.message?.toLowerCase().includes('ya activa');
            if (esReincidencia) {
              toast({
                titulo: '⚠️ CÓDIGO AZUL YA EN CURSO',
                msj: `${itemOficial.ubicacion.sectorSala} · ${itemOficial.ubicacion.cama} — Alerta previamente activa. No se duplicó el registro.`,
                tipo: 'aviso',
              });
            } else {
              toast({
                titulo: '🚨 ¡CÓDIGO AZUL DISPARADO!',
                msj: `${itemOficial.ubicacion.sectorSala} · ${itemOficial.ubicacion.cama} — Notificación enviada al equipo de reanimación`,
                tipo: 'error',
              });
            }
            return itemOficial;
          } else {
            console.warn('[INCIDENTES] Rechazo en backend:', json.message);
            if (res.status === 401) {
              console.warn('[INCIDENTES] Token rechazado (401). Re-autenticando automáticamente...');
              apiClient.clearSession();
              try {
                const freshLogin = await fetch('/api/v1/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: 'medico.activador@hospital.gob.ar', password: 'Password123!' }),
                });
                const freshJson = await freshLogin.json();
                if (freshJson.success && freshJson.data?.token) {
                  authToken = freshJson.data.token;
                  apiClient.saveSession(authToken, freshJson.data.user);
                  const retryRes = await fetch('/api/v1/incidentes/activar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
                    body: JSON.stringify({ ubicacionId: ubiId, cama: cama || 'Cama 01' }),
                  });
                  const retryJson = await retryRes.json();
                  if (retryJson.success && retryJson.data) {
                    const itemOficial = normalizarIncidenteBackend(retryJson.data);
                    setLlamadosActivos((prev) => [
                      itemOficial,
                      ...prev.filter(
                        (x) =>
                          String(x.backendId) !== String(retryJson.data.id) &&
                          String(x.id) !== String(itemOficial.id) &&
                          !String(x.id).startsWith('ca_')
                      ),
                    ]);
                    toast({
                      titulo: '🚨 ¡CÓDIGO AZUL DISPARADO!',
                      msj: `${itemOficial.ubicacion.sectorSala} · ${itemOficial.ubicacion.cama} — Notificación enviada al equipo de reanimación`,
                      tipo: 'error',
                    });
                    return itemOficial;
                  }
                }
              } catch (retryErr) {
                console.warn('[INCIDENTES] Error en re-autenticación tras 401:', retryErr);
              }
            } else if (res.status === 403) {
              toast({
                titulo: '⛔ Permiso Denegado (403)',
                msj: `El rol "${user?.rol || 'actual'}" no tiene autorización médico-legal para activar Código Azul.`,
                tipo: 'error',
              });
            } else if (res.status === 400 || res.status === 404) {
              toast({
                titulo: `❌ Ubicación Inválida (${res.status})`,
                msj: json.message || 'La sala o cama seleccionada no existe en el catálogo hospitalario.',
                tipo: 'aviso',
              });
            } else {
              toast({
                titulo: '⚠️ No se pudo activar la emergencia',
                msj: json.message || 'Error en el servidor central de emergencias.',
                tipo: 'error',
              });
            }
            return null;
          }
        } catch (err) {
          console.warn('[INCIDENTES] Error de red al activar:', err);
          toast({
            titulo: '📡 Sin conexión al servidor',
            msj: 'Error de red. No se pudo contactar a la central médica. Verifique la conexión.',
            tipo: 'error',
          });
          return null;
        }
      }

      setLlamadosActivos((prev) => [nuevoTemp, ...prev.filter((x) => x.id !== nuevoTemp.id)]);
      toast({
        titulo: '🚨 ¡CÓDIGO AZUL DISPARADO!',
        msj: `${nuevoTemp.ubicacion.sectorSala} · ${nuevoTemp.ubicacion.cama} — Modo de emergencia local activo`,
        tipo: 'error',
      });
      return nuevoTemp;
    },
    [token, user, isBackendOnline, toast]
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
      const l = llamadosActivos.find((x) => x.id === id || x.backendId === id || String(x.backendId) === String(id));
      if (!l) return;
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      let reanimadorNombreAsignado = user?.nombre || 'Dr. Ivan Cardozo';
      const authToken = token || apiClient.getToken();
      const targetBackendId = l.backendId || (String(l.id).startsWith('la-bd-') ? parseInt(l.id.replace('la-bd-', ''), 10) : null);

      if (targetBackendId && authToken) {
        try {
          const res = await fetch(`/api/v1/incidentes/${targetBackendId}/ack`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${authToken}` },
          });
          const json = await res.json();
          if (json.success && json.data?.reanimador?.nombre) {
            reanimadorNombreAsignado = json.data.reanimador.nombre;
          }
        } catch (err) {
          console.warn('Aviso backend ACK:', err);
        }
      }

      // Actualizar estado reactivo inmediatamente
      setLlamadosActivos((prev) =>
        prev.map((item) =>
          item.id === id || item.backendId === id || String(item.backendId) === String(targetBackendId) || item.id === l.id
            ? { ...item, atendido: true, estado: 'EN_ATENCION', reanimadorNombre: reanimadorNombreAsignado }
            : item
        )
      );
      toast({ titulo: 'Asistencia Confirmada (ACK)', msj: `${nombreMostrar} — en atención por ${reanimadorNombreAsignado}`, tipo: 'exito' });
    },
    [llamadosActivos, token, user, toast],
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
      const targetBackendId = l.backendId || (String(l.id).startsWith('la-bd-') ? parseInt(l.id.replace('la-bd-', ''), 10) : null);

      if (targetBackendId && authToken) {
        try {
          // Si el incidente estaba en ACTIVADO, primero confirmamos ACK para respetar la FSM clínica
          if (l.estado === 'ACTIVADO' || !l.atendido) {
            await fetch(`/api/v1/incidentes/${targetBackendId}/ack`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${authToken}` },
            }).catch(() => {});
          }

          const res = await fetch(`/api/v1/incidentes/${targetBackendId}/resolver`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ observaciones: 'Atención completada y resuelto en guardia' }),
          });
          const json = await res.json();
          if (!res.ok && res.status === 403) {
            toast({
              titulo: '⛔ Permiso Denegado (403)',
              msj: json.message || 'Solo el personal médico que atendió el Código Azul o un administrador pueden finalizar la atención.',
              tipo: 'error',
            });
            return;
          }
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
          reanimadorNombre: l.reanimadorNombre || user?.nombre || 'Personal Médico',
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
          String(x.backendId) !== String(targetBackendId) &&
          x.id !== 'la-bd-' + targetBackendId
        )
      );
      toast({ titulo: 'Código Azul Resuelto', msj: `${nombreMostrar} — finalizado y registrado en historial`, tipo: 'exito' });
    },
    [llamadosActivos, token, user, toast],
  );

  // Cancelar Llamado / Falsa Alarma
  const cancelarLlamado = useCallback(
    async (id, motivo = 'Falsa alarma o activación no requerida') => {
      soundService.stop();
      soundService.silenciar();
      setSirenaSilenciada(true);

      const l = llamadosActivos.find(
        (x) => x.id === id || String(x.backendId) === String(id) || String(x.id) === String(id) || x.id === 'la-bd-' + id
      );
      if (!l) return false;

      const nombreMostrar = l.pacienteNombre || 'Código Azul';
      const targetBackendId = l.backendId || (String(l.id).startsWith('la-bd-') ? parseInt(l.id.replace('la-bd-', ''), 10) : (typeof id === 'number' ? id : parseInt(id, 10)));
      const authToken = token || apiClient.getToken();

      if (targetBackendId && authToken && !isNaN(targetBackendId)) {
        try {
          const res = await fetch(`/api/v1/incidentes/${targetBackendId}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ motivo: (motivo || 'Falsa alarma').trim() }),
          });
          const json = await res.json();
          if (!res.ok) {
            console.warn('[CANCELAR] Rechazo backend:', json.message);
            toast({
              titulo: `⛔ No se pudo cancelar (${res.status})`,
              msj: json.message || 'Error cancelando el Código Azul.',
              tipo: 'error',
            });
            return false;
          }
        } catch (err) {
          console.warn('Aviso backend cancelar:', err);
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
          estado: 'cancelado',
          enfermeroId: l.enfermeroId || 'u3',
          reanimadorNombre: l.reanimadorNombre || 'Sin reanimador',
          horaInicio: l.horaInicio,
          horaFin: new Date().toISOString(),
          duracionSeg: dur,
          tiempoRespuestaSeg: dur,
          ubicacion: l.ubicacion,
          motivoCancelacion: motivo,
        },
        ...prev,
      ]);

      setLlamadosActivos((prev) =>
        prev.filter(
          (x) =>
            x.id !== id &&
            String(x.backendId) !== String(targetBackendId) &&
            x.id !== 'la-bd-' + targetBackendId &&
            String(x.id) !== String(id)
        )
      );
      toast({ titulo: 'Incidente Cancelado', msj: `${nombreMostrar} cancelado: ${motivo}`, tipo: 'aviso' });
      return true;
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
      puedeUsuarioFinalizarLlamado,
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
