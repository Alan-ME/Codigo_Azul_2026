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

import { initSocketGateway } from './core/sockets/socket.gateway.js';

/** Servidor HTTP con Gateway Socket.IO integrado */
export const httpServer = createServer(app);
export const io = initSocketGateway(httpServer);

const startServer = async () => {
  // Verificar conexión a PostgreSQL antes de aceptar requests.
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('[SERVER] [ERROR] Abortando inicio — base de datos no disponible.');
    process.exit(1);
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
