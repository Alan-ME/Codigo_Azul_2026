// ─────────────────────────────────────────────────────────────
// src/core/events/event-emitter.js
// EventEmitter centralizado para comunicación interna entre
// módulos (Clean Architecture Domain Events).
//
// Modo de Operación:
//   - On-Premise Single-Node (Default): EventEmitter nativo en RAM (<1ms latencia).
//   - Multi-Node Cluster (Escalabilidad Horizontal): Interfaz preparada para
//     conectar con broker Redis Pub/Sub (@socket.io/redis-adapter).
//
// Eventos del Dominio:
//   - 'incidente:activado'       → Payload del incidente creado y despachado.
//   - 'incidente:ack'            → Payload del ACK con latencia de reanimador.
//   - 'incidente:evento_clinico' → Hitos intermedios (AED, RCP, Adrenalina).
//   - 'incidente:cancelado'      → Payload de cancelación operativa.
//   - 'incidente:resuelto'       → Cierre clínico con métrica ROSC (AHA/PERKI).
// ─────────────────────────────────────────────────────────────
import { EventEmitter } from 'node:events';

/** Instancia singleton del bus de eventos de la aplicación. */
export const appEvents = new EventEmitter();

// Aumentar el límite de listeners para soportar múltiples suscriptores (Sockets, FCM, Telemetría).
appEvents.setMaxListeners(30);

