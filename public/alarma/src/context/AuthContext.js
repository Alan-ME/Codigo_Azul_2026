import { config } from "../config.js";
import { Api } from "../services/api.js";
import { Almacenamiento } from "../services/almacenamiento.js";
import { Notificacion } from "../services/notificacion.js";

/**
 * Contexto de autenticación. En React Native este archivo se convierte
 * en un `AuthProvider` con `useContext`; acá lo exponemos como singleton
 * observable a través de EventTarget.
 */
class ContextoAuth extends EventTarget {
  constructor() {
    super();
    this.usuario = null;
    this.token = null;
    this.inicializado = false;
  }

  async cargar() {
    this.token = await Almacenamiento.leer(config.llaveJwt);
    this.usuario = await Almacenamiento.leer(config.llaveUsuario);
    this.inicializado = true;
    this._emitir();
  }

  async iniciarSesion(usuario, clave) {
    const respuesta = await Api.login(usuario, clave);
    this.token = respuesta.token;
    this.usuario = respuesta.usuario;
    await Almacenamiento.guardar(config.llaveJwt, this.token);
    await Almacenamiento.guardar(config.llaveUsuario, this.usuario);
    await this._registrarTokenPush();
    this._emitir();
    return this.usuario;
  }

  async cerrarSesion() {
    this.token = null;
    this.usuario = null;
    await Almacenamiento.borrar(config.llaveJwt);
    await Almacenamiento.borrar(config.llaveUsuario);
    this._emitir();
  }

  async _registrarTokenPush() {
    try {
      const permiso = await Notificacion.pedirPermiso();
      if (permiso !== "granted") return;
      const tokenPush = await Notificacion.obtenerTokenSimulado();
      await Api.registrarTokenFcm(tokenPush);
    } catch {
      // El error de registro no debe bloquear el login.
    }
  }

  estaAutenticado() {
    return Boolean(this.token && this.usuario);
  }

  _emitir() {
    this.dispatchEvent(new CustomEvent("cambio", {
      detail: { usuario: this.usuario, token: this.token },
    }));
  }
}

export const Auth = new ContextoAuth();
