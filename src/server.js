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

/** Servidor HTTP — exportado para que Alex adjunte Socket.IO. */
export const httpServer = createServer(app);

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
    console.log('   CODIGO AZUL — Backend Core & Database                ');
    console.log(`   URL:     http://localhost:${config.port}                      `);
    console.log(`   Entorno: ${config.nodeEnv.padEnd(43)}`);
    console.log('   Health:  GET /api/v1/health                          ');
    console.log('========================================================');
    console.log('');
  });
};

startServer();
