// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/resolver-incidente.use-case.js
// Caso de uso: Resolución de un incidente EN_ATENCION para cerrar
// el ciclo clínico completo de la FSM según directivas AHA/PERKI.
// Normativa: SAD v1.0 / SRS IEEE 830 RN-01 / Utstein CPR Reporting
// ─────────────────────────────────────────────────────────────
import { getClient } from '../../../core/config/db.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { appEvents } from '../../../core/events/event-emitter.js';
import { EstadoIncidente, esTransicionValida } from '../domain/estado-incidente.js';
import { ResultadoClinico, esResultadoClinicoValido, RESULTADO_CLINICO_LABELS } from '../domain/resultado-clinico.js';
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export class ResolverIncidenteUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Resuelve un incidente que se encuentra EN_ATENCION, marcandolo
   * como RESUELTO y registrando la auditoria medico-legal correspondiente.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {string} [params.resultadoClinico] - Resultado clínico estándar AHA (ej: ROSC_EXITOSO).
   * @param {string} [params.observaciones] - Notas clinicas opcionales.
   * @param {object} params.user
   * @returns {Promise<object>}
   */
  async execute({ incidenteId, resultadoClinico, observaciones, user }) {
    if (!incidenteId) {
      throw ApiError.badRequest('El ID del incidente es requerido.');
    }

    // Validar resultado clínico AHA/PERKI si fue provisto
    let resultadoFinal = resultadoClinico ? resultadoClinico.toUpperCase().trim() : ResultadoClinico.ROSC_EXITOSO;
    if (resultadoClinico && !esResultadoClinicoValido(resultadoFinal)) {
      throw ApiError.badRequest(
        `Resultado clínico inválido: '${resultadoClinico}'. Valores permitidos: ROSC_EXITOSO, DESFIBRILACION_EFECTIVA, TRASLADO_UTI, FALLECIDO_DOA, FALSA_ALARMA.`
      );
    }

    // 1. Buscar incidente
    const incidente = await this.repo.findById(incidenteId);
    if (!incidente) {
      throw ApiError.notFound(`El incidente con ID ${incidenteId} no fue encontrado.`);
    }

    // 2. Validar que no este ya finalizado
    if (incidente.estado === EstadoIncidente.RESUELTO || incidente.estado === EstadoIncidente.CANCELADO) {
      throw ApiError.conflict(`El incidente ya se encuentra cerrado en estado: ${incidente.estado}.`);
    }

    // 3. Validar transicion de estado en la FSM (solo EN_ATENCION -> RESUELTO)
    if (!esTransicionValida(incidente.estado, EstadoIncidente.RESUELTO)) {
      throw ApiError.conflict(
        `No es posible resolver un incidente en estado actual: ${incidente.estado}. Solo incidentes EN_ATENCION pueden resolverse.`
      );
    }

    // 4. Solo reanimadores, guardia o administradores pueden resolver
    const rolesPermitidos = ['REANIMADOR_MEDICO', 'OPERADOR_GUARDIA', 'ADMINISTRADOR'];
    if (!rolesPermitidos.includes(user.rol)) {
      throw ApiError.forbidden('Solo el equipo de reanimacion, guardia u operadores pueden resolver un incidente.');
    }

    // 5. Transaccion ACID: UPDATE + AUDITORIA
    const client = await getClient();
    const ahora = new Date();
    const tiempoCreacion = new Date(incidente.created_at);
    const segundosTotales = Math.round((ahora.getTime() - tiempoCreacion.getTime()) / 1000);

    try {
      await client.query('BEGIN');

      const incidenteActualizado = await this.repo.update(
        incidenteId,
        {
          estado: EstadoIncidente.RESUELTO,
          resultadoClinico: resultadoFinal,
          marcarResuelto: true,
        },
        client
      );

      await this.auditRepo.registrar(
        {
          incidenteId,
          usuarioId: user.id,
          tipoEvento: 'RESOLUCION_CLINICA',
          payloadData: {
            resueltoPor: {
              id:     user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              rol:    user.rol,
            },
            resultadoClinico: {
              codigo: resultadoFinal,
              descripcion: RESULTADO_CLINICO_LABELS[resultadoFinal] || resultadoFinal,
            },
            observaciones: observaciones ? observaciones.trim() : null,
            segundosTotalesAtencion: segundosTotales,
            timestamp: ahora.toISOString(),
          },
        },
        client
      );

      await client.query('COMMIT');

      const payloadRespuesta = {
        incidenteId:      incidenteActualizado.id,
        codigoUUID:       incidenteActualizado.codigo_uuid,
        estado:           EstadoIncidente.RESUELTO,
        resultadoClinico: resultadoFinal,
        resultadoClinicoDescripcion: RESULTADO_CLINICO_LABELS[resultadoFinal] || resultadoFinal,
        resolvedAt:       incidenteActualizado.resolved_at,
        observaciones:    observaciones ? observaciones.trim() : null,
        duracionTotal:    segundosTotales,
        resueltoPor: {
          id:     user.id,
          nombre: `${user.nombre} ${user.apellido}`,
          rol:    user.rol,
        },
      };

      // 6. Emitir evento interno para notificar resolucion en tiempo real
      appEvents.emit('incidente:resuelto', {
        event:     'codigo_azul_resuelto',
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

export const resolverIncidenteUseCase = new ResolverIncidenteUseCase();

