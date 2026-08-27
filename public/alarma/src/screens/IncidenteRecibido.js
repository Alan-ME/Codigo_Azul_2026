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

  // Asegurar que suena y vibra hasta que el reanimador confirme o silencie.
  Sonido.iniciar().catch(() => {});
  Haptica.iniciarAlarma();
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

  // Cuando salimos de la pantalla, detener sonido y vibración.
  signal.addEventListener("abort", () => {
    Sonido.detener();
    Haptica.detenerAlarma();
  });

  function render() {
    pantalla.innerHTML = "";
    const cabecera = h("div", { className: "cabecera" }, [
      h("span", { html: iconos.alerta.replace("width=\"24\" height=\"24\"", "width=\"36\" height=\"36\"") }),
      h("h1", { className: "titulo-alerta", text: "CÓDIGO AZUL" }),
      h("span", { className: "id-inc", text: incidente.id }),
    ]);

    const u = incidente.ubicacion;
    const edNombre = typeof u?.edificio === 'object' ? u?.edificio?.nombre : (u?.edificio || '—');
    const piNombre = typeof u?.piso === 'object' ? u?.piso?.nombre : (u?.piso !== undefined ? `Piso ${u.piso}` : '—');
    const saNombre = typeof u?.sala === 'object' ? u?.sala?.nombre : (u?.sectorSala || u?.sector_sala || '—');
    const caNombre = typeof u?.cama === 'object' ? u?.cama?.nombre : (u?.cama || '—');
    const tieneCarro = u?.tieneCarroParo ?? u?.tiene_carro_paro ?? false;

    const ubi = h("div", { className: "ubicacion" }, u ? [
      filaUbi("Edificio", edNombre),
      filaUbi("Piso", piNombre),
      filaUbi("Sala", saNombre),
      h("div", { className: "fila" }, [
        h("span", { className: "clave", text: "Cama" }),
        h("span", { className: "valor cama", text: caNombre }),
      ]),
      h("div", {
        className: `fila badge-carro-movil ${tieneCarro ? "carro-ok" : "carro-falta"}`,
        style: {
          marginTop: "8px",
          padding: "8px 10px",
          borderRadius: "8px",
          fontSize: "0.85rem",
          background: tieneCarro ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.25)",
          border: tieneCarro ? "1px solid rgba(34, 197, 94, 0.5)" : "1px solid rgba(239, 68, 68, 0.6)",
          color: tieneCarro ? "#86efac" : "#fca5a5",
          fontWeight: "600",
        },
        text: tieneCarro
          ? "🟢 Carro de Paro / AED disponible en sala"
          : "⚠️ Sala SIN Carro de Paro — LLEVAR DEA MÓVIL",
      }),
    ] : [h("div", { className: "fila" }, [h("span", { className: "valor", text: "Cargando ubicación…" })])]);

    const meta = h("div", { className: "meta" }, [
      h("span", { text: incidente.disparadoPor ? `Disparó: ${incidente.disparadoPor.nombre || incidente.disparadoPor}` : (incidente.activadoPor?.nombre ? `Disparó: ${incidente.activadoPor.nombre}` : "") }),
      h("span", { text: `Hora: ${formatearHora(incidente.creadoEn || incidente.createdAt)}` }),
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
        Haptica.detenerAlarma();
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
      Haptica.detenerAlarma();
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
      Haptica.detenerAlarma();
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
