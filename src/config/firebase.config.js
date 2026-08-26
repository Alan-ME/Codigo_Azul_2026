// ─────────────────────────────────────────────────────────────
// src/config/firebase.config.js
// Responsable:   Alex Heredia
// Rol:           Push Notifications & Telemetry Engineer Lead
// Fase:          1 — Inicialización de Firebase Admin SDK
// Descripción:   Configura e inicializa firebase-admin con las
//                credenciales de servicio (service account) leídas
//                desde variables de entorno. Exporta la instancia
//                lista para que las fases siguientes la consuman.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import admin from 'firebase-admin';

// ── Lectura de credenciales desde variables de entorno ───────
//
// Firebase Admin SDK requiere un "service account" completo para
// autenticarse contra los servicios de Firebase (en nuestro caso,
// Firebase Cloud Messaging). Los campos obligatorios son:
//
//   FCM_PROJECT_ID   → Identificador del proyecto en la consola
//                      de Firebase. Se usa para dirigir las
//                      peticiones al proyecto correcto.
//
//   FCM_CLIENT_EMAIL → Email de la cuenta de servicio (service
//                      account) generada en la consola de
//                      Firebase. Actúa como identidad del
//                      backend ante los servidores de Google.
//
//   FCM_PRIVATE_KEY  → Clave privada RSA de la cuenta de
//                      servicio. Firma los JWT que el SDK usa
//                      internamente para autenticarse. NUNCA
//                      debe hardcodearse ni commitearse al repo.
//                      Se espera el texto completo de la clave
//                      PEM (incluyendo -----BEGIN PRIVATE KEY-----
//                      y -----END PRIVATE KEY-----), con los
//                      saltos de línea reales o como "\n" literal
//                      (el SDK los interpreta correctamente
//                      después del .replace()).
//
const FCM_PROJECT_ID   = process.env.FCM_PROJECT_ID;
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL;
const FCM_PRIVATE_KEY  = process.env.FCM_PRIVATE_KEY;

// ── Validación temprana de variables requeridas ──────────────
//
// Si falta alguna credencial, logueamos un error claro y
// descriptivo ANTES de intentar la inicialización, para que
// el equipo identifique el problema sin necesidad de debuguear
// stacktraces crípticos del SDK.
//
const REQUIRED_FCM_VARS = {
  FCM_PROJECT_ID,
  FCM_CLIENT_EMAIL,
  FCM_PRIVATE_KEY,
};

const missingVars = Object.entries(REQUIRED_FCM_VARS)
  .filter(([, value]) => !value)
  .map(([key]) => key);

/** Flag que indica si Firebase se inicializó correctamente. */
let firebaseInitialized = false;

if (missingVars.length > 0) {
  console.error(
    `[FIREBASE] [ERROR] Variables de entorno faltantes para FCM: ${missingVars.join(', ')}`
  );
  console.error(
    '[FIREBASE] [HINT]  Agregue las variables FCM_PROJECT_ID, FCM_CLIENT_EMAIL y FCM_PRIVATE_KEY al archivo .env.'
  );
  console.error(
    '[FIREBASE] [HINT]  Estas credenciales se obtienen desde la consola de Firebase → Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada.'
  );
} else {
  // ── Inicialización de Firebase Admin SDK ────────────────────
  //
  // Se usa admin.credential.cert() con los tres campos del
  // service account. La private key llega como string con "\n"
  // literales desde el .env, así que hacemos .replace() para
  // convertirlos en saltos de línea reales que el SDK necesita
  // para parsear el PEM correctamente.
  //
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   FCM_PROJECT_ID,
        clientEmail: FCM_CLIENT_EMAIL,
        privateKey:  FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });

    firebaseInitialized = true;
    console.log('[FIREBASE] [OK] Firebase Admin SDK inicializado correctamente.');
  } catch (err) {
    console.error('[FIREBASE] [ERROR] Falló la inicialización de Firebase Admin SDK:');
    console.error(`[FIREBASE] [ERROR] ${err.message}`);
    console.error(
      '[FIREBASE] [HINT]  Verifique que FCM_PRIVATE_KEY contiene la clave PEM completa y que FCM_CLIENT_EMAIL es un email válido de service account.'
    );
  }
}

// ── Verificación de conexión al arrancar ─────────────────────
//
// Esta función se invoca desde server.js durante el startup,
// análoga a testConnection() de db.js. Intenta enviar un
// "dry-run" message a FCM para confirmar que las credenciales
// son válidas y que hay conectividad con los servidores de
// Google. Si la inicialización del SDK falló, retorna false
// directamente sin intentar el dry-run.
//
/**
 * Verifica que Firebase Admin SDK se haya inicializado y que
 * las credenciales sean válidas haciendo un envío "dry-run"
 * contra FCM (no envía ninguna notificación real).
 *
 * @returns {Promise<boolean>} true si la conexión es exitosa.
 */
export const testFirebaseConnection = async () => {
  if (!firebaseInitialized) {
    console.error(
      '[FIREBASE] [ERROR] No se puede verificar la conexión — el SDK no fue inicializado.'
    );
    return false;
  }

  try {
    // Dry-run: valida credenciales y conectividad con FCM
    // sin enviar una notificación real. Si las credenciales
    // son inválidas o el proyecto no existe, esto lanza un error.
    await admin.messaging().send(
      { topic: 'connection-test', notification: { title: 'test' } },
      true  // dryRun = true → no envía nada, solo valida
    );

    console.log(
      `[FIREBASE] [OK] Conexión verificada con FCM — Proyecto: ${FCM_PROJECT_ID}`
    );
    return true;
  } catch (err) {
    // Si el error es por topic inválido pero las credenciales
    // son correctas, lo consideramos exitoso (el dry-run valida
    // la autenticación antes de validar el payload).
    if (err.code === 'messaging/invalid-argument') {
      console.log(
        `[FIREBASE] [OK] Credenciales FCM válidas — Proyecto: ${FCM_PROJECT_ID}`
      );
      return true;
    }

    console.error('[FIREBASE] [ERROR] Falló la verificación de conexión con FCM:');
    console.error(`[FIREBASE] [ERROR] ${err.message}`);
    return false;
  }
};

// ── Exportaciones ────────────────────────────────────────────
//
// Se exporta la instancia de `admin` ya inicializada para que
// los módulos de las fases siguientes la importen directamente:
//
//   Fase 2 → Registro de tokens FCM de dispositivos
//            (endpoint POST /api/v1/fcm/token)
//
//   Fase 3 → Despachador de notificaciones push
//            (admin.messaging().send() / sendMulticast())
//
//   Fase 4 → Telemetría y auditoría de entregas
//            (logging de delivery receipts)
//
export default admin;
