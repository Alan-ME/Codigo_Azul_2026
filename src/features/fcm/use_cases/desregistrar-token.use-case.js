// ─────────────────────────────────────────────────────────────
// src/features/fcm/use_cases/desregistrar-token.use-case.js
// Caso de uso: Desregistro de token FCM al cerrar sesión (Logout).
// Evita el despacho de alertas críticas a dispositivos desconectados.
// Normativa: SAD v1.0 / SRS IEEE 830 RF-04
// ─────────────────────────────────────────────────────────────
import { ApiError } from '../../../core/helpers/api-error.js';
import { fcmRepository } from '../data/fcm.repository.js';

export class DesregistrarTokenUseCase {
  constructor(repo = fcmRepository) {
    this.repo = repo;
  }

  /**
   * Desactiva el token FCM de un usuario al hacer logout.
   * @param {object} params
   * @param {number} params.usuarioId
   * @param {string} [params.token] - Token específico a desvincular (si no se provee, desactiva todos los del usuario).
   * @returns {Promise<{desvinculados: number}>}
   */
  async execute({ usuarioId, token }) {
    if (!usuarioId) {
      throw ApiError.badRequest('El ID de usuario es obligatorio.');
    }

    if (token) {
      await this.repo.desactivarToken(token);
      return { desvinculados: 1 };
    }

    // Si no se especifica token puntual, desactivar todos los tokens del usuario
    const tokens = await this.repo.obtenerTokensPorUsuarioId(usuarioId);
    for (const t of tokens) {
      await this.repo.desactivarToken(t.token_fcm);
    }

    return { desvinculados: tokens.length };
  }
}

export const desregistrarTokenUseCase = new DesregistrarTokenUseCase();
