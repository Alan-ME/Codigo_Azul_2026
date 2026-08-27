import { apiClient } from './apiClient.js';

export const incidentesService = {
  listarActivos: () =>
    apiClient.get('/api/v1/incidentes/activos').then((r) => r.data.data),

  listarUbicaciones: () =>
    apiClient.get('/api/v1/ubicaciones').then((r) => r.data.data),

  activar: (ubicacionId) =>
    apiClient.post('/api/v1/incidentes/activar', { ubicacionId }).then((r) => r.data.data),

  confirmarAck: (incidenteId) =>
    apiClient.put(`/api/v1/incidentes/${incidenteId}/ack`).then((r) => r.data.data),

  cancelar: (incidenteId, motivo) =>
    apiClient
      .post(`/api/v1/incidentes/${incidenteId}/cancelar`, { motivo })
      .then((r) => r.data.data),

  resolver: (incidenteId, resultadoClinico, observaciones) =>
    apiClient
      .put(`/api/v1/incidentes/${incidenteId}/resolver`, { resultadoClinico, observaciones })
      .then((r) => r.data.data),

  registrarEventoClinico: (incidenteId, tipoEvento, detalle) =>
    apiClient
      .post(`/api/v1/incidentes/${incidenteId}/evento-clinico`, { tipoEvento, detalle })
      .then((r) => r.data.data),
};

