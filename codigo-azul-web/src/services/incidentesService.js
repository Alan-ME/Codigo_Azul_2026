import { apiClient } from './apiClient.js';

export const incidentesService = {
  listarActivos: () =>
    apiClient.get('/api/v1/incidentes/activos').then((r) => r.data.data),

  confirmarAck: (incidenteId) =>
    apiClient.put(`/api/v1/incidentes/${incidenteId}/ack`).then((r) => r.data.data),

  cancelar: (incidenteId, motivo) =>
    apiClient
      .post(`/api/v1/incidentes/${incidenteId}/cancelar`, { motivo })
      .then((r) => r.data.data),
};
