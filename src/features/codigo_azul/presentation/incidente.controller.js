// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/presentation/incidente.controller.js
// Controlador HTTP para la gestión de incidentes Código Azul.
// ─────────────────────────────────────────────────────────────
import { asyncHandler } from '../../../core/helpers/async-handler.js';
import { sendSuccess } from '../../../core/helpers/api-response.js';
import { ApiError } from '../../../core/helpers/api-error.js';
import { activarCodigoAzulUseCase } from '../use_cases/activar-codigo-azul.use-case.js';
import { confirmarAckUseCase } from '../use_cases/confirmar-ack.use-case.js';
import { cancelarIncidenteUseCase } from '../use_cases/cancelar-incidente.use-case.js';
import { listarActivosUseCase } from '../use_cases/listar-activos.use-case.js';

export class IncidenteController {
  /**
   * POST /api/v1/incidentes/activar
   */
  activar = asyncHandler(async (req, res) => {
    const { ubicacionId } = req.body;
    const user = req.user;

    const result = await activarCodigoAzulUseCase.execute({
      ubicacionId: parseInt(ubicacionId, 10),
      user,
    });

    const statusCode = result.esReincidencia ? 200 : 201;
    const message = result.esReincidencia
      ? 'Alerta ya activa en la sala (idempotencia aplicada).'
      : '¡Alerta Código Azul activada y despachada con éxito!';

    return sendSuccess(res, result.incidente, statusCode, message);
  });

  /**
   * PUT /api/v1/incidentes/:id/ack
   */
  confirmarAck = asyncHandler(async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10);
    const user = req.user;

    const result = await confirmarAckUseCase.execute({
      incidenteId,
      user,
    });

    return sendSuccess(res, result, 200, 'Asistencia de reanimador confirmada.');
  });

  /**
   * POST /api/v1/incidentes/:id/cancelar
   */
  cancelar = asyncHandler(async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10);
    const { motivo } = req.body;
    const user = req.user;

    const result = await cancelarIncidenteUseCase.execute({
      incidenteId,
      motivo,
      user,
    });

    return sendSuccess(res, result, 200, 'Alerta cancelada y registrada en auditoría.');
  });

  /**
   * GET /api/v1/incidentes/activos
   */
  listarActivos = asyncHandler(async (req, res) => {
    const incidentes = await listarActivosUseCase.execute();
    return sendSuccess(res, incidentes, 200, 'Listado de incidentes activos.');
  });

  /**
   * GET /api/v1/incidentes/ubicaciones
   */
  listarUbicaciones = asyncHandler(async (req, res) => {
    const ubicaciones = await listarActivosUseCase.listarUbicaciones();
    return sendSuccess(res, ubicaciones, 200, 'Listado de ubicaciones hospitalarias.');
  });

  /**
   * GET /api/v1/incidentes/:id
   */
  obtenerDetalle = asyncHandler(async (req, res) => {
    const incidenteId = parseInt(req.params.id, 10);
    const detalle = await listarActivosUseCase.obtenerDetalle(incidenteId);

    if (!detalle) {
      throw ApiError.notFound(`El incidente con ID ${incidenteId} no existe.`);
    }

    return sendSuccess(res, detalle, 200, 'Detalle de incidente con auditoría.');
  });
}

export const incidenteController = new IncidenteController();
