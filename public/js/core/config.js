/* =========================================================
 *  Configuracion central del cliente frontend.
 *  Define la URL base de la API, claves de almacenamiento
 *  y estado de conexion con el backend.
 * ========================================================= */

(function () {
  var App = window.App = window.App || {};

  var API_BASE_URL = '/api/v1';

  var STORAGE_KEYS = {
    token:   'codigoAzul.token',
    user:    'codigoAzul.user',
    sesion:  'codigoAzul.sesion',
  };

  // Estado de conexion con el backend (se detecta en el arranque)
  var backendOnline = false;

  function setBackendOnline(value) {
    backendOnline = !!value;
  }

  function isBackendOnline() {
    return backendOnline;
  }

  App.config = {
    API_BASE_URL:     API_BASE_URL,
    STORAGE_KEYS:     STORAGE_KEYS,
    setBackendOnline: setBackendOnline,
    isBackendOnline:  isBackendOnline,
  };
})();
