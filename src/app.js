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

// ── Feature Routers ──────────────────────────────────────────
import authRoutes from './features/auth/presentation/auth.routes.js';
import incidenteRoutes from './features/codigo_azul/presentation/incidente.routes.js';

const app = express();

// ── Middlewares Globales ─────────────────────────────────────
app.use(helmet());                              // Headers de seguridad
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

// ── Rutas por Feature ────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/incidentes', incidenteRoutes);

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
