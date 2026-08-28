// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/activar-codigo-azul.use-case.js
// Caso de uso: Disparo de Alerta Código Azul con Barrera de Idempotencia
// y Transacción ACID de Persistencia y Auditoría.
// Normativa: SAD v1.0 / SRS IEEE 830 RF-01 / CU-01 Fully Dressed
// ─────────────────────────────────────────────────────────────
import { getClient } from '../../../core/config/db.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { appEvents } from '../../../core/events/event-emitter.js';
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export class ActivarCodigoAzulUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Ejecuta el disparo de una alerta Código Azul.
   * @param {object} params
   * @param {number} params.ubicacionId - ID de la sala/cama hospitalaria.
   * @param {object} params.user        - Usuario autenticado (req.user).
   * @returns {Promise<{incidente: object, esReincidencia: boolean}>}
   */
  async execute({ ubicacionId, user }) {
    if (!ubicacionId) {
      throw ApiError.badRequest('El ID de la ubicación es obligatorio.');
    }

    // 1. Validar que la ubicación exista físicamente
    const ubicacion = await this.repo.findUbicacionById(ubicacionId);
    if (!ubicacion) {
      throw ApiError.notFound(`La ubicación con ID ${ubicacionId} no existe en el sistema.`);
    }

    // 2. BARRERA DE IDEMPOTENCIA (5 Segundos de debounce)
    // Si ya existe una alerta activa en la misma cama creada hace < 5s,
    // devolver el incidente existente sin duplicar el registro ni saturar la red.
    const incidenteExistente = await this.repo.findRecentActiveByUbicacion(ubicacionId, 5);
    if (incidenteExistente) {
      // Registrar en background el intento redundante en auditoría
      this.auditRepo.registrar({
        incidenteId:  incidenteExistente.id,
        usuarioId:    user.id,
        tipoEvento:   'ACTIVACION_REDUNDANTE_BLOQUEADA',
        payloadData:  {
          motivo: 'Pulsación repetida dentro de la ventana de 60 segundos',
          usuario_intento: `${user.nombre} ${user.apellido}`,
          rol_usuario: user.rol,
        },
      }).catch((err) => console.error('[AUDIT ERROR]', err.message));

      return {
        incidente: {
          id:         incidenteExistente.id,
          codigoUUID: incidenteExistente.codigo_uuid,
          estado:     incidenteExistente.estado,
          ubicacion: {
            edificio:   incidenteExistente.edificio,
            piso:       incidenteExistente.piso,
            sectorSala: incidenteExistente.sector_sala,
            cama:       incidenteExistente.cama,
          },
          createdAt:  incidenteExistente.created_at,
        },
        esReincidencia: true,
      };
    }

    // 3. TRANSACCIÓN ACID: INSERT incidente + INSERT auditoría
    const client = await getClient();

    try {
      await client.query('BEGIN');

      // A. Crear incidente
      const nuevoIncidente = await this.repo.create(
        {
          ubicacionId,
          activadoPorId: user.id,
        },
        client
      );

      // B. Registrar auditoría inmutable
      await this.auditRepo.registrar(
        {
          incidenteId: nuevoIncidente.id,
          usuarioId:   user.id,
          tipoEvento:  'ACTIVACION',
          payloadData: {
            ubicacion: {
              id:         ubicacion.id,
              edificio:   ubicacion.edificio,
              piso:       ubicacion.piso,
              sectorSala: ubicacion.sector_sala,
              cama:       ubicacion.cama,
            },
            activadoPor: {
              id:     user.id,
              nombre: `${user.nombre} ${user.apellido}`,
              rol:    user.rol,
            },
            timestamp: nuevoIncidente.created_at,
          },
        },
        client
      );

      await client.query('COMMIT');

      const payloadRespuesta = {
        incidenteId: nuevoIncidente.id,
        codigoUUID:  nuevoIncidente.codigo_uuid,
        estado:      nuevoIncidente.estado,
        ubicacion: {
          edificio:   ubicacion.edificio,
          piso:       ubicacion.piso,
          sectorSala: ubicacion.sector_sala,
          cama:       ubicacion.cama,
        },
        activadoPor: {
          id:     user.id,
          nombre: `${user.nombre} ${user.apellido}`,
          rol:    user.rol,
        },
        createdAt: nuevoIncidente.created_at,
      };

      // 4. EMITIR EVENTO INTERNO
      // Alex conecta su Gateway Socket.IO escuchando 'incidente:activado'
      appEvents.emit('incidente:activado', {
        event:     'codigo_azul_alerta',
        timestamp: new Date().toISOString(),
        data:      payloadRespuesta,
      });

      return {
        incidente:      payloadRespuesta,
        esReincidencia: false,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const activarCodigoAzulUseCase = new ActivarCodigoAzulUseCase();
