import { h, iconos, toast } from "../components/ui.js";
import { Auth } from "../context/AuthContext.js";
import { router } from "../navigation/router.js";
import { Haptica } from "../services/haptica.js";
import { Api } from "../services/api.js";
import { Sonido } from "../services/sonido.js";

export function montarLogin(contenedor) {
  const usuarioInput = h("input", { type: "text", autocomplete: "username", placeholder: "usuario" });
  const claveInput = h("input", { type: "password", autocomplete: "current-password", placeholder: "••••••" });
  const btnEntrar = h("button", { className: "btn btn-primario btn-bloque", type: "submit", text: "Iniciar sesión" });
  const msjError = h("div", { className: "msj-error" });

  const submit = async (ev) => {
    ev?.preventDefault?.();
    msjError.textContent = "";
    const usuario = usuarioInput.value.trim();
    const clave = claveInput.value;
    if (!usuario || !clave) {
      msjError.textContent = "Completá usuario y clave.";
      return;
    }
    // Aprovechamos el gesto del usuario para desbloquear el AudioContext,
    // crítico para que después el reanimador escuche la alarma.
    Sonido.despertar();
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando…";
    try {
      const usr = await Auth.iniciarSesion(usuario, clave);
      Haptica.confirmacion();
      toast(`Bienvenido/a, ${usr.nombre}`, { tipo: "exito" });
      router.reemplazar(pantallaInicial(usr.rol));
    } catch (error) {
      Haptica.error();
      if (error instanceof Api.ErrorApi && error.estado === 401) {
        msjError.textContent = "Credenciales inválidas.";
      } else {
        msjError.textContent = error.message || "No se pudo iniciar sesión.";
      }
      btnEntrar.disabled = false;
      btnEntrar.textContent = "Iniciar sesión";
    }
  };

  const entrarDemo = (usr) => {
    usuarioInput.value = usr;
    claveInput.value = "azul123";
    submit();
  };

  const form = h("form", { onSubmit: submit, className: "login-tarjeta" }, [
    h("h2", { text: "Ingresar" }),
    h("p", { className: "subtitulo", text: "Personal médico habilitado" }),
    h("div", { className: "campo" }, [
      h("label", { text: "Usuario", for: "usuario" }),
      Object.assign(usuarioInput, { id: "usuario" }),
    ]),
    h("div", { className: "campo" }, [
      h("label", { text: "Clave", for: "clave" }),
      Object.assign(claveInput, { id: "clave" }),
    ]),
    msjError,
    btnEntrar,
    h("div", { className: "demo" }, [
      h("p", { text: "Accesos rápidos DEMO" }),
      h("div", { className: "demo-fila" }, [
        h("button", {
          type: "button",
          className: "btn btn-secundario",
          text: "Enfermero/a",
          onClick: () => entrarDemo("enfermero"),
        }),
        h("button", {
          type: "button",
          className: "btn btn-secundario",
          text: "Reanimador/a",
          onClick: () => entrarDemo("reanimador"),
        }),
      ]),
    ]),
  ]);

  contenedor.appendChild(h("section", { className: "pantalla login" }, [
    h("div", { className: "marca" }, [
      h("div", { className: "logo", html: iconos.corazon }),
      h("div", {}, [
        h("div", { className: "nombre", text: "Código Azul" }),
        h("div", { className: "sub", text: "Alarma médica · Municipalidad de Tucumán" }),
      ]),
    ]),
    form,
    h("div", { className: "pie", text: `v${window.__CFG__?.version || "1.0.0"} · ONETP 2026` }),
  ]));
}

export function pantallaInicial(rol) {
  if (rol === "enfermero") return "panico";
  if (rol === "reanimador" || rol === "admin") return "reanimador-espera";
  return "panico";
}
