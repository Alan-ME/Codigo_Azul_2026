// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/services/hapticaService.js
// Servicio de vibración háptica y Screen Wake Lock API
// ─────────────────────────────────────────────────────────────

const PATRON_ALARMA = [300, 120, 300, 120, 300];
const PERIODO_ALARMA_MS = PATRON_ALARMA.reduce((a, b) => a + b, 0) + 200;

let temporizadorAlarma = null;
let wakeLockSentinel = null;

function vibrar(patron) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(patron);
    } catch {
      // Silenciar si no está soportado
    }
  }
}

export const hapticaService = {
  toque() {
    vibrar(20);
  },
  confirmacion() {
    vibrar([15, 30, 15]);
  },
  error() {
    vibrar([60, 40, 60]);
  },
  alarma() {
    vibrar(PATRON_ALARMA);
  },

  /**
   * Mantiene la pantalla encendida (Screen Wake Lock API) evitando Doze mode / bloqueo
   */
  async solicitarWakeLock() {
    try {
      if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && !wakeLockSentinel) {
        wakeLockSentinel = await navigator.wakeLock.request('screen');
        wakeLockSentinel.addEventListener('release', () => {
          wakeLockSentinel = null;
        });
      }
    } catch (err) {
      console.warn('[WAKELOCK] No se pudo obtener Screen Wake Lock:', err.message);
    }
  },

  liberarWakeLock() {
    if (wakeLockSentinel) {
      wakeLockSentinel.release().catch(() => {});
      wakeLockSentinel = null;
    }
  },

  /**
   * Vibración de alarma continua hasta que se llame `detenerAlarma`.
   */
  iniciarAlarma() {
    this.solicitarWakeLock().catch(() => {});
    if (temporizadorAlarma) return;
    vibrar(PATRON_ALARMA);
    temporizadorAlarma = setInterval(() => vibrar(PATRON_ALARMA), PERIODO_ALARMA_MS);
  },

  detenerAlarma() {
    this.liberarWakeLock();
    if (temporizadorAlarma) {
      clearInterval(temporizadorAlarma);
      temporizadorAlarma = null;
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch {}
    }
  },
};
