import { config } from "../config.js";
import { Almacenamiento } from "./almacenamiento.js";

/**
 * Wrapper del cliente de Socket.IO.
 *
 * El script `socket.io.js` se sirve por el propio servidor Express en
 * `/socket.io/socket.io.js`. Lo cargamos dinámicamente para que el cliente
 * no dependa de un bundler.
 */
async function cargarLibreriaSocketIO() {
  if (window.io) return window.io;
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/socket.io/socket.io.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar socket.io.js"));
    document.head.appendChild(script);
  });
  return window.io;
}

class TransporteRealtime extends EventTarget {
  constructor() {
    super();
    this.socket = null;
    this.estado = "desconectado";
  }

  _cambiarEstado(nuevo) {
    if (this.estado === nuevo) return;
    this.estado = nuevo;
    this.dispatchEvent(new CustomEvent("estado", { detail: nuevo }));
  }

  async conectar() {
    if (this.socket) return;
    const io = await cargarLibreriaSocketIO();
    const token = await Almacenamiento.leer(config.llaveJwt);
    if (!token) throw new Error("Sin token; no se puede conectar Socket.IO.");

    this.socket = io(config.urlSocket, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on("connect", () => this._cambiarEstado("conectado"));
    this.socket.on("disconnect", () => this._cambiarEstado("desconectado"));
    this.socket.io.on("reconnect_attempt", () => this._cambiarEstado("reconectando"));

    this.socket.on("incidente:nuevo", (inc) => {
      this.dispatchEvent(new CustomEvent("incidente:nuevo", { detail: inc }));
    });
    this.socket.on("incidente:actualizado", (inc) => {
      this.dispatchEvent(new CustomEvent("incidente:actualizado", { detail: inc }));
    });
    this.socket.on("bienvenida", (payload) => {
      this.dispatchEvent(new CustomEvent("bienvenida", { detail: payload }));
    });
  }

  desconectar() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this._cambiarEstado("desconectado");
  }
}

export const Transporte = new TransporteRealtime();
