/**
 * Adapter de vibración háptica.
 *
 * En React Native se reemplaza por `expo-haptics` o `react-native-haptic-feedback`.
 */
export const Haptica = {
  toque() {
    if (navigator.vibrate) navigator.vibrate(20);
  },
  confirmacion() {
    if (navigator.vibrate) navigator.vibrate([15, 30, 15]);
  },
  error() {
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  },
  alarma() {
    if (navigator.vibrate) navigator.vibrate([300, 120, 300, 120, 300]);
  },
};
