// ─────────────────────────────────────────────────────────────
// src/app.js
// Bootstrap de la aplicación Express.
// Configura middlewares globales, monta las rutas por feature
// y registra el handler global de errores.
// ─────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './core/config/env.js';
import { requestLogger } from './core/middlewares/request-logger.middleware.js';
import { errorHandler } from './core/middlewares/error-handler.middleware.js';
import { sendSuccess } from './core/helpers/api-response.js';
import { query } from './core/config/db.js';
import { testFirebaseConnection } from './config/firebase.config.js';

// -- Feature Routers y Middlewares ────────────────────────────
import authRoutes from './features/auth/presentation/auth.routes.js';
import incidenteRoutes from './features/codigo_azul/presentation/incidente.routes.js';
import fcmRoutes from './features/fcm/presentation/fcm.routes.js';
import { incidenteController } from './features/codigo_azul/presentation/incidente.controller.js';
import { authenticateJWT } from './core/middlewares/auth.middleware.js';

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REACT_DIST_DIR = join(__dirname, '..', 'codigo-azul-web', 'dist');

const app = express();

// ── Middlewares Globales ─────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'"],
        styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc:    ["'self'", "https://fonts.gstatic.com"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "https://*"],
        imgSrc:     ["'self'", "data:", "blob:", "https://*"],
      },
    },
  })
);

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ── Endpoint de Health Check ─────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'healthy';
  let fcmStatus = 'healthy';

  try {
    await query('SELECT 1');
  } catch {
    dbStatus = 'unhealthy';
  }

  const fcmConnected = await testFirebaseConnection();
  if (!fcmConnected) {
    fcmStatus = 'disconnected';
  }

  const overallStatus = dbStatus === 'healthy' ? 'healthy' : 'degraded';

  return sendSuccess(res, {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: config.nodeEnv,
    services: {
      database: dbStatus,
      fcm: fcmStatus,
      sockets: 'healthy',
    },
  });
});

// -- Rutas por Feature ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidentes', incidenteRoutes);
app.use('/api/v1/fcm', fcmRoutes);
app.get('/api/v1/ubicaciones', authenticateJWT, incidenteController.listarUbicaciones);

// -- Frontend Unificado (React + Vite SPA) ────────────────────
if (fs.existsSync(REACT_DIST_DIR)) {
  app.use(express.static(REACT_DIST_DIR));
  
  // Soporte universal para SPA Client Routing (/dashboard, /alarma, /panico, /reanimador, /login)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(join(REACT_DIST_DIR, 'index.html'));
  });
}

// ── Ruta 404 para API (no encontrada) ────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    },
  });
});

// ── Handler Global de Errores ────────────────────────────────
app.use(errorHandler);

export default app;
