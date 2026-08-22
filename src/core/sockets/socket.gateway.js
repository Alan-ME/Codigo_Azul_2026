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

/**
 * Normaliza el payload de incidente para compatibilidad con la app móvil.
 * @param {object} rawData
 * @returns {object}
 */
function normalizarIncidente(rawData) {
  const d = rawData.data || rawData;
  return {
    id:          d.incidenteId || d.id,
    codigoUUID:  d.codigoUUID || d.codigo_uuid,
    camaId:      d.camaId || d.ubicacionId || d.ubicacion?.id,
    estado:      (d.estado || 'ACTIVADO').toLowerCase().replace('_', '-'),
    estadoRaw:   d.estado,
    ubicacion:   d.ubicacion,
    activadoPor: d.activadoPor,
    reanimador:  d.reanimador,
    creadoEn:    d.createdAt || d.timestamp || new Date().toISOString(),
    latencia:    d.latenciaSegundos || null,
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
      origin: '*',
      methods: ['GET', 'POST', 'PUT'],
    },
  });

  // ── Middleware de Autenticación JWT en Handshake ────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Falta token de autenticación en el handshake.'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.data.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Token JWT inválido o expirado.'));
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

    // Canales compatibles
    io.emit('incidente:nuevo', incNormalizado);
    io.emit('codigo_azul_alerta', payload);
  });

  // 2. ACK de asistencia confirmado por reanimador
  appEvents.on('incidente:ack', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo ACK de incidente #${incNormalizado.id} (Latencia: ${incNormalizado.latencia}s).`);

    io.emit('incidente:actualizado', incNormalizado);
    io.emit('codigo_azul_atendido', payload);
  });

  // 3. Cancelación de incidente
  appEvents.on('incidente:cancelado', (payload) => {
    const incNormalizado = normalizarIncidente(payload);
    console.log(`[SOCKET] Retransmitiendo cancelación de incidente #${incNormalizado.id}.`);

    io.emit('incidente:actualizado', incNormalizado);
    io.emit('codigo_azul_cancelado', payload);
  });

  ioInstance = io;
  return io;
}

export function getSocketIO() {
  return ioInstance;
}
