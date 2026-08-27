// ─────────────────────────────────────────────────────────────
// src/features/fcm/use_cases/registrar-token.use-case.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        2 — Caso de Uso: Registro y Suscripción de Token FCM
// Normativa:   Clean Architecture / IEEE 830 (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import { fcmRepository } from '../data/fcm.repository.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import admin from '../../../core/config/firebase.config.js';

export class RegistrarTokenUseCase {
  /**
   * Ejecuta el registro del token de dispositivo móvil y lo suscribe a los topics correspondientes.
   * @param {object} params
   * @param {number} params.usuarioId
   * @param {string} params.rol
   * @param {string} params.token
   * @param {string} [params.plataforma='ANDROID']
   * @returns {Promise<object>}
   */
  async execute({ usuarioId, rol, token, plataforma = 'ANDROID' }) {
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      throw ApiError.badRequest('El campo token es obligatorio y debe ser un string válido.');
    }

    const cleanToken = token.trim();
    const cleanPlataforma = ['ANDROID', 'IOS', 'WEB'].includes(plataforma?.toUpperCase())
      ? plataforma.toUpperCase()
      : 'ANDROID';

    // 1. Guardar o actualizar en base de datos PostgreSQL
    const registro = await fcmRepository.upsertToken({
      usuarioId,
      token: cleanToken,
      plataforma: cleanPlataforma,
    });

    // 2. Suscribir el token al topic general de emergencias en Firebase
    try {
      if (admin.apps.length > 0) {
        await admin.messaging().subscribeToTopic([cleanToken], 'codigo_azul');

        if (rol === 'REANIMADOR_MEDICO') {
          await admin.messaging().subscribeToTopic([cleanToken], 'reanimadores');
        } else if (rol === 'OPERADOR_GUARDIA' || rol === 'ADMINISTRADOR') {
          await admin.messaging().subscribeToTopic([cleanToken], 'guardia');
        }
      }
    } catch (err) {
      console.warn(`[FCM] [WARN] No se pudo suscribir el token al topic de Firebase: ${err.message}`);
    }

    console.log(`[FCM] [OK] Token registrado para usuario #${usuarioId} (${rol}) — Plataforma: ${cleanPlataforma}`);

    return {
      id:            registro.id,
      usuarioId:     registro.usuario_id,
      token:         registro.token_fcm,
      plataforma:    registro.plataforma,
      activo:        registro.activo,
      ultimoAcceso:  registro.ultimo_acceso,
    };
  }
}

export const registrarTokenUseCase = new RegistrarTokenUseCase();
