import { h, iconos, toast } from "../components/ui.js";
import { Topbar } from "../components/Topbar.js";
import { PanelConexion } from "../components/PanelConexion.js";
import { Ubicacion } from "../context/UbicacionContext.js";
import { router } from "../navigation/router.js";
import { Haptica } from "../services/haptica.js";
import { Api } from "../services/api.js";

const DURACION_HOLD_MS = 800;

/**
 * Pantalla Botón de Pánico (Fase 2).
 *
 * Requisitos cubiertos:
 *   - Botón circular prominente rojo (CSS: .panico-boton).
 *   - Vibración háptica al presionar y confirmar.
 *   - Confirmación visual inmediata: aro de progreso al mantener presionado.
 *   - Prevención de pulsación accidental: hold de 800 ms + modal de
 *     confirmación con la ubicación destino y botón cancelar.
 *   - Selector jerárquico cama/sala (SelectorUbicacion).
 *   - Disparo REST: POST /api/v1/incidentes/activar { camaId }.
 */
export async function montarPanico(contenedor, _params, signal) {
  contenedor.appendChild(Topbar({ titulo: "Código Azul", subtitulo: "Disparo de alarma" }));

  const envoltorio = h("div", { className: "panico-envoltorio" });
  contenedor.appendChild(envoltorio);
  contenedor.appendChild(PanelConexion(signal));

  // Recuperar selección persistida
  if (!Ubicacion.seleccion) {
    try {
      if (!Ubicacion.arbol.length) await Ubicacion.cargarArbol();
      await Ubicacion.recuperarSeleccionGuardada();
    } catch {
      // Si falla la carga silenciamos: el usuario podrá elegir manualmente.
    }
  }

  const cardUbicacion = h("button", {
    className: "ubicacion-actual",
    type: "button",
    onClick: () => router.navegar("selector-ubicacion"),
  });
  envoltorio.appendChild(cardUbicacion);

  const boton = h("button", {
    className: "panico-boton",
    type: "button",
    "aria-label": "Botón de Código Azul (mantené 0,8 s)",
    html: `
      <svg class="aro-progreso" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <circle cx="120" cy="120" r="115"/>
      </svg>
      <div class="contenido">
        <div class="rotulo">CÓDIGO AZUL</div>
        <div class="icono">${iconos.corazon}</div>
        <div class="instruccion">Mantené presionado</div>
      </div>
    `,
  });
  envoltorio.appendChild(boton);

  envoltorio.appendChild(h("p", { className: "indicacion-hold", html:
    `Mantené presionado el botón durante <strong>0,8 s</strong> para prevenir disparos accidentales.` }));

  const renderUbicacion = () => {
    cardUbicacion.innerHTML = "";
    const sel = Ubicacion.seleccion;
    cardUbicacion.append(
      h("div", { className: "rotulo", text: "Ubicación de disparo" }),
      sel
        ? h("div", { className: "valor", text: `${sel.edificio.nombre} · ${sel.piso.nombre} · ${sel.sala.nombre} · ${sel.cama.nombre}` })
        : h("div", { className: "valor vacio", text: "Sin ubicación seleccionada — tocá para elegir" }),
    );
  };
  renderUbicacion();
  Ubicacion.addEventListener("seleccion", renderUbicacion, { signal });

  // Lógica de hold-to-fire
  const estado = { armado: false, temporizador: null };

  const iniciarHold = (ev) => {
    ev.preventDefault();
    if (!Ubicacion.seleccion) {
      Haptica.error();
      toast("Elegí primero la ubicación de la cama.", { tipo: "aviso" });
      return;
    }
    Haptica.toque();
    boton.classList.add("armando");
    estado.temporizador = setTimeout(() => {
      estado.armado = true;
      cancelarHold();
      abrirConfirmacion();
    }, DURACION_HOLD_MS);
  };

  const cancelarHold = () => {
    clearTimeout(estado.temporizador);
    estado.temporizador = null;
    boton.classList.remove("armando");
  };

  boton.addEventListener("pointerdown", iniciarHold, { signal });
  boton.addEventListener("pointerup", cancelarHold, { signal });
  boton.addEventListener("pointerleave", cancelarHold, { signal });
  boton.addEventListener("pointercancel", cancelarHold, { signal });

  function abrirConfirmacion() {
    Haptica.confirmacion();
    const sel = Ubicacion.seleccion;
    const fondo = h("div", { className: "modal-confirm-fondo" });
    const modal = h("div", { className: "modal-confirm" });

    const btnCancelar = h("button", { className: "btn btn-secundario", type: "button", text: "Cancelar" });
    const btnDisparar = h("button", { className: "btn btn-peligro", type: "button", text: "Disparar Código Azul" });

    modal.append(
      h("div", { className: "icono", html: iconos.alerta }),
      h("h3", { text: "Confirmar disparo" }),
      h("p", { className: "subtitulo", style: { textAlign: "center", color: "var(--texto-suave)" },
               text: "Vas a activar un CÓDIGO AZUL en:" }),
      h("div", { className: "info" }, [
        h("div", { className: "fila" }, [
          h("span", { className: "clave", text: "Edificio" }),
          h("span", { className: "valor", text: sel.edificio.nombre }),
        ]),
        h("div", { className: "fila" }, [
          h("span", { className: "clave", text: "Piso" }),
          h("span", { className: "valor", text: sel.piso.nombre }),
        ]),
        h("div", { className: "fila" }, [
          h("span", { className: "clave", text: "Sala" }),
          h("span", { className: "valor", text: sel.sala.nombre }),
        ]),
        h("div", { className: "fila" }, [
          h("span", { className: "clave", text: "Cama" }),
          h("span", { className: "valor", text: sel.cama.nombre }),
        ]),
      ]),
      h("div", { className: "botones" }, [btnCancelar, btnDisparar]),
    );
    fondo.appendChild(modal);
    document.body.appendChild(fondo);

    const cerrar = () => fondo.remove();
    btnCancelar.addEventListener("click", cerrar);
    fondo.addEventListener("click", (e) => { if (e.target === fondo) cerrar(); });

    btnDisparar.addEventListener("click", async () => {
      btnDisparar.disabled = true;
      btnDisparar.textContent = "Enviando…";
      try {
        const inc = await Api.activarIncidente(sel.cama.id);
        cerrar();
        if (inc.esOffline) {
          Haptica.error();
          toast("⚠️ Sin conexión Wi-Fi. Alarma encolada localmente: se reintenta automáticamente hasta conectar.", {
            tipo: "aviso",
            titulo: "MODO FUERA DE LÍNEA (Zona Muerta)",
          });
        } else {
          Haptica.alarma();
          toast(`Alarma enviada · #${inc.id}`, { tipo: "exito", titulo: "CÓDIGO AZUL activo" });
        }
      } catch (error) {
        Haptica.error();
        btnDisparar.disabled = false;
        btnDisparar.textContent = "Reintentar";
        toast(error.message || "No se pudo disparar", { tipo: "error" });
      }
    });
  }

  // Notificar cuando una alarma previamente encolada por falta de señal se entregó con éxito
  const alDespacharOffline = (ev) => {
    Haptica.confirmacion();
    toast(`Alarma pendiente entregada con éxito tras reconexión (#${ev.detail?.id || 'OK'})`, {
      tipo: "exito",
      titulo: "RECONEXIÓN EXITOSA",
    });
  };
  window.addEventListener("codigo_azul:alerta_despachada_offline", alDespacharOffline, { signal });
}

