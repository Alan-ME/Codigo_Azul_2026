// ─────────────────────────────────────────────────────────────
// src/core/middlewares/rbac.middleware.js
// Control de acceso basado en roles (Role-Based Access Control - RBAC).
// Valida que el rol del usuario autenticado coincida con los permitidos.
// ─────────────────────────────────────────────────────────────
import { ApiError } from '../helpers/api-error.js';

/**
 * Middleware factory para restringir acceso por rol hospitalario.
 * @param  {...string} allowedRoles - Roles permitidos ('ADMINISTRADOR', 'MEDICO_ACTIVADOR', etc.)
 * @returns {import('express').RequestHandler}
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Usuario no autenticado.'));
    }

    // Si el usuario tiene rol ADMINISTRADOR, siempre tiene acceso
    if (req.user.rol === 'ADMINISTRADOR' || allowedRoles.includes(req.user.rol)) {
      return next();
    }

    return next(
      ApiError.forbidden(
        `Acceso restringido. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}. Tu rol actual es: ${req.user.rol}.`
      )
    );
  };
};
