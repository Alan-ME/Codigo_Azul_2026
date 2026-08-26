/* =========================================================
 *  Autenticacion hibrida: Backend Real (JWT) + Mock (DEMO).
 *  Si el backend esta en linea, autentica contra PostgreSQL.
 *  Si no, usa los datos mock locales como fallback.
 *  Guarda el usuario activo en memoria + sessionStorage
 *  para que un F5 no te patee al login.
 * ========================================================= */

(function () {
  var App = window.App = window.App || {};

  var CLAVE = App.config.STORAGE_KEYS.sesion;

  function guardar(sesion) {
    try { sessionStorage.setItem(CLAVE, JSON.stringify(sesion)); } catch (e) { /* file:// puede fallar */ }
  }

  function leer() {
    try {
      var raw = sessionStorage.getItem(CLAVE);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  var sesion = leer();

  // ── Mapeo de roles: Backend -> Frontend ────────────────────
  // El backend usa roles como 'MEDICO_ACTIVADOR', 'ADMINISTRADOR', etc.
  // El frontend de Franco usa 'admin' y 'enfermero'.
  var ROL_MAP_BACKEND_TO_FRONT = {
    'ADMINISTRADOR':       'admin',
    'MEDICO_ACTIVADOR':    'enfermero',
    'REANIMADOR_MEDICO':   'enfermero',
    'OPERADOR_GUARDIA':    'admin',
  };

  var ROL_MAP_FRONT_TO_BACKEND = {
    'admin':     'admin@hospital.gob.ar',
    'enfermero': 'medico.activador@hospital.gob.ar',
  };

  /**
   * Inicia sesion. Si el backend esta disponible, autentica contra la API real.
   * Si no, opera en modo mock para la demo.
   * @param {object} params - { usuario, rol, email, password }
   */
  async function ingresar(params) {
    params = params || {};

    // ── Modo Backend Real ──────────────────────────────────
    if (App.config.isBackendOnline() && params.email && params.password) {
      try {
        var result = await App.api.authService.login(params.email, params.password);
        var rolFront = ROL_MAP_BACKEND_TO_FRONT[result.user.rol] || 'enfermero';
        sesion = {
          usuarioId:    result.user.id,
          rol:          rolFront,
          backendUser:  result.user,
          mode:         'online',
        };
        guardar(sesion);
        return sesion;
      } catch (err) {
        throw err;
      }
    }

    // ── Modo Demo Rapido (botones de rol) con Backend ──────
    if (App.config.isBackendOnline() && params.rol) {
      var emailDemo = ROL_MAP_FRONT_TO_BACKEND[params.rol] || 'admin@hospital.gob.ar';
      try {
        var demoResult = await App.api.authService.login(emailDemo, 'Password123!');
        var demoRolFront = params.rol;
        sesion = {
          usuarioId:    demoResult.user.id,
          rol:          demoRolFront,
          backendUser:  demoResult.user,
          mode:         'online',
        };
        guardar(sesion);
        return sesion;
      } catch (err) {
        // Si falla, caer al modo mock
        console.warn('[AUTH] Demo login contra backend fallo, usando mock:', err.message);
      }
    }

    // ── Modo Mock (Offline / file://) ──────────────────────
    var data = App.data;
    var u = null;
    if (params.usuario) {
      u = data.usuarios.find(function (x) { return x.usuario === params.usuario; }) || data.usuarios[0];
    }
    if (!u && params.rol) {
      u = data.usuarios.find(function (x) { return x.rol === params.rol && x.estado === 'activo'; });
    }
    if (!u) u = data.usuarios[0];
    sesion = { usuarioId: u.id, rol: params.rol || u.rol, mode: 'mock' };
    guardar(sesion);
    return sesion;
  }

  function salir() {
    sesion = null;
    App.api.authService.clearSession();
    try { sessionStorage.removeItem(CLAVE); } catch (e) {}
  }

  function usuarioActual() {
    if (!sesion) return null;
    // Si hay un usuario del backend guardado, construir el objeto de UI
    if (sesion.backendUser) {
      var bu = sesion.backendUser;
      return {
        id:       bu.id,
        nombre:   bu.nombre + ' ' + bu.apellido,
        usuario:  bu.email.split('@')[0],
        email:    bu.email,
        rol:      sesion.rol,
        estado:   'activo',
        avatar:   App.data.avatar(bu.nombre + ' ' + bu.apellido),
      };
    }
    // Fallback a datos mock
    return App.data.usuarios.find(function (u) { return u.id === sesion.usuarioId; }) || null;
  }

  function rolActual() { return sesion ? sesion.rol : 'admin'; }

  function rolBackend() {
    if (sesion && sesion.backendUser) return sesion.backendUser.rol;
    return null;
  }

  function cambiarRol(rol) {
    // Cambia al mejor usuario de ese rol (para la demo)
    if (App.config.isBackendOnline()) {
      // En modo online, re-autenticar con el rol seleccionado
      ingresar({ rol: rol }).then(function () {
        // El shell se re-renderiza desde el caller
      }).catch(function (err) {
        console.warn('[AUTH] Error cambiando rol:', err.message);
      });
      return;
    }
    var u = App.data.usuarios.find(function (x) { return x.rol === rol && x.estado === 'activo'; }) || App.data.usuarios[0];
    sesion = { usuarioId: u.id, rol: rol, mode: 'mock' };
    guardar(sesion);
  }

  function estaLogueado() { return !!sesion; }

  function esModoOnline() {
    return sesion && sesion.mode === 'online';
  }

  App.auth = {
    ingresar:        ingresar,
    salir:           salir,
    usuarioActual:   usuarioActual,
    rolActual:       rolActual,
    rolBackend:      rolBackend,
    cambiarRol:      cambiarRol,
    estaLogueado:    estaLogueado,
    esModoOnline:    esModoOnline,
  };
})();
