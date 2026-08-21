// ─────────────────────────────────────────────────────────────
// src/core/middlewares/request-logger.middleware.js
// Logger de peticiones HTTP para telemetría y debugging.
// Usa morgan en modo 'dev' para desarrollo local.
// ─────────────────────────────────────────────────────────────
import morgan from 'morgan';

/**
 * Middleware de logging de requests HTTP.
 * Formato 'dev' muestra: método, ruta, status, tiempo de respuesta.
 */
export const requestLogger = morgan('dev');
