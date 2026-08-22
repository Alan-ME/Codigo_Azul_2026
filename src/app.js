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

// -- Feature Routers y Middlewares ────────────────────────────
import authRoutes from './features/auth/presentation/auth.routes.js';
import incidenteRoutes from './features/codigo_azul/presentation/incidente.routes.js';
import { incidenteController } from './features/codigo_azul/presentation/incidente.controller.js';
import { authenticateJWT } from './core/middlewares/auth.middleware.js';

// -- Ruta al frontend integrado (public/) ────────────────────
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FRONTEND_DIR = join(__dirname, '..', 'public');

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
app.use(cors({ origin: config.corsOrigin }));   // CORS configurado
app.use(express.json({ limit: '1mb' }));        // Parseo de JSON
app.use(requestLogger);                         // Log de requests

// ── Health Check ─────────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  sendSuccess(res, {
    status:    'online',
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  });
});

// -- Rutas por Feature ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/usuarios', authRoutes);
app.use('/api/v1/incidentes', incidenteRoutes);
app.get('/api/v1/ubicaciones', authenticateJWT, incidenteController.listarUbicaciones);

// -- Frontend Integrado (public/) ─────────────────────────────
// Dashboard PC hospitalario: http://localhost:4000/app
app.use('/app', express.static(FRONTEND_DIR));

// App Móvil / PWA Alarma: http://localhost:4000/alarma y /movil
app.use('/alarma', express.static(join(FRONTEND_DIR, 'alarma')));
app.use('/movil', express.static(join(FRONTEND_DIR, 'alarma')));

// Redirección raíz hacia la aplicación web
app.get('/', (req, res) => {
  res.redirect('/app');
});

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
