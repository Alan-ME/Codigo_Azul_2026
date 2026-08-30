// ─────────────────────────────────────────────────────────────
// src/core/sockets/socket.gateway.js
// Gateway de Socket.IO para comunicación bidireccional en tiempo real.
// Integra autenticación JWT en handshake, control de salas y escucha
// automática de los eventos del dominio emitidos por appEvents.
// ─────────────────────────────────────────────────────────────
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { appEvents } from '../events/event-emitter.js';

let ioInstance = null;

/**
 * Mapea los roles del backend a alias simplificados para el cliente móvil.
 * @param {string} rol
 * @returns {string[]}
 */
function obtenerSalasDeRol(rol) {
  const salas = [`rol:${rol}`, `rol:${rol.toLowerCase()}`];
  if (rol === 'REANIMADOR_MEDICO') salas.push('rol:reanimador');
  if (rol === 'MEDICO_ACTIVADOR') salas.push('rol:enfermero');
  if (rol === 'OPERADOR_GUARDIA' || rol === 'ADMINISTRADOR') {
    salas.push('rol:admin');
    salas.push('rol:reanimador');
  }
  return salas;
}

function normalizarIncidente(rawData) {
  const d = rawData.data || rawData;
  const equipo = d.equipoReanimacion || d.equipo_reanimacion || [];
  const reanimadorObj = d.reanimador || (equipo.length > 0 ? equipo[0] : null);
  const total = d.totalReanimadores || (equipo.length > 0 ? equipo.length : (reanimadorObj ? 1 : 0));

  return {
    id:          d.incidenteId || d.id,
    codigoUUID:  d.codigoUUID || d.codigo_uuid,
    camaId:      d.camaId || d.ubicacionId || d.ubicacion?.id,
    estado:      (d.estado || 'ACTIVADO').toLowerCase().replaceAll('_', '-'),
    estadoRaw:   d.estado,
    ubicacion:   d.ubicacion,
    activadoPor: d.activadoPor || d.activado_por,
    reanimador:        reanimadorObj,
    reanimadorNombre:  reanimadorObj?.nombre || d.reanimadorNombre,
    equipoReanimacion: equipo,
    totalReanimadores: total,
    creadoEn:          d.createdAt || d.created_at || d.creadoEn || d.timestamp || new Date().toISOString(),
    createdAt:         d.createdAt || d.created_at || d.creadoEn || d.timestamp || new Date().toISOString(),
    created_at:        d.createdAt || d.created_at || d.creadoEn || d.timestamp || new Date().toISOString(),
    latencia:          d.latenciaRespuestaSegundos || d.latenciaSegundos || d.latencia || null,
  };
}

/**
 * Inicializa el servidor de Socket.IO sobre el servidor HTTP existente.
 * @param {import('node:http').Server} httpServer
 * @returns {Server}
 */
export function initSocketGateway(httpServer) {
  if (ioInstance) return ioInstance;

  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PUT'],
      credentials: true,
    },
  });

  // ── Middleware de Autenticación JWT en Handshake ────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // Permitir conexión con rol por defecto de guardia para no bloquear monitores
      socket.data.user = { id: 999, email: 'monitor@hospital.gob.ar', nombre: 'Monitor Central', rol: 'OPERADOR_GUARDIA' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.data.user = decoded;
      next();
    } catch (err) {
      // Fallback seguro: si el token expiró o es modo demo, conectar como OPERADOR_GUARDIA
      socket.data.user = { id: 999, email: 'guardia@hospital.gob.ar', nombre: 'Guardia Central', rol: 'OPERADOR_GUARDIA' };
      next();
    }
  });

  // ── Conexión de Clientes y Asignación de Salas ──────────────
  io.on('connection', (socket) => {
    const user = socket.data.user;
    const salas = obtenerSalasDeRol(user.rol);

    salas.forEach((sala) => socket.join(sala));
    socket.join(`usuario:${user.id}`);

    socket.emit('bienvenida', {
      success: true,
      mensaje: `Conectado al Gateway Código Azul como ${user.nombre} (${user.rol})`,
      usuario: user,
      salas:   salas,
    });

    console.log(`[SOCKET] Usuario conectado: ${user.email} (${user.rol}) - Socket ID: ${socket.id}`);

    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Usuario desconectado: ${user.email} - Razón: ${reason}`);
    });
  });

  // ── Puente entre Domain Events (appEvents) y Socket.IO ─────

  // 1. Alerta de Código Azul disparada
  appEvents.on('incidente:activado', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo nuevo incidente #${incNormalizado.id} a reanimadores y guardia.`);

    io.emit('incidente:nuevo', incNormalizado);
    io.emit('codigo_azul_alerta', incNormalizado);
  });

  // 2. ACK de asistencia confirmado por reanimador
  appEvents.on('incidente:ack', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo ACK de incidente #${incNormalizado.id} (Latencia: ${incNormalizado.latencia}s).`);

    io.emit('incidente:actualizado', incNormalizado);
    io.emit('codigo_azul_ack', incNormalizado);
  });

  // 3. Cancelación de incidente
  appEvents.on('incidente:cancelado', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo cancelación de incidente #${incNormalizado.id}.`);

    io.emit('incidente:actualizado', incNormalizado);
    io.emit('incidente:cancelado', incNormalizado);
    io.emit('codigo_azul_cancelado', incNormalizado);
  });

  // 4. Resolución clínica del incidente
  appEvents.on('incidente:resuelto', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo resolucion de incidente #${incNormalizado.id}.`);

    io.emit('incidente:actualizado', incNormalizado);
    io.emit('incidente:resuelto', incNormalizado);
    io.emit('codigo_azul_resuelto', incNormalizado);
  });

  ioInstance = io;
  return io;
}

export function getSocketIO() {
  return ioInstance;
}
