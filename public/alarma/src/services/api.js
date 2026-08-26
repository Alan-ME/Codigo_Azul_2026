import { config } from "../config.js";
import { Almacenamiento } from "./almacenamiento.js";

class ErrorApi extends Error {
  constructor(mensaje, estado, cuerpo) {
    super(mensaje);
    this.estado = estado;
    this.cuerpo = cuerpo;
  }
}

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
    sala.camas.push({ id: u.id, nombre: u.cama || `Cama ${u.id}` });
  }
  return Array.from(edificiosMap.values());
}

async function peticion(metodo, ruta, cuerpo, { autenticado = true } = {}) {
  const opciones = {
    method: metodo,
    headers: { "Content-Type": "application/json" },
  };
  if (autenticado) {
    const token = await tomarToken();
    if (token) opciones.headers["Authorization"] = `Bearer ${token}`;
  }
  if (cuerpo !== undefined) opciones.body = JSON.stringify(cuerpo);

  const resp = await fetch(config.baseApi + ruta, opciones);
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

  async activarIncidente(camaId) {
    return peticion("POST", "/incidentes/activar", { camaId });
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

  ErrorApi,
};
