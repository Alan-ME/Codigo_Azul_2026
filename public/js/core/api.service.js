/* =========================================================
 *  Cliente HTTP unificado para la API REST del Backend Core.
 *  Encapsula fetch() con inyeccion automatica de JWT,
 *  manejo de errores y metodos tipados por recurso.
 * ========================================================= */

(function () {
  var App = window.App = window.App || {};

  var KEYS = App.config.STORAGE_KEYS;
  var BASE = App.config.API_BASE_URL;

  // ── Helpers HTTP ──────────────────────────────────────────

  function getToken() {
    try { return sessionStorage.getItem(KEYS.token) || null; }
    catch (e) { return null; }
  }

  function saveToken(token) {
    try { sessionStorage.setItem(KEYS.token, token); }
    catch (e) { /* file:// puede fallar */ }
  }

  function saveUser(user) {
    try { sessionStorage.setItem(KEYS.user, JSON.stringify(user)); }
    catch (e) {}
  }

  function getUser() {
    try {
      var raw = sessionStorage.getItem(KEYS.user);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(KEYS.token);
      sessionStorage.removeItem(KEYS.user);
      sessionStorage.removeItem(KEYS.sesion);
    } catch (e) {}
  }

  /**
   * Realiza una peticion HTTP autenticada contra la API.
   * @param {string} endpoint - Ruta relativa (ej: '/auth/login').
   * @param {object} options  - { method, body, headers }.
   * @returns {Promise<object>} Respuesta JSON parseada.
   */
  async function request(endpoint, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };

    var token = getToken();
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    var fetchOptions = {
      method:  options.method || 'GET',
      headers: headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    var response = await fetch(BASE + endpoint, fetchOptions);
    var json = await response.json();

    if (!response.ok) {
      var err = new Error(json.message || 'Error del servidor');
      err.status = response.status;
      err.data = json;
      throw err;
    }

    return json;
  }

  // ── Servicio de Autenticacion ─────────────────────────────

  var authService = {
    /**
     * Inicia sesion con credenciales reales contra PostgreSQL.
     * @param {string} email
     * @param {string} password
     * @returns {Promise<{token: string, user: object}>}
     */
    login: async function (email, password) {
      var json = await request('/auth/login', {
        method: 'POST',
        body: { email: email, password: password },
      });
      saveToken(json.data.token);
      saveUser(json.data.user);
      return json.data;
    },

    getMe: function () {
      return request('/auth/me');
    },

    getToken:      getToken,
    getUser:       getUser,
    clearSession:  clearSession,
  };

  // ── Servicio de Incidentes Codigo Azul ────────────────────

  var incidenteService = {
    /**
     * Obtiene el catalogo de ubicaciones hospitalarias.
     * @returns {Promise<Array>}
     */
    listarUbicaciones: function () {
      return request('/incidentes/ubicaciones');
    },

    /**
     * Obtiene los incidentes activos para el panel de guardia.
     * @returns {Promise<Array>}
     */
    listarActivos: function () {
      return request('/incidentes/activos');
    },

    /**
     * Dispara una alerta de Codigo Azul.
     * @param {number} ubicacionId
     * @returns {Promise<object>}
     */
    activar: function (ubicacionId) {
      return request('/incidentes/activar', {
        method: 'POST',
        body: { ubicacionId: ubicacionId },
      });
    },

    /**
     * Confirma asistencia del reanimador (ACK).
     * @param {number} incidenteId
     * @returns {Promise<object>}
     */
    confirmarAck: function (incidenteId) {
      return request('/incidentes/' + incidenteId + '/ack', {
        method: 'PUT',
      });
    },

    /**
     * Cancela un incidente con motivo obligatorio.
     * @param {number} incidenteId
     * @param {string} motivo
     * @returns {Promise<object>}
     */
    cancelar: function (incidenteId, motivo) {
      return request('/incidentes/' + incidenteId + '/cancelar', {
        method: 'POST',
        body: { motivo: motivo },
      });
    },

    /**
     * Obtiene el detalle completo de un incidente con auditoria.
     * @param {number} incidenteId
     * @returns {Promise<object>}
     */
    obtenerDetalle: function (incidenteId) {
      return request('/incidentes/' + incidenteId);
    },
  };

  // ── Deteccion de Conexion con el Backend ──────────────────

  /**
   * Verifica si el backend esta disponible consultando /health.
   * @returns {Promise<boolean>}
   */
  async function detectarBackend() {
    try {
      var res = await fetch(BASE + '/health', { method: 'GET' });
      var json = await res.json();
      var online = res.ok && json.success && json.data.status === 'online';
      App.config.setBackendOnline(online);
      return online;
    } catch (e) {
      App.config.setBackendOnline(false);
      return false;
    }
  }

  // ── Sincronización y Realtime vía WebSockets ──────────────

  var socket = null;

  function normalizarIncidenteParaFront(inc) {
    var ubi = inc.ubicacion || {};
    var ubiTexto = (ubi.sectorSala || 'Sala') + ' - ' + (ubi.cama || 'Cama');
    var actNom = inc.activado_por?.nombre || inc.activadoPor?.nombre || 'Personal Médico';
    var reaNom = inc.reanimador?.nombre || null;

    return {
      id:               'la-bd-' + inc.id,
      backendId:        inc.id,
      codigoUUID:       inc.codigo_uuid || inc.codigoUUID,
      pacienteId:       null,
      pacienteNombre:   'Emergencia en ' + (ubi.cama || 'Cama'),
      tipo:             'codigo-azul',
      origen:           'cama',
      enfermeroId:      null,
      enfermeroNombre:  actNom,
      reanimadorNombre: reaNom,
      ubicacion:        ubi,
      horaInicio:       inc.created_at || inc.creadoEn || new Date().toISOString(),
      estado:           inc.estado || 'ACTIVADO',
      atendido:         inc.estado === 'EN_ATENCION' || inc.estado === 'en-atencion',
    };
  }

  async function sincronizarIncidentes() {
    if (!App.config.isBackendOnline() || !getToken()) return;
    try {
      var res = await incidenteService.listarActivos();
      if (res && res.data && Array.isArray(res.data)) {
        var activosBd = res.data.map(normalizarIncidenteParaFront);
        var mockSinBd = (App.data.llamadosActivos || []).filter(function (x) {
          return !x.backendId;
        });
        App.data.llamadosActivos = activosBd.concat(mockSinBd);
      }
    } catch (e) {
      console.warn('[REALTIME] Error sincronizando activos:', e.message);
    }
  }

  function conectarSockets() {
    if (socket) return;
    var token = getToken();
    if (!token || typeof window.io === 'undefined') return;

    try {
      socket = window.io(window.location.origin, {
        auth: { token: token },
        transports: ['websocket', 'polling'],
      });

      socket.on('connect', function () {
        console.log('[SOCKET-PC] Conectado al Gateway Código Azul en tiempo real');
      });

      socket.on('incidente:nuevo', function (inc) {
        console.log('[SOCKET-PC] 🚨 Nuevo incidente recibido en tiempo real:', inc);
        var itemFront = normalizarIncidenteParaFront(inc);

        // Prepend a los llamados activos
        App.data.llamadosActivos = [itemFront].concat(
          (App.data.llamadosActivos || []).filter(function (x) { return x.backendId !== inc.id; })
        );

        // Notificación Toast
        if (App.ui && App.ui.toast) {
          var lugar = (inc.ubicacion?.sectorSala || 'Sala') + ' · ' + (inc.ubicacion?.cama || 'Cama');
          App.ui.toast({
            titulo: '🚨 ¡CÓDIGO AZUL ACTIVADO!',
            msj: lugar + ' — ' + (inc.activadoPor?.nombre || 'Alerta recibida'),
            tipo: 'error',
          });
        }

        // Re-renderizar si estamos en dashboard o tablero
        var rutaActual = App.router?.parsear?.()?.nombre;
        if (rutaActual === 'dashboard' || rutaActual === 'tablero') {
          App.router.renderRuta();
        }
      });

      socket.on('incidente:actualizado', function (inc) {
        console.log('[SOCKET-PC] Incidente actualizado:', inc);
        var estadoNorm = (inc.estado || '').toUpperCase();
        if (estadoNorm === 'CANCELADO' || estadoNorm === 'RESUELTO') {
          App.data.llamadosActivos = (App.data.llamadosActivos || []).filter(function (x) {
            return x.backendId !== inc.id && x.id !== 'la-bd-' + inc.id;
          });
        } else {
          var item = (App.data.llamadosActivos || []).find(function (x) {
            return x.backendId === inc.id || x.id === 'la-bd-' + inc.id;
          });
          if (item) {
            item.estado = inc.estado;
            item.atendido = inc.estado === 'EN_ATENCION' || inc.estado === 'en-atencion';
            if (inc.reanimador) item.reanimadorNombre = inc.reanimador.nombre;
          }
        }

        var rutaActual = App.router?.parsear?.()?.nombre;
        if (rutaActual === 'dashboard' || rutaActual === 'tablero') {
          App.router.renderRuta();
        }
      });
    } catch (err) {
      console.warn('[SOCKET-PC] Error inicializando sockets:', err.message);
    }
  }

  // ── Exportar ──────────────────────────────────────────────

  App.api = {
    request:               request,
    authService:           authService,
    incidenteService:      incidenteService,
    detectarBackend:       detectarBackend,
    sincronizarIncidentes: sincronizarIncidentes,
    conectarSockets:       conectarSockets,
  };
})();
