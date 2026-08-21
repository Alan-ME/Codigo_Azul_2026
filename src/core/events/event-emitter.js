// ─────────────────────────────────────────────────────────────
// src/core/events/event-emitter.js
// EventEmitter centralizado para comunicación interna entre
// módulos. Los use cases emiten eventos aquí y Alex (Tiempo
// Real) suscribe listeners de Socket.IO a estos mismos eventos.
//
// Eventos definidos:
//   - 'incidente:activado'  → payload del incidente creado
//   - 'incidente:ack'       → payload del ACK con latencia
//   - 'incidente:cancelado' → payload de la cancelación
// ─────────────────────────────────────────────────────────────
import { EventEmitter } from 'node:events';

/** Instancia singleton del bus de eventos de la aplicación. */
export const appEvents = new EventEmitter();

// Aumentar el límite de listeners para soportar múltiples suscriptores.
appEvents.setMaxListeners(20);
