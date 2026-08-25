// ─────────────────────────────────────────────────────────────
// src/server.js
// Punto de entrada principal de la aplicación.
// Crea el servidor HTTP, verifica la conexión a PostgreSQL
// y escucha en el puerto configurado.
//
// NOTA PARA ALEX: Este módulo exporta `httpServer` para que
// puedas adjuntar Socket.IO con:
//   import { httpServer } from './server.js';
//   const io = new Server(httpServer, { ... });
// ─────────────────────────────────────────────────────────────
import { createServer } from 'node:http';
import app from './app.js';
import { config } from './core/config/env.js';
import { testConnection } from './core/config/db.js';
import { testFirebaseConnection } from './config/firebase.config.js';

import { initSocketGateway } from './core/sockets/socket.gateway.js';
import { initFCMModule } from './features/fcm/fcm.module.js';

/** Servidor HTTP con Gateway Socket.IO integrado */
export const httpServer = createServer(app);
export const io = initSocketGateway(httpServer);

// Inicializar suscriptor de eventos para notificaciones Push y Telemetría
initFCMModule();

const startServer = async () => {
  // Verificar conexión a PostgreSQL antes de aceptar requests.
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('[SERVER] [ERROR] Abortando inicio — base de datos no disponible.');
    process.exit(1);
  }

  // Verificar conexión con Firebase Cloud Messaging.
  // A diferencia de la DB, la falla de FCM NO aborta el servidor:
  // el sistema de alertas por Socket.IO sigue operativo, y las
  // push notifications se pueden reconectar más adelante.
  const fcmOk = await testFirebaseConnection();
  if (!fcmOk) {
    console.warn('[SERVER] [WARN] Firebase Cloud Messaging no disponible — las push notifications estarán deshabilitadas.');
    console.warn('[SERVER] [WARN] El servidor continúa operativo con Socket.IO y la base de datos.');
  }

  httpServer.listen(config.port, () => {
    console.log('');
    console.log('========================================================');
    console.log('   CODIGO AZUL -- Backend Core & Database               ');
    console.log(`   API:     http://localhost:${config.port}/api/v1                 `);
    console.log(`   App PC:  http://localhost:${config.port}/app                    `);
    console.log(`   Alarma:  http://localhost:${config.port}/alarma                 `);
    console.log(`   Sockets: ws://localhost:${config.port}/socket.io/               `);
    console.log(`   Entorno: ${config.nodeEnv.padEnd(43)}`);
    console.log('   Health:  GET /api/v1/health                          ');
    console.log('========================================================');
    console.log('');
  });
};

startServer();
