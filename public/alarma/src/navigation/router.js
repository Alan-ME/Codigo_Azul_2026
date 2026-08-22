/**
 * Router mínimo por hash. En React Native se reemplaza por
 * @react-navigation/native con Stack.Screen equivalentes.
 *
 * Cada pantalla recibe una `AbortSignal` (`router.signal`) que se dispara
 * al navegar fuera; los listeners y timers registrados con ese signal se
 * limpian solos.
 */
class Router extends EventTarget {
  constructor() {
    super();
    this.pantallas = new Map();
    this.pantallaActual = null;
    this.paramsActuales = {};
    this._controlador = null;
    this.signal = null;
    window.addEventListener("hashchange", () => this._procesarHash());
  }

  registrar(nombre, montarFn) {
    this.pantallas.set(nombre, montarFn);
  }

  navegar(nombre, params = {}) {
    const hash = "#" + nombre + (Object.keys(params).length ? ("?" + new URLSearchParams(params)) : "");
    if (window.location.hash === hash) {
      this._procesarHash();
    } else {
      window.location.hash = hash;
    }
  }

  reemplazar(nombre, params = {}) {
    const hash = "#" + nombre + (Object.keys(params).length ? ("?" + new URLSearchParams(params)) : "");
    history.replaceState(null, "", hash);
    this._procesarHash();
  }

  iniciar(pantallaInicialSiVacia) {
    if (!window.location.hash) {
      this.reemplazar(pantallaInicialSiVacia);
    } else {
      this._procesarHash();
    }
  }

  _procesarHash() {
    const hash = window.location.hash.slice(1);
    const [nombre, query] = hash.split("?");
    const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
    const montar = this.pantallas.get(nombre);
    if (!montar) return;
    this._controlador?.abort();
    this._controlador = new AbortController();
    this.signal = this._controlador.signal;
    this.pantallaActual = nombre;
    this.paramsActuales = params;
    const contenedor = document.getElementById("app");
    contenedor.innerHTML = "";
    montar(contenedor, params, this.signal);
    this.dispatchEvent(new CustomEvent("cambio", { detail: { nombre, params } }));
  }
}

export const router = new Router();
