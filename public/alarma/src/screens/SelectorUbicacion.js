import { h, iconos } from "../components/ui.js";
import { Topbar } from "../components/Topbar.js";
import { Ubicacion } from "../context/UbicacionContext.js";
import { router } from "../navigation/router.js";
import { Haptica } from "../services/haptica.js";
import { toast } from "../components/ui.js";

/**
 * Selector jerárquico Edificio → Piso → Sala → Cama.
 *
 * Se mantiene el estado local por instancia (no en el contexto) para no
 * ensuciarlo con navegación intermedia; recién al elegir cama se persiste
 * en `UbicacionContext.guardarSeleccion`.
 */
export async function montarSelectorUbicacion(contenedor) {
  contenedor.appendChild(Topbar({ titulo: "Ubicación", subtitulo: "Seleccioná dónde ocurre", atras: "panico" }));

  const cuerpo = h("div", { className: "cuerpo" });
  contenedor.appendChild(cuerpo);

  cuerpo.appendChild(h("div", { className: "card", text: "Cargando ubicaciones…" }));

  try {
    if (!Ubicacion.arbol.length) await Ubicacion.cargarArbol();
  } catch (error) {
    cuerpo.innerHTML = "";
    cuerpo.appendChild(h("div", { className: "card" }, [
      h("h3", { text: "No se pudo cargar" }),
      h("p", { className: "msj-error", text: error.message }),
    ]));
    return;
  }

  cuerpo.innerHTML = "";

  const estado = {
    edificio: null,
    piso: null,
    sala: null,
  };

  const contenido = h("div", { className: "selector-hoja" });
  cuerpo.appendChild(contenido);
  render();

  function render() {
    contenido.innerHTML = "";
    contenido.appendChild(migas());

    if (!estado.edificio) return listar("Edificio", Ubicacion.arbol, iconos.edificio, (ed) => { estado.edificio = ed; render(); });
    if (!estado.piso) return listar("Piso", estado.edificio.pisos, iconos.edificio, (p) => { estado.piso = p; render(); });
    if (!estado.sala) return listar("Sala", estado.piso.salas, iconos.ubicacion, (s) => { estado.sala = s; render(); });
    listar("Cama", estado.sala.camas, iconos.cama, (cama) => confirmarCama(cama));
  }

  function listar(nivel, items, icono, alClick) {
    contenido.appendChild(h("div", { className: "titulo-nivel", text: nivel }));
    const lista = h("div", { className: "lista" });
    for (const item of items) {
      lista.appendChild(h("button", {
        className: "item",
        type: "button",
        onClick: () => { Haptica.toque(); alClick(item); },
      }, [
        h("span", { html: icono, style: { color: "var(--azul-primario)" } }),
        h("span", { className: "txt", text: item.nombre }),
        h("span", { className: "flecha", html: iconos.flecha }),
      ]));
    }
    contenido.appendChild(lista);
  }

  function migas() {
    const cont = h("div", { className: "miga" });
    const segmentos = [];
    if (estado.edificio) segmentos.push(estado.edificio.nombre);
    if (estado.piso) segmentos.push(estado.piso.nombre);
    if (estado.sala) segmentos.push(estado.sala.nombre);
    if (!segmentos.length) segmentos.push("Elegí edificio");

    segmentos.forEach((s, i) => {
      if (i > 0) cont.appendChild(h("span", { className: "sep", text: "›" }));
      cont.appendChild(h("span", { className: "seg", text: s }));
    });
    return cont;
  }

  async function confirmarCama(cama) {
    try {
      await Ubicacion.guardarSeleccion(cama.id);
      Haptica.confirmacion();
      toast(`Ubicación fijada: ${cama.nombre}`, { tipo: "exito" });
      router.navegar("panico");
    } catch (error) {
      toast(error.message || "No se pudo fijar la ubicación", { tipo: "error" });
    }
  }
}
