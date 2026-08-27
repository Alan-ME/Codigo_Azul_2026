// ─────────────────────────────────────────────────────────────
// src/features/codigo_azul/domain/resultado-clinico.js
// Dominio: Resultados clínicos estándar de reanimación cardiopulmonar
// Normativa: AHA Guidelines / PERKI / ILCOR Utstein Style
// ─────────────────────────────────────────────────────────────

export const ResultadoClinico = Object.freeze({
  ROSC_EXITOSO:           'ROSC_EXITOSO',
  DESFIBRILACION_EFECTIVA: 'DESFIBRILACION_EFECTIVA',
  TRASLADO_UTI:           'TRASLADO_UTI',
  FALLECIDO_DOA:          'FALLECIDO_DOA',
  FALSA_ALARMA:           'FALSA_ALARMA',
});

export const RESULTADO_CLINICO_LABELS = Object.freeze({
  [ResultadoClinico.ROSC_EXITOSO]:           'ROSC Exitoso (Retorno de Circulación Espontánea)',
  [ResultadoClinico.DESFIBRILACION_EFECTIVA]: 'Desfibrilación Efectiva / Ritmo Reversible',
  [ResultadoClinico.TRASLADO_UTI]:           'Traslado a Unidad de Terapia Intensiva (UTI)',
  [ResultadoClinico.FALLECIDO_DOA]:          'Fallecido / Reanimación No Exitosa (DOA)',
  [ResultadoClinico.FALSA_ALARMA]:           'Falsa Alarma / Error de Activación',
});

export const RESULTADOS_VALIDOS = Object.freeze(Object.values(ResultadoClinico));

/**
 * Valida si un valor corresponde a un resultado clínico legal.
 * @param {string} valor
 * @returns {boolean}
 */
export function esResultadoClinicoValido(valor) {
  return typeof valor === 'string' && RESULTADOS_VALIDOS.includes(valor.toUpperCase().trim());
}
