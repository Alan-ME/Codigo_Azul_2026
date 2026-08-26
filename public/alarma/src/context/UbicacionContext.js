import { config } from "../config.js";
import { Api } from "../services/api.js";
import { Almacenamiento } from "../services/almacenamiento.js";

class ContextoUbicacion extends EventTarget {
  constructor() {
    super();
    this.arbol = [];
    this.seleccion = null; // { edificio, piso, sala, cama }
  }

  async cargarArbol() {
    this.arbol = await Api.listarUbicaciones();
    this.dispatchEvent(new CustomEvent("arbol"));
    return this.arbol;
  }

  async recuperarSeleccionGuardada() {
    const guardada = await Almacenamiento.leer(config.llaveUltimaUbicacion);
    if (!guardada) return null;
    if (!this.arbol.length) await this.cargarArbol();
    const resuelta = this._resolver(guardada);
    if (resuelta) {
      this.seleccion = resuelta;
      this._emitir();
    }
    return this.seleccion;
  }

  async guardarSeleccion(camaId) {
    if (!this.arbol.length) await this.cargarArbol();
    const resuelta = this._resolver({ camaId });
    if (!resuelta) throw new Error("Cama no encontrada.");
    this.seleccion = resuelta;
    await Almacenamiento.guardar(config.llaveUltimaUbicacion, { camaId });
    this._emitir();
    return this.seleccion;
  }

  limpiarSeleccion() {
    this.seleccion = null;
    Almacenamiento.borrar(config.llaveUltimaUbicacion);
    this._emitir();
  }

  _resolver({ camaId }) {
    if (!camaId) return null;
    for (const edificio of this.arbol) {
      for (const piso of edificio.pisos) {
        for (const sala of piso.salas) {
          const cama = sala.camas.find((c) => c.id === camaId);
          if (cama) {
            return {
              edificio: { id: edificio.id, nombre: edificio.nombre },
              piso: { id: piso.id, nombre: piso.nombre },
              sala: { id: sala.id, nombre: sala.nombre },
              cama: { id: cama.id, nombre: cama.nombre },
            };
          }
        }
      }
    }
    return null;
  }

  _emitir() {
    this.dispatchEvent(new CustomEvent("seleccion", { detail: this.seleccion }));
  }
}

export const Ubicacion = new ContextoUbicacion();
