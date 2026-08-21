// ─────────────────────────────────────────────────────────────
// src/core/helpers/api-response.js
// Formato estandarizado de respuestas JSON para la API REST.
// Garantiza consistencia en todos los endpoints.
// ─────────────────────────────────────────────────────────────

/**
 * Respuesta exitosa.
 * @param {import('express').Response} res
 * @param {any}    data       - Payload de datos.
 * @param {number} statusCode - HTTP status (default 200).
 * @param {string} message    - Mensaje descriptivo opcional.
 */
export const sendSuccess = (res, data, statusCode = 200, message = 'OK') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Respuesta de error.
 * @param {import('express').Response} res
 * @param {string} message    - Mensaje de error.
 * @param {number} statusCode - HTTP status (default 500).
 * @param {any}    details    - Detalles adicionales opcionales.
 */
export const sendError = (res, message, statusCode = 500, details = null) => {
  const body = {
    success: false,
    message,
  };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
};
