import { config } from "../config.js";
import { Almacenamiento } from "./almacenamiento.js";

class ErrorApi extends Error {
  constructor(mensaje, estado, cuerpo) {
    super(mensaje);
    this.estado = estado;
    this.cuerpo = cuerpo;
  }
}

const CLAVE_COLA_OFFLINE = "codigo_azul_cola_offline";
let workerReintentoActivo = false;

async function tomarToken() {
  return Almacenamiento.leer(config.llaveJwt);
}

function transformarAUbicacionesJerarquicas(lista) {
  if (!Array.isArray(lista)) return [];
  if (lista.length > 0 && lista[0].pisos) return lista;

  const edificiosMap = new Map();
  for (const u of lista) {
    const edNombre = u.edificio || 'Edificio Central';
    let ed = edificiosMap.get(edNombre);
    if (!ed) {
      ed = { id: `ed-${edNombre}`, nombre: edNombre, pisos: [] };
      edificiosMap.set(edNombre, ed);
    }
    const pisoNombre = u.piso || 'Piso 1';
    let piso = ed.pisos.find((p) => p.nombre === pisoNombre);
    if (!piso) {
      piso = { id: `piso-${edNombre}-${pisoNombre}`, nombre: pisoNombre, salas: [] };
      ed.pisos.push(piso);
    }
    const salaNombre = u.sector_sala || u.sectorSala || 'General';
    let sala = piso.salas.find((s) => s.nombre === salaNombre);
    if (!sala) {
      sala = { id: `sala-${salaNombre}`, nombre: salaNombre, camas: [] };
      piso.salas.push(sala);
    }
    sala.camas.push({
      id: u.id,
      nombre: u.cama || `Cama ${u.id}`,
      tieneCarroParo: u.tiene_carro_paro ?? u.tieneCarroParo ?? false,
    });
  }
  return Array.from(edificiosMap.values());
}

async function peticion(metodo, ruta, cuerpo, { autenticado = true, timeoutMs = 5000 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const opciones = {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    signal: controller.signal,
  };
  if (autenticado) {
    const token = await tomarToken();
    if (token) opciones.headers["Authorization"] = `Bearer ${token}`;
  }
  if (cuerpo !== undefined) opciones.body = JSON.stringify(cuerpo);

  let resp;
  try {
    resp = await fetch(config.baseApi + ruta, opciones);
  } catch (err) {
    clearTimeout(timeoutId);
    throw new ErrorApi(
      err.name === "AbortError"
        ? "Tiempo de espera agotado al conectar con el servidor."
        : "Sin conexión con el servidor (Modo Fuera de Línea).",
      0,
      { errorDeRed: true, original: err.message }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const texto = await resp.text();
  const json = texto ? JSON.parse(texto) : null;

  if (!resp.ok) {
    const mensaje = json?.message || json?.error || `Error HTTP ${resp.status}`;
    throw new ErrorApi(mensaje, resp.status, json);
  }

  // Desempaquetar ApiResponse estándar { success, data, message }
  const datos = (json && json.data !== undefined) ? json.data : json;
  return datos;
}

// ─── Cola Offline / Outbox Pattern para Zonas Muertas ────────
export const ColaOffline = {
  obtener() {
    try {
      const raw = localStorage.getItem(CLAVE_COLA_OFFLINE);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  guardar(cola) {
    try {
      localStorage.setItem(CLAVE_COLA_OFFLINE, JSON.stringify(cola));
    } catch {}
  },

  encolarAlarma(camaId) {
    const cola = this.obtener();
    const item = {
      idTemporal: `off-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      camaId,
      timestamp: new Date().toISOString(),
      intentos: 0,
    };
    cola.push(item);
    this.guardar(cola);
    this.iniciarReintentos();
    window.dispatchEvent(new CustomEvent("codigo_azul:cola_actualizada", { detail: { cantidad: cola.length } }));
    return item;
  },

  eliminar(idTemporal) {
    let cola = this.obtener();
    cola = cola.filter((it) => it.idTemporal !== idTemporal);
    this.guardar(cola);
    window.dispatchEvent(new CustomEvent("codigo_azul:cola_actualizada", { detail: { cantidad: cola.length } }));
  },

  async procesar() {
    const cola = this.obtener();
    if (cola.length === 0) return;

    for (const item of [...cola]) {
      try {
        item.intentos = (item.intentos || 0) + 1;
        const res = await peticion("POST", "/incidentes/activar", { camaId: item.camaId });
        this.eliminar(item.idTemporal);
        window.dispatchEvent(new CustomEvent("codigo_azul:alerta_despachada_offline", { detail: res }));
      } catch (err) {
        // Si no hay red o timeout, continuar en la cola
        if (err.estado === 0) break;
        // Si el servidor responde 409 (ya estaba activa por idempotencia), se considera exitosa
        if (err.estado === 409 || err.estado === 200) {
          this.eliminar(item.idTemporal);
        }
      }
    }
  },

  iniciarReintentos() {
    if (workerReintentoActivo) return;
    workerReintentoActivo = true;

    const tick = async () => {
      const cola = this.obtener();
      if (cola.length === 0) {
        workerReintentoActivo = false;
        return;
      }
      await this.procesar();
      if (this.obtener().length > 0) {
        setTimeout(tick, 3000);
      } else {
        workerReintentoActivo = false;
      }
    };

    setTimeout(tick, 1000);
  },
};

// Escuchar evento online del navegador para vaciar la cola inmediatamente
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    console.log("[OFFLINE] Conectividad recuperada. Vaciando cola de emergencias...");
    ColaOffline.procesar();
  });
}

export const Api = {
  async login(usuario, clave) {
    const data = await peticion("POST", "/auth/login", { usuario, clave }, { autenticado: false });
    const user = data.user || data.usuario || {};
    // Mapeo de roles de BD hacia cliente móvil
    let rolFront = (user.rol || 'enfermero').toLowerCase();
    if (user.rol === 'MEDICO_ACTIVADOR') rolFront = 'enfermero';
    if (user.rol === 'REANIMADOR_MEDICO') rolFront = 'reanimador';
    if (user.rol === 'OPERADOR_GUARDIA' || user.rol === 'ADMINISTRADOR') rolFront = 'admin';

    const usuarioNormalizado = {
      id:     user.id,
      nombre: user.nombre ? `${user.nombre} ${user.apellido || ''}`.trim() : 'Personal de Salud',
      rol:    rolFront,
      email:  user.email,
    };

    return {
      token:   data.token,
      usuario: usuarioNormalizado,
    };
  },

  async listarUbicaciones() {
    const flatList = await peticion("GET", "/incidentes/ubicaciones");
    return transformarAUbicacionesJerarquicas(flatList);
  },

  /**
   * Disparo de emergencia con tolerancia a fallos offline.
   * Si no hay conexión Wi-Fi, encola la alarma localmente y reintenta con backoff.
   */
  async activarIncidente(camaId) {
    try {
      return await peticion("POST", "/incidentes/activar", { camaId });
    } catch (err) {
      if (err.estado === 0) {
        // Falla de red: encolar y asegurar que el despacho ocurra en cuanto haya señal
        const itemOffline = ColaOffline.encolarAlarma(camaId);
        return {
          id: itemOffline.idTemporal,
          estado: "PENDIENTE_OFFLINE",
          esOffline: true,
          mensaje: "Alarma registrada en cola local. Despachando automáticamente al conectar...",
        };
      }
      throw err;
    }
  },

  async confirmarAsistencia(incidenteId) {
    return peticion("PUT", `/incidentes/${incidenteId}/ack`);
  },

  async listarIncidentesActivos() {
    const resp = await peticion("GET", "/incidentes/activos");
    return Array.isArray(resp) ? resp : (resp?.incidentes || []);
  },

  async registrarTokenFcm(token) {
    return peticion("POST", "/fcm/token", { token, plataforma: "ANDROID" });
  },

  async desregistrarTokenFcm(token) {
    return peticion("DELETE", "/fcm/token", { token });
  },

  ColaOffline,
  ErrorApi,
};

