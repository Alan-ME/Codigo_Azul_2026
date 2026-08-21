// ─────────────────────────────────────────────────────────────
// src/core/helpers/api-error.js
// Clase de error personalizada con código HTTP.
// Permite lanzar errores tipados que el error-handler convierte
// automáticamente en respuestas JSON formateadas.
// ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  /**
   * @param {string} message    - Mensaje descriptivo del error.
   * @param {number} statusCode - Código HTTP (400, 401, 403, 404, 409, 500…).
   * @param {any}    details    - Detalles adicionales opcionales.
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  // Factories para los errores más comunes.

  static badRequest(message = 'Solicitud inválida', details = null) {
    return new ApiError(message, 400, details);
  }

  static unauthorized(message = 'No autorizado') {
    return new ApiError(message, 401);
  }

  static forbidden(message = 'Acceso denegado — permisos insuficientes') {
    return new ApiError(message, 403);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(message, 404);
  }

  static conflict(message = 'Conflicto — el recurso ya existe') {
    return new ApiError(message, 409);
  }

  static internal(message = 'Error interno del servidor') {
    return new ApiError(message, 500);
  }
}
