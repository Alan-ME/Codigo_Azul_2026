// ─────────────────────────────────────────────────────────────
// src/features/auth/presentation/auth.routes.js
// Definición de rutas del módulo de Autenticación.
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticateJWT } from '../../../core/middlewares/auth.middleware.js';

const router = Router();

// Endpoint público de inicio de sesión
router.post('/login', authController.login);

// Endpoint protegido para obtener datos de sesión actual
router.get('/me', authenticateJWT, authController.getMe);

export default router;
