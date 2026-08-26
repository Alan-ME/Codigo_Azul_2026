/* =========================================================
 *  Configuración de tipos y orígenes de llamado
 * ========================================================= */

(function () {
  const App = window.App;

  function render(cont) {
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Gestión · Configuración</div>
          <h1>Formas de llamado</h1>
          <p class="tenue" style="margin-top:4px">Definí desde dónde puede originarse un llamado y qué tipos existen.</p>
        </div>
      </div>

      <div class="grilla-2">
        <div class="card">
          <div class="titulo-card">
            <h3>Orígenes de llamado</h3>
            <div class="acciones"><button class="btn btn-secundario btn-sm" id="nOrigen">${App.ui.icono('mas', 14)} Nuevo</button></div>
          </div>
          <div id="listaOrigenes"></div>
        </div>
        <div class="card">
          <div class="titulo-card">
            <h3>Tipos de llamado</h3>
            <div class="acciones"><button class="btn btn-secundario btn-sm" id="nTipo">${App.ui.icono('mas', 14)} Nuevo</button></div>
          </div>
          <div id="listaTipos"></div>
        </div>
      </div>
    `;
    pintar();
    document.getElementById('nOrigen').addEventListener('click', () => modalOrigen());
    document.getElementById('nTipo').addEventListener('click', () => modalTipo());
  }

  function pintar() {
    document.getElementById('listaOrigenes').innerHTML = App.data.origenesLlamado.map(o => `
      <div class="config-orig-item">
        <div class="icono">${App.ui.icono(o.icono, 18)}</div>
        <div class="info">
          <h4>${o.nombre}</h4>
          <p>${o.descripcion}</p>
        </div>
        <button class="btn btn-fantasma btn-sm" data-o="${o.id}">${App.ui.icono('editar', 14)}</button>
        <button class="btn btn-fantasma btn-sm peligro" data-del-o="${o.id}">${App.ui.icono('basura', 14)}</button>
      </div>`).join('');

    document.getElementById('listaTipos').innerHTML = App.data.tiposLlamado.map(t => `
      <div class="config-orig-item">
        <div class="icono" style="background:${t.color};color:#fff;border-color:transparent">${App.ui.icono('alerta', 18)}</div>
        <div class="info">
          <h4>${t.nombre}</h4>
          <p>Sonido: ${t.sonido} · Tiempo máx: ${t.tiempoMax}</p>
        </div>
        <button class="btn btn-fantasma btn-sm" data-t="${t.id}">${App.ui.icono('editar', 14)}</button>
      </div>`).join('');

    document.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
      modalOrigen(App.data.origenesLlamado.find(o => o.id === b.dataset.o));
    }));
    document.querySelectorAll('[data-del-o]').forEach(b => b.addEventListener('click', async () => {
      const o = App.data.origenesLlamado.find(x => x.id === b.dataset.delO);
      const ok = await App.ui.confirmar({ titulo: 'Eliminar origen', mensaje: `¿Eliminar el origen <strong>${o.nombre}</strong>?`, peligroso: true, textoOk: 'Eliminar' });
      if (!ok) return;
      App.data.origenesLlamado.splice(App.data.origenesLlamado.indexOf(o), 1);
      pintar();
      App.ui.toast({ titulo: 'Origen eliminado', tipo: 'exito' });
    }));
    document.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
      modalTipo(App.data.tiposLlamado.find(t => t.id === b.dataset.t));
    }));
  }

  function modalOrigen(o = null) {
    const edicion = !!o;
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="grid-form">
        <div class="campo full"><label>Nombre</label><input id="o_n" value="${o?.nombre || ''}"></div>
        <div class="campo">
          <label>Icono</label>
          <select id="o_i">
            ${['cama','bath','watch','radio','mic','campana','alerta'].map(i => `<option value="${i}" ${o?.icono === i ? 'selected' : ''}>${i}</option>`).join('')}
          </select>
        </div>
        <div class="campo full"><label>Descripción</label><textarea id="o_d">${o?.descripcion || ''}</textarea></div>
      </div>`;
    const m = App.ui.modal({ titulo: edicion ? 'Editar origen' : 'Nuevo origen', cuerpo,
      pie: `<button class="btn btn-fantasma" data-cerrar>Cancelar</button><button class="btn btn-primario" id="og">Guardar</button>` });
    m.el.querySelector('#og').addEventListener('click', () => {
      const datos = { nombre: m.el.querySelector('#o_n').value, icono: m.el.querySelector('#o_i').value, descripcion: m.el.querySelector('#o_d').value };
      if (edicion) Object.assign(o, datos);
      else App.data.origenesLlamado.push({ id: 'o_' + Date.now(), ...datos });
      m.cerrar(); pintar();
      App.ui.toast({ titulo: 'Cambios guardados', tipo: 'exito' });
    });
  }

  function modalTipo(t = null) {
    const edicion = !!t;
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="grid-form">
        <div class="campo"><label>Nombre</label><input id="t_n" value="${t?.nombre || ''}"></div>
        <div class="campo"><label>Color</label><input id="t_c" type="color" value="${t?.color || '#0B5FFF'}"></div>
        <div class="campo"><label>Sonido de alerta</label>
          <select id="t_s">
            <option ${t?.sonido === 'campanilla.mp3' ? 'selected' : ''}>campanilla.mp3</option>
            <option ${t?.sonido === 'sirena-corta.mp3' ? 'selected' : ''}>sirena-corta.mp3</option>
            <option ${t?.sonido === 'alarma-codazul.mp3' ? 'selected' : ''}>alarma-codazul.mp3</option>
          </select>
        </div>
        <div class="campo"><label>Tiempo máximo de respuesta</label><input id="t_tm" value="${t?.tiempoMax || '10 min'}"></div>
      </div>`;
    const m = App.ui.modal({ titulo: edicion ? 'Editar tipo' : 'Nuevo tipo', cuerpo,
      pie: `<button class="btn btn-fantasma" data-cerrar>Cancelar</button><button class="btn btn-primario" id="tg">Guardar</button>` });
    m.el.querySelector('#tg').addEventListener('click', () => {
      const datos = { nombre: m.el.querySelector('#t_n').value, color: m.el.querySelector('#t_c').value, sonido: m.el.querySelector('#t_s').value, tiempoMax: m.el.querySelector('#t_tm').value };
      if (edicion) Object.assign(t, datos);
      else App.data.tiposLlamado.push({ id: 't_' + Date.now(), ...datos });
      m.cerrar(); pintar();
      App.ui.toast({ titulo: 'Cambios guardados', tipo: 'exito' });
    });
  }

  App.pages.configuracion = { titulo: 'Configuración', render, permite: ['admin'] };
})();
