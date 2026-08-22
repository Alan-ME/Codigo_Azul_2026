/**
 * Adapter de notificaciones push.
 *
 * En web:
 *   - Pedimos permiso al inicio de sesión.
 *   - Mostramos notificaciones nativas del navegador cuando llega un incidente.
 *   - Devolvemos un token FCM simulado (uuid propio) para registrar en el back;
 *     así el contrato con el backend queda listo para cuando la app RN registre
 *     su token real de Firebase.
 */
export const Notificacion = {
  async pedirPermiso() {
    if (!("Notification" in window)) return "unsupported";
    if (Notification.permission === "default") {
      try { return await Notification.requestPermission(); }
      catch { return "denied"; }
    }
    return Notification.permission;
  },

  async obtenerTokenSimulado() {
    const llave = "codigo-azul.token-push-simulado";
    let token = localStorage.getItem(llave);
    if (!token) {
      token = "web-" + (crypto.randomUUID?.() || Math.random().toString(36).slice(2));
      localStorage.setItem(llave, token);
    }
    return token;
  },

  mostrar(titulo, opciones = {}) {
    if (!("Notification" in window) || Notification.permission !== "granted") return null;
    try {
      return new Notification(titulo, {
        icon: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%23DC2626'/><path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' fill='white'/></svg>",
        requireInteraction: true,
        ...opciones,
      });
    } catch {
      return null;
    }
  },
};
