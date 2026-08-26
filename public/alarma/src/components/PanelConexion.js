import { h } from "./ui.js";
import { Transporte } from "../services/transporte.js";

export function PanelConexion(signal) {
  const punto = h("span", { className: "estado-conex" });
  const txt = h("span", { text: "Conectando…" });
  const contenedor = h("div", { className: "panel-conexion" }, [punto, txt]);

  const actualizar = (estado) => {
    punto.className = "estado-conex " + (estado === "conectado" ? "" : estado);
    if (estado === "conectado") txt.textContent = "Conectado en tiempo real";
    else if (estado === "reconectando") txt.textContent = "Reintentando conexión…";
    else txt.textContent = "Desconectado";
  };

  actualizar(Transporte.estado);
  Transporte.addEventListener("estado", (e) => actualizar(e.detail), { signal });

  return contenedor;
}
