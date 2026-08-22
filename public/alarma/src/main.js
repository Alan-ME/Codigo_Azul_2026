import { config } from "./config.js";
import { Auth } from "./context/AuthContext.js";
import { Transporte } from "./services/transporte.js";
import { router } from "./navigation/router.js";
import { montarLogin, pantallaInicial } from "./screens/Login.js";
import { montarPanico } from "./screens/Panico.js";
import { montarSelectorUbicacion } from "./screens/SelectorUbicacion.js";
import { montarReanimadorEspera } from "./screens/ReanimadorEspera.js";
import { montarIncidenteRecibido } from "./screens/IncidenteRecibido.js";

window.__CFG__ = config;

router.registrar("login", montarLogin);
router.registrar("panico", (c, p, s) => guardia("enfermero", () => montarPanico(c, p, s)));
router.registrar("selector-ubicacion", (c, p, s) => guardia("enfermero", () => montarSelectorUbicacion(c, p, s)));
router.registrar("reanimador-espera", (c, p, s) => guardia(["reanimador", "admin"], () => montarReanimadorEspera(c, p, s)));
router.registrar("incidente-recibido", (c, p, s) => guardia(["reanimador", "admin"], () => montarIncidenteRecibido(c, p, s)));

/**
 * Guardia por rol. Reemplaza a un middleware de navigation en RN.
 */
function guardia(rolesPermitidos, montar) {
  if (!Auth.estaAutenticado()) {
    router.reemplazar("login");
    return;
  }
  window.__USUARIO_ID__ = Auth.usuario.id;
  const permitidos = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  if (!permitidos.includes(Auth.usuario.rol)) {
    router.reemplazar(pantallaInicial(Auth.usuario.rol));
    return;
  }
  montar();
}

async function bootstrap() {
  await Auth.cargar();
  if (Auth.estaAutenticado()) {
    try { await Transporte.conectar(); }
    catch (e) { console.warn("[código-azul] socket:", e.message); }
    router.iniciar(pantallaInicial(Auth.usuario.rol));
  } else {
    router.iniciar("login");
  }
}

Auth.addEventListener("cambio", async ({ detail }) => {
  if (detail.token) {
    try { await Transporte.conectar(); }
    catch (e) { console.warn("[código-azul] socket:", e.message); }
  } else {
    Transporte.desconectar();
  }
});

bootstrap();
