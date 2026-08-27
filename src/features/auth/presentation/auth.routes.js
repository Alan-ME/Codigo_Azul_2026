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

// Rate limiter para login: 50 intentos cada 15 minutos por IP (previene bloqueo en testing y demos)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intente nuevamente en unos minutos.',
  },
});

// Endpoint publico de inicio de sesion (protegido con rate limiter)
router.post('/login', loginLimiter, authController.login);

// Endpoint protegido para obtener datos de sesion actual
router.get('/me', authenticateJWT, authController.getMe);

// Endpoint para registro de token FCM
router.post('/token-fcm', authenticateJWT, authController.registrarTokenFcm);

export default router;
