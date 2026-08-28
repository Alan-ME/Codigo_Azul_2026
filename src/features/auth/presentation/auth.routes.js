// ─────────────────────────────────────────────────────────────
// src/features/auth/presentation/auth.routes.js
// Definición de rutas del módulo de Autenticación.
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authController } from './auth.controller.js';
import { authenticateJWT } from '../../../core/middlewares/auth.middleware.js';
import { config } from '../../../core/config/env.js';

const router = Router();

// Rate limiter para login:
// Permite pruebas concurrentes y no bloquea logins exitosos (skipSuccessfulRequests: true).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos fallidos de inicio de sesion. Intente nuevamente en unos minutos.',
  },
});

// Endpoint publico de inicio de sesion (protegido con rate limiter)
router.post('/login', loginLimiter, authController.login);

// Endpoint protegido para obtener datos de sesion actual
router.get('/me', authenticateJWT, authController.getMe);

export default router;
