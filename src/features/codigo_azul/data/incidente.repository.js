// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/data/incidente.repository.js
// Repositorio de persistencia relacional para Incidentes de Código Azul.
// ─────────────────────────────────────────────────────────────
import { query } from '../../../core/config/db.js';

export class IncidenteRepository {
  /**
   * Busca si existe un incidente activo en la misma ubicación dentro de la ventana de idempotencia.
   * @param {number} ubicacionId
   * @param {number} windowSeconds - Tiempo en segundos (default 60).
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  async findRecentActiveByUbicacion(ubicacionId, windowSeconds = 60, client = null) {
    const text = `
      SELECT
        i.id,
        i.codigo_uuid,
        i.ubicacion_id,
        i.activado_por_id,
        i.reanimador_id,
        i.estado,
        i.created_at,
        u.edificio,
        u.piso,
        u.sector_sala,
        u.cama
      FROM incidentes i
      INNER JOIN ubicaciones u ON u.id = i.ubicacion_id
      WHERE i.ubicacion_id = $1
        AND i.estado IN ('ACTIVADO', 'NOTIFICADO', 'EN_ATENCION')
        AND i.created_at >= NOW() - ($2 || ' seconds')::INTERVAL
      ORDER BY i.created_at DESC
      LIMIT 1;
    `;
    const executor = client || { query };
    const result = await executor.query(text, [ubicacionId, windowSeconds]);
    return result.rows[0] || null;
  }

  /**
   * Inserta un nuevo incidente en base de datos.
   * @param {object} data
   * @param {number} data.ubicacionId
   * @param {number} data.activadoPorId
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>}
   */
  async create({ ubicacionId, activadoPorId }, client = null) {
    const text = `
      INSERT INTO incidentes (
        ubicacion_id,
        activado_por_id,
        estado,
        created_at
      )
      VALUES ($1, $2, 'ACTIVADO', NOW())
      RETURNING
        id,
        codigo_uuid,
        ubicacion_id,
        activado_por_id,
        reanimador_id,
        estado,
        created_at;
    `;
    const executor = client || { query };
    const result = await executor.query(text, [ubicacionId, activadoPorId]);
    return result.rows[0];
  }

  /**
   * Busca un incidente por ID con detalle completo de ubicación y usuarios.
   * @param {number} id
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object|null>}
   */
  async findById(id, client = null) {
    const text = `
      SELECT
        i.id,
        i.codigo_uuid,
        i.estado,
        i.motivo_cancelacion,
        i.created_at,
        i.resolved_at,
        -- Ubicación
        ub.id AS ubicacion_id,
        ub.edificio,
        ub.piso,
        ub.sector_sala,
        ub.cama,
        -- Activador
        act.id AS activador_id,
        act.nombre AS activador_nombre,
        act.apellido AS activador_apellido,
        act.rol AS activador_rol,
        -- Reanimador
        rea.id AS reanimador_id,
        rea.nombre AS reanimador_nombre,
        rea.apellido AS reanimador_apellido,
        rea.rol AS reanimador_rol
      FROM incidentes i
      INNER JOIN ubicaciones ub ON ub.id = i.ubicacion_id
      INNER JOIN usuarios act ON act.id = i.activado_por_id
      LEFT JOIN usuarios rea ON rea.id = i.reanimador_id
      WHERE i.id = $1
      LIMIT 1;
    `;
    const executor = client || { query };
    const result = await executor.query(text, [id]);
    return result.rows[0] || null;
  }

  /**
   * Actualiza el estado y campos asociados de un incidente dentro de una transacción.
   * @param {number} id
   * @param {object} fields
   * @param {string} fields.estado
   * @param {number|null} [fields.reanimadorId]
   * @param {string|null} [fields.motivoCancelacion]
   * @param {boolean} [fields.marcarResuelto]
   * @param {import('pg').PoolClient} [client]
   * @returns {Promise<object>}
   */
  async update(id, { estado, reanimadorId = null, motivoCancelacion = null, marcarResuelto = false }, client = null) {
    const text = `
      UPDATE incidentes
      SET
        estado = $2,
        reanimador_id = COALESCE($3, reanimador_id),
        motivo_cancelacion = COALESCE($4, motivo_cancelacion),
        resolved_at = CASE WHEN $5 = true THEN NOW() ELSE resolved_at END
      WHERE id = $1
      RETURNING
        id,
        codigo_uuid,
        ubicacion_id,
        activado_por_id,
        reanimador_id,
        estado,
        motivo_cancelacion,
        created_at,
        resolved_at;
    `;
    const executor = client || { query };
    const result = await executor.query(text, [
      id,
      estado,
      reanimadorId,
      motivoCancelacion,
      marcarResuelto,
    ]);
    return result.rows[0];
  }

  /**
   * Lista todos los incidentes activos ('ACTIVADO', 'NOTIFICADO', 'EN_ATENCION').
   * @returns {Promise<Array<object>>}
   */
  async findActivos() {
    const text = `
      SELECT
        i.id,
        i.codigo_uuid,
        i.estado,
        i.created_at,
        EXTRACT(EPOCH FROM (NOW() - i.created_at))::INT AS segundos_transcurridos,
        -- Ubicación
        json_build_object(
          'id', ub.id,
          'edificio', ub.edificio,
          'piso', ub.piso,
          'sectorSala', ub.sector_sala,
          'cama', ub.cama
        ) AS ubicacion,
        -- Activador
        json_build_object(
          'id', act.id,
          'nombre', act.nombre || ' ' || act.apellido,
          'rol', act.rol
        ) AS activado_por,
        -- Reanimador Principal
        CASE
          WHEN rea.id IS NOT NULL THEN
            json_build_object(
              'id', rea.id,
              'nombre', rea.nombre || ' ' || rea.apellido,
              'rol', rea.rol
            )
          ELSE NULL
        END AS reanimador,
        -- Equipo Completo de Reanimadores (ACK Primario + Apoyo)
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', u.id,
                'nombre', u.nombre || ' ' || u.apellido,
                'rol', u.rol,
                'tipo', iae.tipo_evento,
                'timestamp', iae.timestamp_evento
              ) ORDER BY iae.timestamp_evento ASC
            )
            FROM incidentes_auditoria_eventos iae
            INNER JOIN usuarios u ON u.id = iae.usuario_id
            WHERE iae.incidente_id = i.id
              AND iae.tipo_evento IN ('ACK_PRIMARIO', 'ACK_REANIMADOR_APOYO')
          ),
          '[]'::json
        ) AS equipo_reanimacion
      FROM incidentes i
      INNER JOIN ubicaciones ub ON ub.id = i.ubicacion_id
      INNER JOIN usuarios act ON act.id = i.activado_por_id
      LEFT JOIN usuarios rea ON rea.id = i.reanimador_id
      WHERE i.estado IN ('ACTIVADO', 'NOTIFICADO', 'EN_ATENCION')
      ORDER BY i.created_at DESC;
    `;
    const result = await query(text);
    return result.rows;
  }

  /**
   * Verifica la existencia de una ubicación por ID.
   * @param {number} ubicacionId
   * @returns {Promise<object|null>}
   */
  async findUbicacionById(ubicacionId) {
    const text = `
      SELECT id, edificio, piso, sector_sala, cama
      FROM ubicaciones
      WHERE id = $1
      LIMIT 1;
    `;
    const result = await query(text, [ubicacionId]);
    return result.rows[0] || null;
  }

  /**
   * Lista todas las ubicaciones registradas en el hospital.
   * @returns {Promise<Array<object>>}
   */
  async listarUbicaciones() {
    const text = `
      SELECT id, edificio, piso, sector_sala, cama
      FROM ubicaciones
      ORDER BY edificio, piso, sector_sala, cama;
    `;
    const result = await query(text);
    return result.rows;
  }
}

export const incidenteRepository = new IncidenteRepository();
