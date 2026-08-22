/* =========================================================
 *  Historial completo de notificaciones
 * ========================================================= */

(function () {
  const App = window.App;

  const state = { filtro: 'todas' };

  function render(cont) {
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Cuenta · Notificaciones</div>
          <h1>Notificaciones</h1>
          <p class="tenue" style="margin-top:4px">${App.data.notificaciones.length} notificaciones · ${App.data.notificaciones.filter(n => !n.leida).length} sin leer.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secundario" id="marcarTodas">Marcar todas como leídas</button>
        </div>
      </div>

      <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap" id="chipsN">
        ${['todas','codigo-azul','emergencia','normal','sistema','aviso'].map(f => `
          <button class="chip ${state.filtro === f ? 'activo' : ''}" data-f="${f}">${f}</button>
        `).join('')}
      </div>

      <div class="card" id="listaN" style="padding:0"></div>
    `;

    document.getElementById('chipsN').addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      state.filtro = b.dataset.f;
      render(cont);
    });
    document.getElementById('marcarTodas').addEventListener('click', () => {
      App.data.notificaciones.forEach(n => n.leida = true);
      App.ui.toast({ titulo: 'Notificaciones marcadas como leídas', tipo: 'exito' });
      render(cont);
    });
    pintar();
  }

  function pintar() {
    const lista = App.data.notificaciones.filter(n => state.filtro === 'todas' ? true : n.tipo === state.filtro);
    const el = document.getElementById('listaN');
    if (!lista.length) { el.innerHTML = '<div class="empty"><h3>Sin notificaciones en esta categoría</h3></div>'; return; }
    el.innerHTML = lista.map(n => {
      const iconoMap = { 'codigo-azul': 'alerta', emergencia: 'alerta', normal: 'campana', sistema: 'configuracion', aviso: 'alerta' };
      const colorMap = { 'codigo-azul': '#0047FF', emergencia: '#DC2626', normal: '#F59E0B', sistema: '#0B5FFF', aviso: '#F59E0B' };
      return `
        <div style="display:flex;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid var(--borde);background:${n.leida ? 'transparent' : 'rgba(11, 95, 255, 0.03)'}">
          <div style="width:40px;height:40px;border-radius:12px;display:grid;place-items:center;background:${colorMap[n.tipo]};color:#fff">
            ${App.ui.icono(iconoMap[n.tipo] || 'campana', 20)}
          </div>
          <div style="flex:1">
            <div style="font-weight:${n.leida ? 400 : 600}">${n.texto}</div>
            <div class="tenue" style="font-size:12px">${App.ui.haceCuanto(n.hora)} · ${App.ui.formatearFechaHora(n.hora)}</div>
          </div>
          ${!n.leida ? '<span class="badge b-azul">Nueva</span>' : ''}
        </div>`;
    }).join('');
  }

  App.pages.notificaciones = { titulo: 'Notificaciones', render };
})();
