// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/use_cases/listar-activos.use-case.js
// Caso de uso: Consulta de Incidentes Activos en Tiempo Real para Sala de Guardia.
// Normativa: SAD v1.0 / SRS IEEE 830 RF-05 / CU-03 Fully Dressed
// ─────────────────────────────────────────────────────────────
import { incidenteRepository } from '../data/incidente.repository.js';
import { auditoriaRepository } from '../data/auditoria.repository.js';

export class ListarActivosUseCase {
  constructor(
    repo = incidenteRepository,
    auditRepo = auditoriaRepository
  ) {
    this.repo = repo;
    this.auditRepo = auditRepo;
  }

  /**
   * Obtiene la lista de incidentes en curso ('ACTIVADO', 'NOTIFICADO', 'EN_ATENCION').
   * @returns {Promise<Array<object>>}
   */
  async execute() {
    return this.repo.findActivos();
  }

  /**
   * Obtiene el detalle completo de un incidente junto con su bitácora de auditoría.
   * @param {number} incidenteId
   * @returns {Promise<object|null>}
   */
  async obtenerDetalle(incidenteId) {
    const incidente = await this.repo.findById(incidenteId);
    if (!incidente) return null;

    const auditoria = await this.auditRepo.findByIncidenteId(incidenteId);

    return {
      ...incidente,
      incidenteId: incidente.id,
      ubicacion: {
        id:             incidente.ubicacion_id,
        edificio:       incidente.edificio,
        piso:           incidente.piso,
        sectorSala:     incidente.sector_sala,
        cama:           incidente.cama,
        tieneCarroParo: incidente.tiene_carro_paro,
      },
      activadoPor: {
        id:     incidente.activador_id,
        nombre: `${incidente.activador_nombre} ${incidente.activador_apellido}`,
        rol:    incidente.activador_rol,
      },
      reanimador: incidente.reanimador_id ? {
        id:     incidente.reanimador_id,
        nombre: `${incidente.reanimador_nombre} ${incidente.reanimador_apellido}`,
        rol:    incidente.reanimador_rol,
      } : null,
      historialAuditoria: auditoria,
    };
  }

  /**
   * Lista todas las ubicaciones hospitalarias registradas.
   * @returns {Promise<Array<object>>}
   */
  async listarUbicaciones() {
    return this.repo.listarUbicaciones();
  }
}

export const listarActivosUseCase = new ListarActivosUseCase();
