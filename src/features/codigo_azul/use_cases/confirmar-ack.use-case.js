// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/confirmar-ack.use-case.js
// Caso de uso: Confirmación de Asistencia (ACK) por Personal de Reanimación.
// Calcula latencia exacta de respuesta y actualiza la FSM clínica a 'EN_ATENCION'.
// Normativa: SAD v1.0 / SRS IEEE 830 RF-03 / CU-02 Fully Dressed
// ─────────────────────────────────────────────────────────────
import { getClient } from '../../../core/config/db.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { appEvents } from '../../../core/events/event-emitter.js';
import { EstadoIncidente, esTransicionValida } from '../domain/estado-incidente.js';
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export class ConfirmarAckUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Confirma la asistencia del reanimador para un incidente activo.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {object} params.user - Reanimador autenticado.
   * @returns {Promise<object>}
   */
  async execute({ incidenteId, user }) {
    if (!incidenteId) {
      throw ApiError.badRequest('El ID del incidente es requerido.');
    }

    // 1. Buscar incidente actual
    const incidente = await this.repo.findById(incidenteId);
    if (!incidente) {
      throw ApiError.notFound(`El incidente con ID ${incidenteId} no fue encontrado.`);
    }

    // 2. Verificar estado terminal
    if (incidente.estado === EstadoIncidente.RESUELTO || incidente.estado === EstadoIncidente.CANCELADO) {
      throw ApiError.conflict(`El incidente ya se encuentra finalizado en estado: ${incidente.estado}.`);
    }

    const ahora = new Date();
    const tiempoCreacion = new Date(incidente.created_at);
    const latenciaSegundos = parseFloat(((ahora.getTime() - tiempoCreacion.getTime()) / 1000).toFixed(2));

    // 3. Manejo de múltiples confirmaciones simultáneas (CU-02 Flujo Alt 2a)
    // Si ya tiene un reanimador principal asignado, este se registra como Reanimador Secundario de Apoyo
    const esReanimadorSecundario = incidente.estado === EstadoIncidente.EN_ATENCION;

    // Consultar eventos de auditoría previos para validar cupo y anti-duplicados
    const auditoriaExistente = await this.auditRepo.findByIncidenteId(incidenteId);
    const eventosEquipo = (Array.isArray(auditoriaExistente) ? auditoriaExistente : []).filter(
      (ev) => ['ACK_PRIMARIO', 'ACK_REANIMADOR_APOYO'].includes(ev.tipo_evento)
    );

    // Validar si el usuario ya es miembro registrado del equipo
    const yaEsMiembro = eventosEquipo.some((ev) => Number(ev.usuario_id) === Number(user.id));
    if (yaEsMiembro) {
      throw ApiError.conflict('Ya formás parte del equipo de reanimación asignado a este Código Azul.');
    }

    // Validar cupo máximo clínico (Máximo 7 especialistas según protocolo de RCP / ACLS)
    const MAX_REANIMADORES = 7;
    if (eventosEquipo.length >= MAX_REANIMADORES) {
      throw ApiError.conflict(`El equipo de reanimación ya ha alcanzado el cupo máximo de ${MAX_REANIMADORES} especialistas.`);
    }

    const client = await getClient();

    try {
      await client.query('BEGIN');

      let incidenteActualizado = incidente;

      if (!esReanimadorSecundario) {
        // Validar transición legal en la FSM
        if (!esTransicionValida(incidente.estado, EstadoIncidente.EN_ATENCION)) {
          throw ApiError.conflict(
            `Transición ilegal de estado: no se puede pasar de ${incidente.estado} a EN_ATENCION.`
          );
        }

        // Actualizar a EN_ATENCION con el reanimador principal
        incidenteActualizado = await this.repo.update(
          incidenteId,
          {
            estado: EstadoIncidente.EN_ATENCION,
            reanimadorId: user.id,
          },
          client
        );
      }

      // Registrar evento de auditoría médico-legal
      await this.auditRepo.registrar(
        {
          incidenteId,
          usuarioId: user.id,
          tipoEvento: esReanimadorSecundario ? 'ACK_REANIMADOR_APOYO' : 'ACK_PRIMARIO',
          payloadData: {
            tipo: esReanimadorSecundario ? 'Reanimador Secundario de Apoyo' : 'Reanimador Principal',
            reanimador: {
              id:     user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              rol:    user.rol,
            },
            latenciaRespuestaSegundos: latenciaSegundos,
            timestamp: ahora.toISOString(),
          },
        },
        client
      );

      // Consultar equipo completo de reanimación actualizado
      const equipoRes = await client.query(
        `SELECT u.id, u.nombre || ' ' || u.apellido AS nombre, u.rol, iae.tipo_evento AS tipo, iae.timestamp_evento AS timestamp
         FROM incidentes_auditoria_eventos iae
         INNER JOIN usuarios u ON u.id = iae.usuario_id
         WHERE iae.incidente_id = $1
           AND iae.tipo_evento IN ('ACK_PRIMARIO', 'ACK_REANIMADOR_APOYO')
         ORDER BY iae.timestamp_evento ASC`,
        [incidenteId]
      );
      const equipoReanimacion = equipoRes.rows;

      await client.query('COMMIT');

      // Obtener el líder de reanimación (quien realizó el ACK_PRIMARIO)
      const liderEquipo = equipoReanimacion.find((r) => r.tipo === 'ACK_PRIMARIO') || equipoReanimacion[0] || {
        id: incidenteActualizado.reanimador_id || user.id,
        nombre: `${user.nombre} ${user.apellido}`,
        rol: user.rol,
      };

      const payloadRespuesta = {
        incidenteId:               incidente.id,
        id:                        incidente.id,
        codigoUUID:                incidente.codigo_uuid,
        estado:                    EstadoIncidente.EN_ATENCION,
        latenciaRespuestaSegundos: latenciaSegundos,
        esReanimadorSecundario,
        reanimador: {
          id:     liderEquipo.id,
          nombre: liderEquipo.nombre,
          rol:    liderEquipo.rol,
        },
        reanimadorNombre:          liderEquipo.nombre,
        reanimadorId:              liderEquipo.id,
        equipoReanimacion,
        totalReanimadores:         equipoReanimacion.length,
        ubicacion: {
          edificio:   incidente.edificio,
          piso:       incidente.piso,
          sectorSala: incidente.sector_sala,
          cama:       incidente.cama,
        },
        createdAt:                 incidente.created_at,
        created_at:                incidente.created_at,
      };

      // 4. Emitir evento interno para Socket.IO Gateway
      appEvents.emit('incidente:ack', {
        event:     'codigo_azul_atendido',
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

export const confirmarAckUseCase = new ConfirmarAckUseCase();
