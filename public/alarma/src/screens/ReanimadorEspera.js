import { h, iconos, formatearHora } from "../components/ui.js";
import { Topbar } from "../components/Topbar.js";
import { PanelConexion } from "../components/PanelConexion.js";
import { Transporte } from "../services/transporte.js";
import { Sonido } from "../services/sonido.js";
import { Notificacion } from "../services/notificacion.js";
import { Haptica } from "../services/haptica.js";
import { Api } from "../services/api.js";
import { router } from "../navigation/router.js";
import { toast } from "../components/ui.js";

/**
 * Pantalla del reanimador (Fases 3 y 4).
 *
 * - Pantalla en espera con historial de incidentes activos.
 * - Cuando llega `incidente:nuevo` por Socket.IO se dispara la pantalla
 *   `IncidenteRecibido` (Alarma sonora + wake lock + notificación push).
 * - El ACK se envía por REST `PUT /incidentes/:id/ack` y el server retransmite
 *   `incidente:actualizado` a todos los conectados.
 */
export async function montarReanimadorEspera(contenedor, _params, signal) {
  contenedor.appendChild(Topbar({ titulo: "Reanimador", subtitulo: "En guardia" }));

  const cuerpo = h("div", { className: "cuerpo" });
  contenedor.appendChild(cuerpo);
  contenedor.appendChild(PanelConexion(signal));

  const espera = h("div", { className: "reanimador-espera" }, [
    h("div", { className: "anillo", html: iconos.corazon.replace("width=\"18\" height=\"18\"", "width=\"64\" height=\"64\"") }),
    h("h3", { text: "Escuchando alarmas" }),
    h("p", { text: "Cuando se dispare un Código Azul, esta pantalla lo va a mostrar con sonido crítico." }),
    h("div", { className: "conex" }, [
      h("span", { className: "punto rojo" }),
      h("span", { text: "Modo alerta activo" }),
    ]),
  ]);
  cuerpo.appendChild(espera);

  const cardHistorial = h("div", { className: "card" }, [
    h("h3", { text: "Incidentes activos" }),
    h("div", { className: "historial", id: "historial" }),
  ]);
  cuerpo.appendChild(cardHistorial);

  const historial = cardHistorial.querySelector("#historial");
  const alDia = new Map();

  const pintarHistorial = () => {
    historial.innerHTML = "";
    const lista = [...alDia.values()].sort((a, b) => (b.creadoEn || "").localeCompare(a.creadoEn || ""));
    if (!lista.length) {
      historial.appendChild(h("div", { style: { padding: "16px", color: "var(--texto-tenue)", fontSize: "13px" },
        text: "Sin incidentes activos por el momento." }));
      return;
    }
    for (const inc of lista) {
      const badge = inc.estado === "en-atencion"
        ? h("span", { className: "badge verde", text: "En atención" })
        : h("span", { className: "badge rojo", text: "Activo" });
      historial.appendChild(h("div", { className: "item-inc" }, [
        h("div", { className: "datos" }, [
          h("div", { className: "cama", text: `${inc.ubicacion.sala.nombre} · ${inc.ubicacion.cama.nombre}` }),
          h("div", { className: "lugar", text: `${inc.ubicacion.edificio.nombre} · ${inc.ubicacion.piso.nombre}` }),
        ]),
        h("div", { className: "hora", text: formatearHora(inc.creadoEn) }),
        h("div", { className: "estado" }, [badge]),
      ]));
    }
  };

  // Cargar activos existentes
  try {
    const activos = await Api.listarIncidentesActivos();
    for (const inc of activos) alDia.set(inc.id, inc);
    pintarHistorial();
  } catch {
    pintarHistorial();
  }

  // Asegurar conexión
  try {
    await Transporte.conectar();
  } catch (e) {
    toast(e.message || "No se pudo conectar Socket.IO", { tipo: "error" });
  }

  const alNuevo = (ev) => {
    const inc = ev.detail;
    alDia.set(inc.id, inc);
    pintarHistorial();
    disparadorLocal(inc);
  };
  const alActualizado = (ev) => {
    const inc = ev.detail;
    alDia.set(inc.id, inc);
    pintarHistorial();
  };

  Transporte.addEventListener("incidente:nuevo", alNuevo, { signal });
  Transporte.addEventListener("incidente:actualizado", alActualizado, { signal });

  function disparadorLocal(inc) {
    Sonido.iniciar().catch(() => {});
    Haptica.alarma();
    Notificacion.mostrar("CÓDIGO AZUL", {
      body: `${inc.ubicacion.edificio.nombre} · ${inc.ubicacion.sala.nombre} · ${inc.ubicacion.cama.nombre}`,
      tag: inc.id,
    });
    router.navegar("incidente-recibido", { id: inc.id });
  }
}
