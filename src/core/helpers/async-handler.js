// ─────────────────────────────────────────────────────────────
// src/core/helpers/async-handler.js
// Wrapper Higher-Order Function para controllers async.
// Elimina la necesidad de try/catch repetitivo en cada handler,
// delegando los errores al middleware global de error-handler.
// ─────────────────────────────────────────────────────────────

/**
 * Envuelve un controller async para capturar errores automáticamente.
 * @param {Function} fn - Controller async (req, res, next).
 * @returns {Function}  - Middleware Express con catch integrado.
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
