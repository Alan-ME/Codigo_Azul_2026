import { h, iconos, formatearHora, toast } from "../components/ui.js";
import { Sonido } from "../services/sonido.js";
import { Notificacion } from "../services/notificacion.js";
import { Api } from "../services/api.js";
import { router } from "../navigation/router.js";
import { Transporte } from "../services/transporte.js";
import { Haptica } from "../services/haptica.js";

/**
 * Pantalla de emergencia recibida (Fase 3 + 4).
 *
 * - Muestra la ubicación destacada: Edificio, Piso, Sala, Cama.
 * - Botón 'Confirmar Asistencia' → PUT /incidentes/:id/ack.
 * - Botón 'Silenciar' para cortar la alarma sin ACK.
 * - Se auto-actualiza si el server retransmite `incidente:actualizado`.
 */
export async function montarIncidenteRecibido(contenedor, params, signal) {
  const idIncidente = params.id;
  if (!idIncidente) {
    router.reemplazar("reanimador-espera");
    return;
  }

  // Asegurar que suena
  Sonido.iniciar().catch(() => {});
  Notificacion.pedirPermiso();

  let incidente = null;
  try {
    const activos = await Api.listarIncidentesActivos();
    incidente = activos.find((i) => i.id === idIncidente);
  } catch {}
  if (!incidente) {
    // Puede que aún no esté sincronizado: mostramos placeholder mientras.
    incidente = { id: idIncidente, ubicacion: null, creadoEn: new Date().toISOString(), disparadoPor: null, acks: [] };
  }

  const pantalla = h("section", { className: "alerta-entrante" });
  contenedor.appendChild(pantalla);

  render();

  const alActualizado = (ev) => {
    if (ev.detail.id !== idIncidente) return;
    incidente = ev.detail;
    render();
  };
  Transporte.addEventListener("incidente:actualizado", alActualizado, { signal });

  // Cuando salimos de la pantalla, detener sonido
  signal.addEventListener("abort", () => Sonido.detener());

  function render() {
    pantalla.innerHTML = "";
    const cabecera = h("div", { className: "cabecera" }, [
      h("span", { html: iconos.alerta.replace("width=\"24\" height=\"24\"", "width=\"36\" height=\"36\"") }),
      h("h1", { className: "titulo-alerta", text: "CÓDIGO AZUL" }),
      h("span", { className: "id-inc", text: incidente.id }),
    ]);

    const u = incidente.ubicacion;
    const ubi = h("div", { className: "ubicacion" }, u ? [
      filaUbi("Edificio", u.edificio.nombre),
      filaUbi("Piso", u.piso.nombre),
      filaUbi("Sala", u.sala.nombre),
      h("div", { className: "fila" }, [
        h("span", { className: "clave", text: "Cama" }),
        h("span", { className: "valor cama", text: u.cama.nombre }),
      ]),
    ] : [h("div", { className: "fila" }, [h("span", { className: "valor", text: "Cargando ubicación…" })])]);

    const meta = h("div", { className: "meta" }, [
      h("span", { text: incidente.disparadoPor ? `Disparó: ${incidente.disparadoPor.nombre}` : "" }),
      h("span", { text: `Hora: ${formatearHora(incidente.creadoEn)}` }),
    ]);

    const yaHizoAck = incidente.acks?.some((a) => a.usuarioId && a.usuarioId === (window.__USUARIO_ID__ || null));
    const cantAcks = incidente.acks?.length || 0;

    const btnAck = h("button", {
      className: "btn btn-ack",
      type: "button",
      disabled: yaHizoAck ? true : null,
      text: yaHizoAck ? `✓ Asistencia confirmada (${cantAcks})` : `CONFIRMAR ASISTENCIA${cantAcks ? ` (${cantAcks})` : ""}`,
    });
    btnAck.addEventListener("click", async () => {
      btnAck.disabled = true;
      btnAck.textContent = "Enviando…";
      try {
        const actualizado = await Api.confirmarAsistencia(incidente.id);
        incidente = actualizado;
        Haptica.confirmacion();
        Sonido.detener();
        toast("Asistencia confirmada", { tipo: "exito" });
        render();
      } catch (error) {
        btnAck.disabled = false;
        btnAck.textContent = "Reintentar";
        toast(error.message || "No se pudo confirmar", { tipo: "error" });
      }
    });

    const btnSilenciar = h("button", {
      className: "btn btn-silenciar",
      type: "button",
      text: "Silenciar alarma sin confirmar",
    });
    btnSilenciar.addEventListener("click", () => {
      Sonido.detener();
      toast("Alarma silenciada — el incidente sigue activo", { tipo: "aviso" });
    });

    const btnVolver = h("button", {
      className: "btn btn-fantasma",
      type: "button",
      style: { color: "rgba(255,255,255,0.7)" },
      text: "Volver a pantalla de guardia",
    });
    btnVolver.addEventListener("click", () => {
      Sonido.detener();
      router.reemplazar("reanimador-espera");
    });

    pantalla.append(cabecera, ubi, meta, h("div", { className: "acciones" }, [btnAck, btnSilenciar, btnVolver]));
  }

  function filaUbi(clave, valor) {
    return h("div", { className: "fila" }, [
      h("span", { className: "clave", text: clave }),
      h("span", { className: "valor", text: valor }),
    ]);
  }
}
