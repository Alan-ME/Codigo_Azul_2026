import { config } from "./config.js";
import { Auth } from "./context/AuthContext.js";
import { Transporte } from "./services/transporte.js";
import { Sonido } from "./services/sonido.js";
import { Haptica } from "./services/haptica.js";
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

// ─── Banner de desbloqueo del AudioContext ───
// Los navegadores móviles suspenden el audio hasta el primer gesto del
// usuario. Mostramos un banner persistente hasta que se toque, garantizando
// que la sirena vaya a poder sonar cuando llegue una alerta.
const BANNER_ID = "banner-audio";

function mostrarBannerDesbloqueo() {
  if (!Sonido.estaSuspendido()) return;
  if (document.getElementById(BANNER_ID)) return;

  const banner = document.createElement("button");
  banner.id = BANNER_ID;
  banner.type = "button";
  banner.setAttribute("aria-label", "Habilitar alarma sonora");
  banner.textContent = "🔊 Tocá para habilitar la alarma sonora";
  Object.assign(banner.style, {
    position: "fixed",
    insetInlineStart: "0",
    insetInlineEnd: "0",
    top: "0",
    zIndex: "9999",
    padding: "12px 16px",
    background: "#0B5FFF",
    color: "#fff",
    border: "none",
    fontSize: "15px",
    fontWeight: "600",
    letterSpacing: "0.2px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    cursor: "pointer",
    textAlign: "center",
  });

  banner.addEventListener("click", () => {
    Sonido.despertar();
    Haptica.toque();
    banner.remove();
  });

  document.body.appendChild(banner);
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") mostrarBannerDesbloqueo();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mostrarBannerDesbloqueo, { once: true });
} else {
  mostrarBannerDesbloqueo();
}
