import { h, iconos } from "./ui.js";
import { Auth } from "../context/AuthContext.js";
import { router } from "../navigation/router.js";

export function Topbar({ titulo, subtitulo, atras = null }) {
  const usuario = Auth.usuario;
  const rol = usuario?.rol || "";

  return h("header", { className: "topbar-movil" }, [
    atras
      ? h("button", {
          className: "salir",
          onClick: () => router.navegar(atras),
          "aria-label": "Volver",
        }, [h("span", { html: iconos.atras })])
      : h("div", { className: "logo", html: iconos.corazon }),

    h("div", {}, [
      h("div", { className: "titulo", text: titulo || "Código Azul" }),
      h("div", { className: "sub", text: subtitulo || "Sistema hospitalario" }),
    ]),

    h("span", { className: `rol ${rol}`, text: rotularRol(rol) }),

    h("button", {
      className: "salir",
      onClick: async () => {
        await Auth.cerrarSesion();
        router.navegar("login");
      },
      "aria-label": "Cerrar sesión",
    }, [h("span", { html: iconos.salir })]),
  ]);
}

function rotularRol(rol) {
  if (rol === "enfermero") return "Enfermero";
  if (rol === "reanimador") return "Reanimador";
  if (rol === "admin") return "Admin";
  return rol;
}
