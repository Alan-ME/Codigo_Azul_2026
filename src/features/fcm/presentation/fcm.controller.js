// ─────────────────────────────────────────────────────────────
// src/features/fcm/presentation/fcm.controller.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        2 — Controlador HTTP para endpoints de FCM
// Normativa:   Clean Architecture + REST API (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import { asyncHandler } from '../../../core/helpers/async-handler.js';
import { sendSuccess } from '../../../core/helpers/api-response.js';
import { registrarTokenUseCase } from '../use_cases/registrar-token.use-case.js';
import { desregistrarTokenUseCase } from '../use_cases/desregistrar-token.use-case.js';
import { fcmRepository } from '../data/fcm.repository.js';
import admin from '../../../config/firebase.config.js';

export class FcmController {
  /**
   * POST /api/v1/fcm/token
   * Registra el token de dispositivo del usuario autenticado.
   */
  registrarToken = asyncHandler(async (req, res) => {
    const { token, plataforma } = req.body;
    const user = req.user;

    const result = await registrarTokenUseCase.execute({
      usuarioId:  user.id,
      rol:        user.rol,
      token,
      plataforma,
    });

    return sendSuccess(res, result, 201, 'Token FCM registrado y vinculado al usuario exitosamente.');
  });

  /**
   * DELETE /api/v1/fcm/token
   * Desregistra el token del dispositivo móvil al cerrar sesión.
   */
  eliminarToken = asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    const user = req.user;

    const result = await desregistrarTokenUseCase.execute({
      usuarioId: user.id,
      token,
    });

    return sendSuccess(res, result, 200, 'Dispositivo desvinculado de las alertas críticas.');
  });

  /**
   * GET /api/v1/fcm/estado
   * Consulta el estado del servicio FCM y cantidad de dispositivos vinculados.
   */
  obtenerEstado = asyncHandler(async (req, res) => {
    const totalTokens = await fcmRepository.contarTokensActivos();
    const initialized = admin.apps.length > 0;

    return sendSuccess(res, {
      servicio:          'Firebase Cloud Messaging (FCM)',
      estado:            initialized ? 'ONLINE' : 'OFFLINE',
      proyecto:          process.env.FCM_PROJECT_ID || 'no_configurado',
      dispositivosActivos: totalTokens,
      timestamp:         new Date().toISOString(),
    });
  });

  /**
   * POST /api/v1/fcm/test
   * Envía un mensaje de prueba dry-run o directo para verificar push.
   */
  probarConexion = asyncHandler(async (req, res) => {
    const { token } = req.body;

    if (token) {
      // Envío de prueba a token específico
      const response = await admin.messaging().send({
        token,
        notification: {
          title: '🩺 Prueba de Código Azul',
          body:  'Canal de notificaciones push verificado correctamente.',
        },
        android: {
          priority: 'high',
        },
      }, true); // dryRun = true para no generar spam

      return sendSuccess(res, { messageId: response }, 200, 'Mensaje de prueba FCM validado con éxito.');
    }

    // Dry-run al topic general
    await admin.messaging().send({
      topic: 'codigo_azul',
      notification: {
        title: 'Prueba de Sistema',
        body:  'Verificación de enlace con Firebase Cloud Messaging.',
      },
    }, true);

    return sendSuccess(res, { status: 'OK' }, 200, 'Dry-run de FCM ejecutado con éxito.');
  });
}

export const fcmController = new FcmController();
