// ─────────────────────────────────────────────────────────────
// src/features/fcm/fcm.module.js
// Responsable: Alex Heredia (Push Notifications & Telemetry Lead)
// Fase:        3 & 4 — Inicializador del Módulo FCM y Suscriptor a Domain Events
// Normativa:   Clean Architecture / Event-Driven Architecture (APA 7.ª Ed.)
// ─────────────────────────────────────────────────────────────
import { appEvents } from '../../core/events/event-emitter.js';
import { despacharPushUseCase } from './use_cases/despachar-push.use-case.js';

let initialized = false;

/**
 * Inicializa los listeners del módulo FCM para reaccionar a eventos del dominio.
 */
export function initFCMModule() {
  if (initialized) return;

  // Escuchar cuando se activa un nuevo Código Azul para disparar Push Notifications en segundo plano
  appEvents.on('incidente:activado', (payload) => {
    setImmediate(async () => {
      try {
        await despacharPushUseCase.execute(payload);
      } catch (err) {
        console.error(`[FCM] [ERROR] Error durante el despacho push del incidente: ${err.message}`);
      }
    });
  });

  initialized = true;
  console.log('[FCM] [OK] Módulo Push Notifications & Telemetría conectado a Domain Events.');
}
