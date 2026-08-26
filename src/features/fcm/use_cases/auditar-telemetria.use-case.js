// ─────────────────────────────────────────────────────────────
// src/features/fcm/use_cases/auditar-telemetria.use-case.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        4 — Caso de Uso: Auditoría Médico-Legal y Telemetría JSONB
// Normativa:   ISO 25010 / Bitácora Append-Only (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import { auditoriaRepository } from '../../codigo_azul/data/auditoria.repository.js';

export class AuditarTelemetriaUseCase {
  /**
   * Registra las métricas de despacho push en la tabla inmutable de auditoría.
   * @param {object} params
   * @param {number} params.incidenteId
   * @param {number} params.latenciaDespachoMs
   * @param {number} params.totalDestinatarios
   * @param {number} params.exitosos
   * @param {number} params.fallidos
   * @param {string[]} [params.errores]
   * @returns {Promise<object>}
   */
  async execute({
    incidenteId,
    latenciaDespachoMs,
    totalDestinatarios,
    exitosos,
    fallidos,
    errores = [],
  }) {
    const payloadData = {
      tipo:                'FCM_PUSH_DISPATCH',
      canalNotificacion:   'codigo_azul_critico',
      prioridad:           'HIGH',
      latenciaDespachoMs:  parseFloat(latenciaDespachoMs.toFixed(2)),
      totalDestinatarios,
      exitosos,
      fallidos,
      errores,
      timestampDespacho:   new Date().toISOString(),
    };

    const auditRecord = await auditoriaRepository.registrar({
      incidenteId,
      usuarioId: null, // Sistema / Worker de Telemetría
      tipoEvento: 'NOTIFICACION_PUSH_DESPACHADA',
      payloadData,
    });

    console.log(
      `[TELEMETRÍA] [OK] Auditoría FCM registrada para Incidente #${incidenteId} — ` +
      `Latencia: ${payloadData.latenciaDespachoMs}ms — Exitosos: ${exitosos}/${totalDestinatarios}`
    );

    return auditRecord;
  }
}

export const auditarTelemetriaUseCase = new AuditarTelemetriaUseCase();
