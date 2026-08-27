// ─────────────────────────────────────────────────────────────
// src/features/fcm/use_cases/despachar-push.use-case.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        3 — Caso de Uso: Despacho de Push Notifications de Alta Prioridad
// Normativa:   Clean Architecture / Doze Mode Bypass / IEEE 830 (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import admin from '../../../core/config/firebase.config.js';
import { fcmRepository } from '../data/fcm.repository.js';
import { auditarTelemetriaUseCase } from './auditar-telemetria.use-case.js';

export class DespacharPushUseCase {
  /**
   * Ejecuta el despacho masivo de notificaciones push de alta prioridad para un Código Azul.
   * @param {object} payload - Payload del evento 'incidente:activado'
   * @returns {Promise<object>}
   */
  async execute(payload) {
    const startTime = Date.now();
    const data = payload.data || payload;
    const incidenteId = data.incidenteId || data.id;
    const ubicacion = data.ubicacion || {};
    const activador = data.activadoPor || {};

    const edificio = ubicacion.edificio || 'Sector Central';
    const piso = ubicacion.piso !== undefined ? ubicacion.piso : '-';
    const sector = ubicacion.sectorSala || ubicacion.sector_sala || 'Cuidados Críticos';
    const cama = ubicacion.cama || 'Cama de Emergencia';

    const titulo = `🚨 CÓDIGO AZUL: ${edificio} (Piso ${piso})`;
    const cuerpo = `Sector: ${sector} — Cama ${cama}. Asistencia médica urgente requerida.`;

    console.log(`[FCM] [DISPATCH] Iniciando despacho de alarma critica para Incidente #${incidenteId}...`);

    // Helper: construye el payload de notificacion critica compartido
    // entre el envio por topic y el envio multicast directo.
    const construirPayloadCritico = () => ({
      notification: {
        title: titulo,
        body:  cuerpo,
      },
      android: {
        priority: 'high',
        notification: {
          channelId:             'codigo_azul_critico',
          sound:                 'alarma_critica',
          priority:              'max',
          visibility:            'public',
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            contentAvailable: true,
            sound:            'alarma_critica.caf',
          },
        },
      },
      data: {
        incidenteId:  String(incidenteId),
        codigoUUID:   String(data.codigoUUID || data.codigo_uuid || ''),
        edificio:     String(edificio),
        piso:         String(piso),
        sectorSala:   String(sector),
        cama:         String(cama),
        activadoPor:  String(activador.nombre || 'Personal Medico'),
        timestamp:    new Date().toISOString(),
      },
    });

    // 1. Obtener tokens de los destinatarios (Reanimadores y Guardia)
    const destinatarios = await fcmRepository.obtenerTokensActivosPorRoles([
      'REANIMADOR_MEDICO',
      'OPERADOR_GUARDIA',
      'ADMINISTRADOR',
    ]);

    const tokens = destinatarios.map((d) => d.token_fcm);

    // Si Firebase no esta inicializado o no hay tokens, registramos auditoria y salimos limpiamente
    if (admin.apps.length === 0) {
      console.warn('[FCM] [WARN] Firebase Admin SDK no disponible — push notifications omitidas.');
      return { total: 0, exitosos: 0, fallidos: 0, latenciaDespachoMs: 0 };
    }

    let exitosos = 0;
    let fallidos = 0;
    const errores = [];

    // 2. Despacho a traves de Topic general
    try {
      const topicMessage = {
        topic: 'codigo_azul',
        ...construirPayloadCritico(),
      };

      await admin.messaging().send(topicMessage);
      console.log(`[FCM] [OK] Notificacion enviada al topic 'codigo_azul'.`);
    } catch (topicErr) {
      console.warn(`[FCM] [WARN] Error en envio a topic 'codigo_azul': ${topicErr.message}`);
    }

    // 3. Despacho Multicast directo a tokens registrados
    if (tokens.length > 0) {
      const multicastPayload = {
        tokens,
        ...construirPayloadCritico(),
      };

      try {
        const response = await admin.messaging().sendEachForMulticast(multicastPayload);
        exitosos = response.successCount;
        fallidos = response.failureCount;

        // Registrar en tabla `notificaciones_push` para cada token
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          const token = tokens[i];

          await fcmRepository.registrarDespachoPush({
            incidenteId,
            tokenFcm: token,
            titulo,
            cuerpo,
            despachado: resp.success,
          });

          if (!resp.success) {
            errores.push(resp.error?.message || 'Error desconocido');
            if (
              resp.error?.code === 'messaging/registration-token-not-registered' ||
              resp.error?.code === 'messaging/invalid-registration-token'
            ) {
              await fcmRepository.desactivarToken(token);
            }
          }
        }
      } catch (multiErr) {
        console.error(`[FCM] [ERROR] Falla en multicast: ${multiErr.message}`);
        fallidos = tokens.length;
        errores.push(multiErr.message);
      }
    }

    const latenciaDespachoMs = Date.now() - startTime;

    // 4. Registro de Auditoría y Telemetría Médico-Legal
    await auditarTelemetriaUseCase.execute({
      incidenteId,
      latenciaDespachoMs,
      totalDestinatarios: tokens.length,
      exitosos,
      fallidos,
      errores,
    });

    return {
      incidenteId,
      total: tokens.length,
      exitosos,
      fallidos,
      latenciaDespachoMs,
    };
  }
}

export const despacharPushUseCase = new DespacharPushUseCase();
