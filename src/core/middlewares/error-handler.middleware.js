// ─────────────────────────────────────────────────────────────
// src/core/middlewares/error-handler.middleware.js
// Middleware global de manejo de errores.
// Captura instancias de ApiError y errores genéricos,
// devolviendo siempre una respuesta JSON consistente.
// ─────────────────────────────────────────────────────────────
import { ApiError } from '../helpers/api-error.js';

/**
 * Middleware de error global (debe ser el ÚLTIMO middleware montado).
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  // Si es un ApiError controlado, usar su statusCode.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Error no controlado — loguear y devolver 500 genérico.
  console.error('[ERROR] Error no controlado:', err);

  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};
