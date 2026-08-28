// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/cancelar-incidente.use-case.js
// Caso de uso: Cancelación de Falsa Alarma con Auditoría Obligatoria de Motivo.
// Normativa: SAD v1.0 / SRS IEEE 830 RN-01 / CU-04 Fully Dressed
// ─────────────────────────────────────────────────────────────
import { getClient } from '../../../core/config/db.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { appEvents } from '../../../core/events/event-emitter.js';
import { EstadoIncidente, esTransicionValida } from '../domain/estado-incidente.js';
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export class CancelarIncidenteUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Cancela un incidente activo registrando el motivo obligatorio.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {string} params.motivo
   * @param {object} params.user
   * @returns {Promise<object>}
   */
  async execute({ incidenteId, motivo, user }) {
    if (!incidenteId) {
      throw ApiError.badRequest('El ID del incidente es requerido.');
    }

    if (!motivo || typeof motivo !== 'string' || motivo.trim().length < 3) {
      throw ApiError.badRequest('Debe proporcionar un motivo de cancelación válido (mínimo 3 caracteres).');
    }

    // 1. Buscar incidente
    const incidente = await this.repo.findById(incidenteId);
    if (!incidente) {
      throw ApiError.notFound(`El incidente con ID ${incidenteId} no fue encontrado.`);
    }

    // 2. Validar que no esté ya finalizado
    if (incidente.estado === EstadoIncidente.RESUELTO || incidente.estado === EstadoIncidente.CANCELADO) {
      throw ApiError.conflict(`El incidente ya se encuentra cerrado en estado: ${incidente.estado}.`);
    }

    // 3. Validar transición de estado en la FSM
    if (!esTransicionValida(incidente.estado, EstadoIncidente.CANCELADO)) {
      throw ApiError.conflict(`No es posible cancelar un incidente en estado actual: ${incidente.estado}.`);
    }

    // 4. Regla de Negocio de Cancelación por Roles / Ventana Temporal (CU-04 / Excepción 4a)
    const ahora = new Date();
    const tiempoCreacion = new Date(incidente.created_at);
    const segundosTranscurridos = (ahora.getTime() - tiempoCreacion.getTime()) / 1000;

    const esAdmin = user.rol === 'ADMINISTRADOR';
    const esGuardia = user.rol === 'OPERADOR_GUARDIA';
    const esReanimador = user.rol === 'REANIMADOR_MEDICO';
    const esElActivador = Number(user.id) === Number(incidente.activador_id || incidente.activado_por_id);
    const esElReanimador = Number(user.id) === Number(incidente.reanimador_id);

    if (!esAdmin && !esGuardia && !esReanimador && !esElActivador && !esElReanimador) {
      throw ApiError.forbidden('No tiene permisos para cancelar este incidente.');
    }

    if (esElActivador && !esAdmin && !esGuardia && !esReanimador && segundosTranscurridos > 60) {
      throw ApiError.forbidden(
        `La cancelación directa por el activador solo está permitida dentro de los primeros 60 segundos (han transcurrido ${Math.round(segundosTranscurridos)}s). El cierre debe ser gestionado por el Operador de Guardia o Administrador.`
      );
    }

    // 5. Transacción ACID: UPDATE + AUDITORÍA
    const client = await getClient();

    try {
      await client.query('BEGIN');

      const incidenteActualizado = await this.repo.update(
        incidenteId,
        {
          estado: EstadoIncidente.CANCELADO,
          motivoCancelacion: motivo.trim(),
          marcarResuelto: true,
        },
        client
      );

      await this.auditRepo.registrar(
        {
          incidenteId,
          usuarioId: user.id,
          tipoEvento: 'CANCELACION_FALSA_ALARMA',
          payloadData: {
            motivo: motivo.trim(),
            canceladoPor: {
              id:     user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              rol:    user.rol,
            },
            segundosTranscurridos: Math.round(segundosTranscurridos),
            timestamp: ahora.toISOString(),
          },
        },
        client
      );

      await client.query('COMMIT');

      const payloadRespuesta = {
        incidenteId:       incidenteActualizado.id,
        codigoUUID:        incidenteActualizado.codigo_uuid,
        estado:            EstadoIncidente.CANCELADO,
        motivoCancelacion: motivo.trim(),
        resolvedAt:        incidenteActualizado.resolved_at,
        canceladoPor: {
          id:     user.id,
          nombre: `${user.nombre} ${user.apellido}`,
          rol:    user.rol,
        },
      };

      // 6. Emitir evento interno para silenciar alarmas en tiempo real
      appEvents.emit('incidente:cancelado', {
        event:     'codigo_azul_cancelado',
        timestamp: ahora.toISOString(),
        data:      payloadRespuesta,
      });

      return payloadRespuesta;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const cancelarIncidenteUseCase = new CancelarIncidenteUseCase();
