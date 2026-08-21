// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/data/auditoria.repository.js
// Repositorio de Auditoría Inmutable (Append-Only Event Sourcing).
// ─────────────────────────────────────────────────────────────
import { query } from '../../../core/config/db.js';

export class AuditoriaRepository {
  /**
   * Registra un evento inmutable en la bitácora de auditoría.
   * Acepta un cliente opcional para ejecutarse dentro de una transacción ACID.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {number|null} params.usuarioId
   * @param {string} params.tipoEvento
   * @param {object} params.payloadData
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>}
   */
  async registrar({ incidenteId, usuarioId = null, tipoEvento, payloadData = {} }, client = null) {
    const text = `
      INSERT INTO incidentes_auditoria_eventos (
        incidente_id,
        usuario_id,
        tipo_evento,
        payload_data,
        timestamp_evento
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, incidente_id, usuario_id, tipo_evento, payload_data, timestamp_evento;
    `;
    const values = [incidenteId, usuarioId, tipoEvento, JSON.stringify(payloadData)];

    const executor = client || { query };
    const result = await executor.query(text, values);
    return result.rows[0];
  }

  /**
   * Obtiene la línea de tiempo completa de auditoría para un incidente.
   * @param {number} incidenteId
   * @returns {Promise<Array<object>>}
   */
  async findByIncidenteId(incidenteId) {
    const text = `
      SELECT
        a.id,
        a.incidente_id,
        a.tipo_evento,
        a.payload_data,
        a.timestamp_evento,
        u.id AS usuario_id,
        u.nombre AS usuario_nombre,
        u.apellido AS usuario_apellido,
        u.rol AS usuario_rol
      FROM incidentes_auditoria_eventos a
      LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.incidente_id = $1
      ORDER BY a.timestamp_evento ASC;
    `;
    const result = await query(text, [incidenteId]);
    return result.rows;
  }
}

export const auditoriaRepository = new AuditoriaRepository();
