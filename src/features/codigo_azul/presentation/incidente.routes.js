// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/presentation/incidente.routes.js
// Rutas y middlewares de seguridad para el Módulo de Código Azul.
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { incidenteController } from './incidente.controller.js';
import { authenticateJWT } from '../../../core/middlewares/auth.middleware.js';
import { requireRole } from '../../../core/middlewares/rbac.middleware.js';

const router = Router();

// Todas las rutas de incidentes requieren autenticación JWT previa
router.use(authenticateJWT);

// 1. Consulta de catálogo de ubicaciones hospitalarias
router.get('/ubicaciones', incidenteController.listarUbicaciones);

// 2. Consulta de incidentes activos en tiempo real
router.get(
  '/activos',
  requireRole('OPERADOR_GUARDIA', 'MEDICO_ACTIVADOR', 'REANIMADOR_MEDICO', 'ADMINISTRADOR'),
  incidenteController.listarActivos
);

// 3. Disparo prioritario de alerta Código Azul
router.post(
  '/activar',
  requireRole('MEDICO_ACTIVADOR', 'ADMINISTRADOR'),
  incidenteController.activar
);

// 4. Confirmación de asistencia (ACK) por equipo de reanimación
router.put(
  '/:id/ack',
  requireRole('REANIMADOR_MEDICO', 'ADMINISTRADOR'),
  incidenteController.confirmarAck
);

// 5. Cancelación de falsa alarma o resolución previa
router.post(
  '/:id/cancelar',
  requireRole('MEDICO_ACTIVADOR', 'OPERADOR_GUARDIA', 'ADMINISTRADOR'),
  incidenteController.cancelar
);

// 6. Resolución clínica: cierra el ciclo del incidente (EN_ATENCION -> RESUELTO)
router.put(
  '/:id/resolver',
  requireRole('REANIMADOR_MEDICO', 'OPERADOR_GUARDIA', 'ADMINISTRADOR'),
  incidenteController.resolver
);

// 7. Detalle de incidente con historial inmutable de auditoría
router.get('/:id', incidenteController.obtenerDetalle);

export default router;
