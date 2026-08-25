// ─────────────────────────────────────────────────────────────
// src/features/fcm/data/fcm.repository.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        2 & 3 — Repositorio de Tokens de Dispositivos y Despachos FCM
// Normativa:   Clean Architecture + Feature-First (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import { query } from '../../../core/config/db.js';

export class FcmRepository {
  /**
   * Registra o actualiza el token FCM de un dispositivo móvil asociado a un usuario.
   * @param {object} params
   * @param {number} params.usuarioId
   * @param {string} params.token
   * @param {string} [params.plataforma='ANDROID']
   * @returns {Promise<object>}
   */
  async upsertToken({ usuarioId, token, plataforma = 'ANDROID' }) {
    const text = `
      INSERT INTO usuarios_dispositivos_fcm (
        usuario_id,
        token_fcm,
        plataforma,
        activo,
        ultimo_acceso
      )
      VALUES ($1, $2, $3, true, NOW())
      ON CONFLICT (token_fcm)
      DO UPDATE SET
        usuario_id = EXCLUDED.usuario_id,
        plataforma = EXCLUDED.plataforma,
        activo = true,
        ultimo_acceso = NOW()
      RETURNING id, usuario_id, token_fcm, plataforma, activo, ultimo_acceso, created_at;
    `;
    const values = [usuarioId, token, plataforma.toUpperCase()];
    const result = await query(text, values);
    return result.rows[0];
  }

  /**
   * Obtiene todos los tokens FCM activos de usuarios que tienen roles de respuesta médica o guardia.
   * @param {string[]} [roles]
   * @returns {Promise<Array<{ token_fcm: string, usuario_id: number, rol: string, nombre: string, apellido: string }>>}
   */
  async obtenerTokensActivosPorRoles(roles = ['REANIMADOR_MEDICO', 'OPERADOR_GUARDIA', 'ADMINISTRADOR']) {
    const text = `
      SELECT
        d.token_fcm,
        d.usuario_id,
        d.plataforma,
        u.rol,
        u.nombre,
        u.apellido
      FROM usuarios_dispositivos_fcm d
      INNER JOIN usuarios u ON u.id = d.usuario_id
      WHERE d.activo = true
        AND u.activo = true
        AND u.rol = ANY($1::rol_usuario[])
      ORDER BY d.ultimo_acceso DESC;
    `;
    const result = await query(text, [roles]);
    return result.rows;
  }

  /**
   * Obtiene los tokens FCM activos de un usuario específico.
   * @param {number} usuarioId
   * @returns {Promise<Array<object>>}
   */
  async obtenerTokensPorUsuarioId(usuarioId) {
    const text = `
      SELECT id, usuario_id, token_fcm, plataforma, activo, ultimo_acceso
      FROM usuarios_dispositivos_fcm
      WHERE usuario_id = $1 AND activo = true;
    `;
    const result = await query(text, [usuarioId]);
    return result.rows;
  }

  /**
   * Desactiva un token FCM inválido o revocado por Google.
   * @param {string} token
   * @returns {Promise<void>}
   */
  async desactivarToken(token) {
    const text = `
      UPDATE usuarios_dispositivos_fcm
      SET activo = false, ultimo_acceso = NOW()
      WHERE token_fcm = $1;
    `;
    await query(text, [token]);
  }

  /**
   * Registra un despacho de notificación push en la tabla relacional `notificaciones_push`.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {string} params.tokenFcm
   * @param {string} params.titulo
   * @param {string} params.cuerpo
   * @param {boolean} [params.despachado=true]
   * @returns {Promise<object>}
   */
  async registrarDespachoPush({ incidenteId, tokenFcm, titulo, cuerpo, despachado = true }) {
    const text = `
      INSERT INTO notificaciones_push (
        incidente_id,
        token_fcm,
        titulo,
        cuerpo,
        despachado,
        timestamp_despacho
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, incidente_id, token_fcm, titulo, cuerpo, despachado, timestamp_despacho;
    `;
    const values = [incidenteId, tokenFcm, titulo, cuerpo, despachado];
    const result = await query(text, values);
    return result.rows[0];
  }

  /**
   * Cuenta la cantidad de dispositivos FCM registrados y activos.
   * @returns {Promise<number>}
   */
  async contarTokensActivos() {
    const text = 'SELECT COUNT(*)::int AS count FROM usuarios_dispositivos_fcm WHERE activo = true;';
    const result = await query(text);
    return result.rows[0]?.count || 0;
  }
}

export const fcmRepository = new FcmRepository();
