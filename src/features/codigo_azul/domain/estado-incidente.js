// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/domain/estado-incidente.js
// Enumeración de estados y validación de la Máquina de Estados Finita (FSM).
// Normativa: SAD v1.0 / SRS IEEE 830 RN-01
// ─────────────────────────────────────────────────────────────

export const EstadoIncidente = Object.freeze({
  ACTIVADO:    'ACTIVADO',
  NOTIFICADO:  'NOTIFICADO',
  EN_ATENCION: 'EN_ATENCION',
  RESUELTO:    'RESUELTO',
  CANCELADO:   'CANCELADO',
});

/**
 * Matriz de transiciones válidas para la FSM clínica:
 * - ACTIVADO    -> NOTIFICADO, EN_ATENCION, CANCELADO
 * - NOTIFICADO  -> EN_ATENCION, CANCELADO
 * - EN_ATENCION -> RESUELTO, CANCELADO
 * - RESUELTO    -> (Estado terminal)
 * - CANCELADO   -> (Estado terminal)
 */
const TRANSICIONES_VALIDAS = {
  [EstadoIncidente.ACTIVADO]: [
    EstadoIncidente.NOTIFICADO,
    EstadoIncidente.EN_ATENCION,
    EstadoIncidente.CANCELADO,
  ],
  [EstadoIncidente.NOTIFICADO]: [
    EstadoIncidente.EN_ATENCION,
    EstadoIncidente.CANCELADO,
  ],
  [EstadoIncidente.EN_ATENCION]: [
    EstadoIncidente.RESUELTO,
    EstadoIncidente.CANCELADO,
  ],
  [EstadoIncidente.RESUELTO]: [],
  [EstadoIncidente.CANCELADO]: [],
};

/**
 * Valida si una transición de estado es legal según la FSM.
 * @param {string} estadoActual
 * @param {string} nuevoEstado
 * @returns {boolean}
 */
export const esTransicionValida = (estadoActual, nuevoEstado) => {
  const permitidos = TRANSICIONES_VALIDAS[estadoActual] || [];
  return permitidos.includes(nuevoEstado);
};
