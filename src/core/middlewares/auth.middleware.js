// ─────────────────────────────────────────────────────────────
// src/core/middlewares/auth.middleware.js
// Middleware de verificación de JSON Web Token (JWT).
// Extrae el Bearer token del header Authorization y populates req.user.
// ─────────────────────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from '../helpers/api-error.js';

/**
 * Middleware para proteger endpoints que requieren usuario autenticado.
 */
export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      ApiError.unauthorized('Token de autenticación no provisto o formato inválido.')
    );
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded; // { id, nombre, apellido, email, rol, iat, exp }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(ApiError.unauthorized('El token de autenticación ha expirado.'));
    }
    return next(ApiError.unauthorized('Token de autenticación inválido.'));
  }
};
