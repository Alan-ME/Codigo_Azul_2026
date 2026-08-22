/* =========================================================
 *  Áreas / zonas del hospital
 * ========================================================= */

(function () {
  const App = window.App;

  function render(cont, { params }) {
    if (params[0] === 'detalle' && params[1]) return renderDetalle(cont, params[1]);

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Gestión · Áreas</div>
          <h1>Áreas del hospital</h1>
          <p class="tenue" style="margin-top:4px">${App.data.areas.length} áreas registradas. Hacé clic en una para ver su detalle.</p>
        </div>
        <button class="btn btn-primario" id="btnNuevo">${App.ui.icono('mas', 16)} Nueva área</button>
      </div>

      <div class="grilla-areas" id="grillaA"></div>
    `;
    document.getElementById('btnNuevo').addEventListener('click', () => modalArea());
    pintar();
  }

  function pintar() {
    const cont = document.getElementById('grillaA');
    cont.innerHTML = App.data.areas.map(a => {
      const enfermerosArea = App.data.usuarios.filter(u => u.rol === 'enfermero' && u.areaId === a.id && u.estado === 'activo').length;
      const activos = App.data.llamadosActivos.filter(l => {
        const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
        return p && p.areaId === a.id;
      }).length;
      return `
        <article class="tarjeta-area" style="border-top-color:${a.color}" data-id="${a.id}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span class="color-swatch" style="background:${a.color}"></span>
            <h3>${a.nombre}</h3>
            <span class="badge b-gris" style="margin-left:auto">${a.abrev}</span>
          </div>
          <p class="desc">${a.descripcion}</p>
          <div class="stats">
            <div class="stat"><span class="n">${a.habitaciones}</span><span class="l">Habitaciones</span></div>
            <div class="stat"><span class="n">${a.camasOcupadas}/${a.camasTotales}</span><span class="l">Camas ocup.</span></div>
            <div class="stat"><span class="n">${enfermerosArea}</span><span class="l">Enfermeros</span></div>
            <div class="stat"><span class="n" style="color:${activos > 0 ? 'var(--rojo-emergencia)' : 'var(--texto)'}">${activos}</span><span class="l">Llamados act.</span></div>
          </div>
          <div class="footer-area">
            <span>Responsable: ${a.responsable}</span>
            <button class="btn btn-fantasma btn-sm" data-editar="${a.id}">${App.ui.icono('editar', 14)}</button>
          </div>
        </article>`;
    }).join('');
    cont.querySelectorAll('.tarjeta-area').forEach(t => {
      t.addEventListener('click', (e) => {
        if (e.target.closest('[data-editar]')) {
          const a = App.data.areas.find(x => x.id === e.target.closest('[data-editar]').dataset.editar);
          modalArea(a);
          return;
        }
        App.router.navegar('#/areas/detalle/' + t.dataset.id);
      });
    });
  }

  function modalArea(a = null) {
    const edicion = !!a;
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="grid-form">
        <div class="campo full">
          <label>Nombre<span class="obligatorio">*</span></label>
          <input id="a_nom" value="${a?.nombre || ''}">
        </div>
        <div class="campo">
          <label>Abreviatura</label>
          <input id="a_abr" value="${a?.abrev || ''}" placeholder="Ej: UTI">
        </div>
        <div class="campo">
          <label>Color de identificación</label>
          <input id="a_col" type="color" value="${a?.color || '#0B5FFF'}">
        </div>
        <div class="campo full">
          <label>Descripción</label>
          <textarea id="a_desc">${a?.descripcion || ''}</textarea>
        </div>
        <div class="campo">
          <label>Habitaciones</label>
          <input id="a_hab" type="number" min="0" value="${a?.habitaciones || 0}">
        </div>
        <div class="campo">
          <label>Camas totales</label>
          <input id="a_camas" type="number" min="0" value="${a?.camasTotales || 0}">
        </div>
        <div class="campo full">
          <label>Responsable</label>
          <input id="a_resp" value="${a?.responsable || ''}">
        </div>
      </div>`;
    const m = App.ui.modal({
      titulo: (edicion ? 'Editar ' : 'Nueva ') + 'área',
      cuerpo,
      pie: `
        <button class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario" id="ag">${edicion ? 'Guardar' : 'Crear área'}</button>`,
    });
    m.el.querySelector('#ag').addEventListener('click', () => {
      const datos = {
        nombre: m.el.querySelector('#a_nom').value.trim(),
        abrev: m.el.querySelector('#a_abr').value.trim().toUpperCase(),
        color: m.el.querySelector('#a_col').value,
        descripcion: m.el.querySelector('#a_desc').value,
        habitaciones: +m.el.querySelector('#a_hab').value,
        camasTotales: +m.el.querySelector('#a_camas').value,
        responsable: m.el.querySelector('#a_resp').value,
      };
      if (!datos.nombre) { App.ui.toast({ titulo: 'Falta el nombre', tipo: 'error' }); return; }
      if (edicion) Object.assign(a, datos);
      else App.data.areas.push({ id: 'a_' + Date.now(), camasOcupadas: 0, ...datos });
      App.ui.toast({ titulo: edicion ? 'Área actualizada' : 'Área creada', tipo: 'exito' });
      m.cerrar();
      pintar();
    });
  }

  function renderDetalle(cont, id) {
    const a = App.data.areas.find(x => x.id === id);
    if (!a) { cont.innerHTML = '<div class="empty"><h3>Área no encontrada</h3></div>'; return; }
    const pacs = App.data.pacientes.filter(p => p.areaId === id);
    const enfs = App.data.usuarios.filter(u => u.areaId === id);

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro"><a href="#/areas">Áreas</a> · Detalle</div>
          <h1>${a.nombre}</h1>
          <p class="tenue">${a.descripcion}</p>
        </div>
        <a class="btn btn-fantasma" href="#/areas">Volver</a>
      </div>

      <div class="kpi-grilla" style="margin-bottom:20px">
        <div class="kpi"><div class="titulo">Camas</div><div class="valor">${a.camasOcupadas}/${a.camasTotales}</div><div class="delta tenue">${Math.round(a.camasOcupadas/a.camasTotales*100)}% ocupación</div></div>
        <div class="kpi tono-exito"><div class="titulo">Habitaciones</div><div class="valor">${a.habitaciones}</div></div>
        <div class="kpi tono-ambar"><div class="titulo">Enfermeros de guardia</div><div class="valor">${enfs.length}</div></div>
        <div class="kpi tono-emergencia"><div class="titulo">Pacientes internados</div><div class="valor">${pacs.length}</div></div>
      </div>

      <div class="grilla-2">
        <div class="card">
          <div class="titulo-card"><h3>Pacientes en el área</h3></div>
          ${pacs.length ? pacs.map(p => `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--borde)">
              <img class="avatar" src="${p.avatar}" style="width:36px;height:36px;border-radius:50%">
              <div style="flex:1"><strong>${p.nombre} ${p.apellido}</strong><br><small class="tenue">Hab ${p.habitacion} · Cama ${p.cama}</small></div>
              <a href="#/pacientes/detalle/${p.id}" class="btn btn-fantasma btn-sm">Ver</a>
            </div>`).join('') : '<p class="tenue">Sin pacientes internados.</p>'}
        </div>
        <div class="card">
          <div class="titulo-card"><h3>Equipo de enfermería</h3></div>
          ${enfs.length ? enfs.map(u => `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--borde)">
              <img class="avatar" src="${u.avatar}" style="width:36px;height:36px;border-radius:50%">
              <div style="flex:1"><strong>${u.nombre}</strong><br><small class="tenue">${u.email}</small></div>
              ${u.estado === 'activo' ? '<span class="badge b-verde">Activo</span>' : '<span class="badge b-gris">Inactivo</span>'}
            </div>`).join('') : '<p class="tenue">Sin enfermeros asignados a esta área.</p>'}
        </div>
      </div>
    `;
  }

  App.pages.areas = { titulo: 'Áreas', render, permite: ['admin'] };
})();
