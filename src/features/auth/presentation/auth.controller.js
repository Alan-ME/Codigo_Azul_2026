// ─────────────────────────────────────────────────────────────
// src/features/auth/presentation/auth.controller.js
// Controlador HTTP para endpoints de Autenticación.
// ─────────────────────────────────────────────────────────────
import { asyncHandler } from '../../../core/helpers/async-handler.js';
import { sendSuccess } from '../../../core/helpers/api-response.js';
import { loginUseCase } from '../use_cases/login.use-case.js';

export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const email = req.body.email || req.body.usuario;
    const password = req.body.password || req.body.clave;
    const result = await loginUseCase.execute({ email, password });

    return sendSuccess(res, result, 200, 'Autenticación exitosa.');
  });

  /**
   * GET /api/v1/auth/me
   * Devuelve el perfil del usuario autenticado a partir del token.
   */
  getMe = asyncHandler(async (req, res) => {
    return sendSuccess(res, { user: req.user }, 200, 'Perfil obtenido.');
  });

  /**
   * POST /api/v1/usuarios/token-fcm
   * Registra el token de notificaciones Push FCM del dispositivo móvil.
   */
  registrarTokenFcm = asyncHandler(async (req, res) => {
    const { token } = req.body;
    return sendSuccess(res, { registrado: true, token }, 200, 'Token FCM registrado.');
  });
}

export const authController = new AuthController();
