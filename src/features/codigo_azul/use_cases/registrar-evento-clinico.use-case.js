// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/registrar-evento-clinico.use-case.js
// Caso de uso: Registro de hitos clínicos intermedios de RCP / Desfibrilación
// en la tabla inmutable incidentes_auditoria_eventos.
// Normativa: AHA Guidelines / Utstein Style / IEEE 830
// ─────────────────────────────────────────────────────────────
import { getClient } from '../../../core/config/db.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { appEvents } from '../../../core/events/event-emitter.js';
import { EstadoIncidente } from '../domain/estado-incidente.js';
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export const EVENTOS_CLINICOS_PERMITIDOS = Object.freeze({
  DESCARGA_AED:      'Descarga AED / Desfibrilación Aplicada',
  INICIO_RCP:        'Inicio de Compresiones Torácicas (RCP)',
  DROGA_ADRENALINA:  'Administración de Adrenalina 1mg IV/IO',
  DROGA_AMIODARONA:  'Administración de Amiodarona 300mg IV/IO',
  INTUBACION_IOT:    'Manejo de Vía Aérea / Intubación Orotraqueal',
  RITMO_REVERSIBLE:  'Recuperación de Pulso / Ritmo Organizado',
  NOTA_CLINICA:      'Nota Clínica del Reanimador en Escena',
});

export class RegistrarEventoClinicoUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Registra un hito clínico intermedio durante la atención del Código Azul.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {string} params.tipoEvento - Ej: DESCARGA_AED, INICIO_RCP, etc.
   * @param {string} [params.detalle] - Información o dosis adicional.
   * @param {object} params.user
   * @returns {Promise<object>}
   */
  async execute({ incidenteId, tipoEvento, detalle, user }) {
    if (!incidenteId) {
      throw ApiError.badRequest('El ID del incidente es requerido.');
    }
    if (!tipoEvento) {
      throw ApiError.badRequest('El tipo de evento clínico es requerido.');
    }

    const tipoNormalizado = tipoEvento.toUpperCase().trim();
    if (!EVENTOS_CLINICOS_PERMITIDOS[tipoNormalizado] && !tipoNormalizado.startsWith('EVENTO_')) {
      throw ApiError.badRequest(
        `Tipo de evento clínico desconocido: '${tipoEvento}'. Tipos válidos: ${Object.keys(EVENTOS_CLINICOS_PERMITIDOS).join(', ')}`
      );
    }

    // 1. Buscar incidente
    const incidente = await this.repo.findById(incidenteId);
    if (!incidente) {
      throw ApiError.notFound(`El incidente con ID ${incidenteId} no fue encontrado.`);
    }

    // 2. Solo registrar eventos en incidentes activos (EN_ATENCION, ACTIVADO, NOTIFICADO)
    if (incidente.estado === EstadoIncidente.RESUELTO || incidente.estado === EstadoIncidente.CANCELADO) {
      throw ApiError.conflict(`No se pueden agregar eventos clínicos a un incidente cerrado (${incidente.estado}).`);
    }

    // 3. Permisos de rol: reanimadores, guardia, médicos y administradores
    const rolesPermitidos = ['REANIMADOR_MEDICO', 'MEDICO_ACTIVADOR', 'OPERADOR_GUARDIA', 'ADMINISTRADOR'];
    if (!rolesPermitidos.includes(user.rol)) {
      throw ApiError.forbidden('No tenés permisos para registrar eventos clínicos en este incidente.');
    }

    const ahora = new Date();
    const tiempoCreacion = new Date(incidente.created_at);
    const segundosDesdeInicio = Math.round((ahora.getTime() - tiempoCreacion.getTime()) / 1000);

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const registroAuditoria = await this.auditRepo.registrar(
        {
          incidenteId,
          usuarioId: user.id,
          tipoEvento: `CLINICO_${tipoNormalizado}`,
          payloadData: {
            tipoEvento: tipoNormalizado,
            etiqueta: EVENTOS_CLINICOS_PERMITIDOS[tipoNormalizado] || tipoNormalizado,
            detalle: detalle ? detalle.trim() : null,
            registradoPor: {
              id:     user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              rol:    user.rol,
            },
            segundosDesdeInicio,
            timestamp: ahora.toISOString(),
          },
        },
        client
      );

      await client.query('COMMIT');

      const payloadRespuesta = {
        eventoId:            registroAuditoria.id,
        incidenteId,
        tipoEvento:          tipoNormalizado,
        etiqueta:            EVENTOS_CLINICOS_PERMITIDOS[tipoNormalizado] || tipoNormalizado,
        detalle:             detalle ? detalle.trim() : null,
        segundosDesdeInicio,
        timestamp:           ahora.toISOString(),
        registradoPor: {
          id:     user.id,
          nombre: `${user.nombre} ${user.apellido}`,
          rol:    user.rol,
        },
      };

      // Emitir evento WebSocket para actualización reactiva en pantallas
      appEvents.emit('incidente:evento_clinico', {
        event:     'codigo_azul_evento_clinico',
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

export const registrarEventoClinicoUseCase = new RegistrarEventoClinicoUseCase();
