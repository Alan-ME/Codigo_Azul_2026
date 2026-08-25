// ─────────────────────────────────────────────────────────────
// src/features/fcm/presentation/fcm.routes.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        2 — Enrutamiento Express para Notificaciones Push (FCM)
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { fcmController } from './fcm.controller.js';
import { authenticateJWT } from '../../../core/middlewares/auth.middleware.js';

const router = Router();

// Todas las rutas de FCM requieren autenticación médica/hospitalaria por JWT
router.use(authenticateJWT);

/**
 * @route   POST /api/v1/fcm/token
 * @desc    Registra o actualiza el token FCM del dispositivo móvil del usuario
 * @access  Privado (Médicos, Reanimadores, Guardia, Admin)
 */
router.post('/token', fcmController.registrarToken);

/**
 * @route   GET /api/v1/fcm/estado
 * @desc    Consulta el estado operativo de Firebase y cantidad de dispositivos vinculados
 * @access  Privado
 */
router.get('/estado', fcmController.obtenerEstado);

/**
 * @route   POST /api/v1/fcm/test
 * @desc    Ejecuta un envío de prueba dry-run hacia FCM
 * @access  Privado
 */
router.post('/test', fcmController.probarConexion);

export default router;
