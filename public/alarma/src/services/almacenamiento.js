/**
 * Adapter de almacenamiento seguro.
 *
 * En web usa localStorage; en React Native se implementa la misma firma
 * usando `expo-secure-store` o `react-native-encrypted-storage`.
 *
 *   await Almacenamiento.guardar(llave, valor)
 *   await Almacenamiento.leer(llave)
 *   await Almacenamiento.borrar(llave)
 */
export const Almacenamiento = {
  async guardar(llave, valor) {
    const serializado = typeof valor === "string" ? valor : JSON.stringify(valor);
    localStorage.setItem(llave, serializado);
  },
  async leer(llave) {
    const crudo = localStorage.getItem(llave);
    if (crudo == null) return null;
    try {
      return JSON.parse(crudo);
    } catch {
      return crudo;
    }
  },
  async borrar(llave) {
    localStorage.removeItem(llave);
  },
};
