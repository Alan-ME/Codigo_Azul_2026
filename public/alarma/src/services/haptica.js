/**
 * Adapter de vibración háptica.
 *
 * En React Native se reemplaza por `expo-haptics` o `react-native-haptic-feedback`.
 */
const PATRON_ALARMA = [300, 120, 300, 120, 300];
// El bucle debe re-disparar apenas termine el patrón anterior para lograr
// una vibración percibida como continua.
const PERIODO_ALARMA_MS = PATRON_ALARMA.reduce((a, b) => a + b, 0) + 200;

let temporizadorAlarma = null;

function vibrar(patron) {
  if (navigator.vibrate) navigator.vibrate(patron);
}

export const Haptica = {
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
   * Vibración de alarma continua hasta que se llame `detenerAlarma`.
   * Idempotente: llamadas repetidas no acumulan temporizadores.
   */
  iniciarAlarma() {
    if (temporizadorAlarma) return;
    vibrar(PATRON_ALARMA);
    temporizadorAlarma = setInterval(() => vibrar(PATRON_ALARMA), PERIODO_ALARMA_MS);
  },

  detenerAlarma() {
    if (temporizadorAlarma) {
      clearInterval(temporizadorAlarma);
      temporizadorAlarma = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
  },
};
