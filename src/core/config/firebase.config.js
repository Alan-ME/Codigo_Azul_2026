// ─────────────────────────────────────────────────────────────
// src/core/config/firebase.config.js
// Responsable:   Alex Heredia
// Rol:           Push Notifications & Telemetry Engineer Lead
// Descripción:   Configura e inicializa firebase-admin con las
//                credenciales de servicio leídas desde variables de entorno.
// ─────────────────────────────────────────────────────────────

import 'dotenv/config';
import admin from 'firebase-admin';

const FCM_PROJECT_ID   = process.env.FCM_PROJECT_ID;
const FCM_CLIENT_EMAIL = process.env.FCM_CLIENT_EMAIL;
const FCM_PRIVATE_KEY  = process.env.FCM_PRIVATE_KEY;

const REQUIRED_FCM_VARS = {
  FCM_PROJECT_ID,
  FCM_CLIENT_EMAIL,
  FCM_PRIVATE_KEY,
};

const missingVars = Object.entries(REQUIRED_FCM_VARS)
  .filter(([, value]) => !value)
  .map(([key]) => key);

let firebaseInitialized = false;

if (missingVars.length > 0) {
  console.error(
    `[FIREBASE] [ERROR] Variables de entorno faltantes para FCM: ${missingVars.join(', ')}`
  );
  console.error(
    '[FIREBASE] [HINT]  Agregue las variables FCM_PROJECT_ID, FCM_CLIENT_EMAIL y FCM_PRIVATE_KEY al archivo .env.'
  );
} else {
  try {
    const formattedPrivateKey = FCM_PRIVATE_KEY
      .trim()
      .replace(/^["']|["']$/g, '')
      .replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   FCM_PROJECT_ID,
        clientEmail: FCM_CLIENT_EMAIL,
        privateKey:  formattedPrivateKey,
      }),
    });

    firebaseInitialized = true;
    console.log('[FIREBASE] [OK] Firebase Admin SDK inicializado correctamente.');
  } catch (err) {
    console.error('[FIREBASE] [ERROR] Falló la inicialización de Firebase Admin SDK:');
    console.error(`[FIREBASE] [ERROR] ${err.message}`);
  }
}

export const testFirebaseConnection = async () => {
  if (!firebaseInitialized) {
    console.error(
      '[FIREBASE] [ERROR] No se puede verificar la conexión — el SDK no fue inicializado.'
    );
    return false;
  }

  try {
    await admin.messaging().send(
      { topic: 'connection-test', notification: { title: 'test' } },
      true
    );

    console.log(
      `[FIREBASE] [OK] Conexión verificada con FCM — Proyecto: ${FCM_PROJECT_ID}`
    );
    return true;
  } catch (err) {
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

export default admin;
