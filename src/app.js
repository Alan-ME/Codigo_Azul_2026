// ─────────────────────────────────────────────────────────────
// src/app.js
// Bootstrap de la aplicación Express.
// Configura middlewares globales, monta las rutas por feature
// y sirve la aplicación frontend en React (codigo-azul-web/dist).
// ─────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REACT_DIST_DIR = join(__dirname, '..', 'client', 'dist');

const app = express();

// ── Middlewares Globales ─────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc:   ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc:    ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc:     ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.unsplash.com", "https:"],
        connectSrc: ["'self'", "ws:", "wss:", "http://localhost:*", "http://127.0.0.1:*"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);
const allowedOrigins = [config.corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true }));   // CORS configurado
app.use(express.json({ limit: '1mb' }));        // Parseo de JSON
app.use(requestLogger);                         // Log de requests

// ── Health Check Profundo ────────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'offline';
  let fcmStatus = 'offline';

  try {
    await query('SELECT 1');
    dbStatus = 'online';
  } catch (_) {
    dbStatus = 'offline';
  }

  try {
    fcmStatus = (await testFirebaseConnection()) ? 'online' : 'offline';
  } catch (_) {
    fcmStatus = 'offline';
  }

  const overall = dbStatus === 'online' ? 'online' : 'degraded';

  sendSuccess(res, {
    status:    overall,
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
    services: {
      database: dbStatus,
      firebase: fcmStatus,
    },
  });
});

// -- Rutas por Feature ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidentes', incidenteRoutes);
app.use('/api/v1/fcm', fcmRoutes);
app.get('/api/v1/ubicaciones', authenticateJWT, incidenteController.listarUbicaciones);

// -- Servir Frontend React (codigo-azul-web/dist) ─────────────
if (fs.existsSync(REACT_DIST_DIR)) {
  app.use(express.static(REACT_DIST_DIR));
  app.use('/app', express.static(REACT_DIST_DIR));

  // Fallback SPA para todas las rutas no-API hacia index.html de React
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(join(REACT_DIST_DIR, 'index.html'));
    }
    next();
  });
} else {
  app.get('/', (req, res) => {
    res.send('<h1>Código Azul API</h1><p>Ejecutá <code>npm run build</code> para compilar la suite web en React.</p>');
  });
}

// ── Ruta 404 (no encontrada) ─────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ── Error Handler Global (ÚLTIMO middleware) ─────────────────
app.use(errorHandler);

export default app;
