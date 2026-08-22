/* =========================================================
 *  Vista mobile — Simulador interactivo de la App Móvil
 *  dentro de un marco de smartphone conectado en tiempo real.
 * ========================================================= */

(function () {
  const App = window.App;

  function render(cont) {
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Móvil · Simulador Interactivo</div>
          <h1>App Móvil Código Azul (PWA)</h1>
          <p class="tenue" style="margin-top:4px">
            Simulador de la aplicación móvil de guardia y alarma con WebSockets, vibración y audio crítico.
          </p>
        </div>
        <div style="display:flex;gap:8px">
          <a class="btn btn-secundario" href="/alarma" target="_blank" rel="noopener">
            ${App.ui.icono('ojo', 18)} Abrir en pestaña móvil
          </a>
          <button class="btn btn-primario" id="btnRecargarFrame">
            ${App.ui.icono('actualizar', 18)} Reiniciar App
          </button>
        </div>
      </div>

      <div class="mobile-preview-fondo" style="padding:20px 0 40px">
        <div class="phone-frame" style="width:380px;height:740px;background:#111827;border-radius:44px;padding:12px;box-shadow:0 25px 60px rgba(0,0,0,0.4);border:4px solid #374151;margin:0 auto;position:relative">
          <!-- Notch / Isla dinámica superior -->
          <div style="position:absolute;top:20px;left:50%;transform:translateX(-50%);width:110px;height:24px;background:#000;border-radius:14px;z-index:10;display:flex;align-items:center;justify-content:center">
            <div style="width:10px;height:10px;background:#1e293b;border-radius:50%;margin-right:8px"></div>
            <div style="width:8px;height:8px;background:#0284c7;border-radius:50%"></div>
          </div>

          <div class="phone-screen" style="width:100%;height:100%;border-radius:34px;overflow:hidden;background:#0A0F1D;position:relative">
            <iframe id="iframeAppMovil" src="/alarma" style="width:100%;height:100%;border:none;background:#0A0F1D" title="App Móvil Código Azul"></iframe>
          </div>
        </div>
      </div>
    `;

    const btnRecargar = cont.querySelector('#btnRecargarFrame');
    if (btnRecargar) {
      btnRecargar.addEventListener('click', () => {
        const iframe = cont.querySelector('#iframeAppMovil');
        if (iframe) iframe.src = '/alarma';
      });
    }
  }

  App.pages['mobile-preview'] = { titulo: 'App Móvil en Vivo', render };
})();
