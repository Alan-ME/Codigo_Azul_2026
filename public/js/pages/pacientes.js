/* =========================================================
 *  Pacientes — listado, alta, edición, detalle con tabs.
 * ========================================================= */

(function () {
  const App = window.App;

  const state = {
    busqueda: '',
    filArea: 'todas',
    filEstado: 'todos',
  };

  function areaNombre(id) { return App.data.areas.find(a => a.id === id)?.nombre || '—'; }
  function enfermeroNombre(id) { return App.data.usuarios.find(u => u.id === id)?.nombre || 'Sin asignar'; }

  function badgeEstado(estado) {
    const map = {
      internado: '<span class="badge b-azul">Internado</span>',
      observacion: '<span class="badge b-ambar">Observación</span>',
      alta: '<span class="badge b-verde">Alta</span>',
    };
    return map[estado] || '<span class="badge">—</span>';
  }

  function filtrarPacientes() {
    return App.data.pacientes.filter(p => {
      if (state.filArea !== 'todas' && p.areaId !== state.filArea) return false;
      if (state.filEstado !== 'todos' && p.estado !== state.filEstado) return false;
      if (state.busqueda) {
        const q = state.busqueda.toLowerCase();
        const nombreCompleto = (p.nombre + ' ' + p.apellido).toLowerCase();
        if (!nombreCompleto.includes(q) && !p.dni.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function render(cont, { params }) {
    if (params[0] === 'detalle' && params[1]) return renderDetalle(cont, params[1]);

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Gestión · Pacientes</div>
          <h1>Pacientes</h1>
          <p class="tenue" style="margin-top:4px">${App.data.pacientes.length} pacientes registrados en el hospital.</p>
        </div>
        <button class="btn btn-primario" id="btnNuevo">${App.ui.icono('mas', 16)} Nuevo paciente</button>
      </div>

      <div class="tabla-wrap">
        <div class="barra-tabla">
          <div style="position:relative;flex:1;min-width:220px;max-width:340px">
            ${App.ui.icono('lupa', 16)}
            <input id="q" type="text" placeholder="Buscar por nombre o DNI..." value="${state.busqueda}"
              style="width:100%;padding:8px 12px 8px 34px;border:1px solid var(--borde);border-radius:8px">
            <span style="position:absolute;left:10px;top:9px;color:var(--texto-tenue)">${App.ui.icono('lupa', 16)}</span>
          </div>
          <select id="filArea">
            <option value="todas">Todas las áreas</option>
            ${App.data.areas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
          </select>
          <select id="filEstado">
            <option value="todos">Todos los estados</option>
            <option value="internado">Internado</option>
            <option value="observacion">En observación</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div class="tabla-scroll">
          <table class="tabla" id="tablaPacientes"></table>
        </div>
      </div>
    `;

    document.getElementById('filArea').value = state.filArea;
    document.getElementById('filEstado').value = state.filEstado;

    document.getElementById('q').addEventListener('input', (e) => {
      state.busqueda = e.target.value;
      renderTabla();
    });
    document.getElementById('filArea').addEventListener('change', (e) => { state.filArea = e.target.value; renderTabla(); });
    document.getElementById('filEstado').addEventListener('change', (e) => { state.filEstado = e.target.value; renderTabla(); });
    document.getElementById('btnNuevo').addEventListener('click', () => modalPaciente());

    renderTabla();
  }

  function renderTabla() {
    const lista = filtrarPacientes();
    const el = document.getElementById('tablaPacientes');
    if (!el) return;
    el.innerHTML = `
      <thead>
        <tr>
          <th></th>
          <th>Paciente</th>
          <th>DNI</th>
          <th>Edad</th>
          <th>Área</th>
          <th>Hab/Cama</th>
          <th>Enfermero</th>
          <th>Estado</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${lista.length ? lista.map(p => `
          <tr>
            <td><img class="avatar" src="${p.avatar}" alt=""></td>
            <td><strong>${p.nombre} ${p.apellido}</strong></td>
            <td>${p.dni}</td>
            <td>${p.edad}</td>
            <td>${areaNombre(p.areaId)}</td>
            <td>${p.habitacion} · ${p.cama}</td>
            <td>${enfermeroNombre(p.enfermeroId)}</td>
            <td>${badgeEstado(p.estado)}</td>
            <td class="acciones">
              <button title="Ver detalle" data-accion="ver" data-id="${p.id}">${App.ui.icono('ojo', 16)}</button>
              <button title="Editar"       data-accion="editar" data-id="${p.id}">${App.ui.icono('editar', 16)}</button>
              <button class="peligro" title="Eliminar" data-accion="eliminar" data-id="${p.id}">${App.ui.icono('basura', 16)}</button>
            </td>
          </tr>`).join('') : `
          <tr><td colspan="9" class="tabla-vacia">No se encontraron pacientes con esos criterios.</td></tr>
        `}
      </tbody>`;
    el.querySelectorAll('button[data-accion]').forEach(b => {
      b.addEventListener('click', () => manejar(b.dataset.accion, b.dataset.id));
    });
  }

  function manejar(accion, id) {
    const p = App.data.pacientes.find(x => x.id === id);
    if (!p) return;
    if (accion === 'ver')     App.router.navegar('#/pacientes/detalle/' + id);
    if (accion === 'editar')  modalPaciente(p);
    if (accion === 'eliminar') eliminar(p);
  }

  async function eliminar(p) {
    const ok = await App.ui.confirmar({
      titulo: 'Eliminar paciente',
      mensaje: `¿Confirmás la eliminación del registro de <strong>${p.nombre} ${p.apellido}</strong>? Esta acción no se puede deshacer.`,
      peligroso: true,
      textoOk: 'Eliminar',
    });
    if (!ok) return;
    const i = App.data.pacientes.indexOf(p);
    App.data.pacientes.splice(i, 1);
    App.ui.toast({ titulo: 'Paciente eliminado', tipo: 'exito' });
    renderTabla();
  }

  function modalPaciente(p = null) {
    const edicion = !!p;
    const enfermeros = App.data.usuarios.filter(u => u.rol === 'enfermero' && u.estado === 'activo');
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="grid-form">
        <div class="campo">
          <label>Nombre<span class="obligatorio">*</span></label>
          <input id="c_nombre" required value="${p?.nombre || ''}">
        </div>
        <div class="campo">
          <label>Apellido<span class="obligatorio">*</span></label>
          <input id="c_apellido" required value="${p?.apellido || ''}">
        </div>
        <div class="campo">
          <label>DNI</label>
          <input id="c_dni" value="${p?.dni || ''}" placeholder="00.000.000">
        </div>
        <div class="campo">
          <label>Fecha de nacimiento</label>
          <input id="c_fnac" type="date" value="${p?.fechaNac || ''}">
        </div>
        <div class="campo">
          <label>Sexo</label>
          <select id="c_sexo">
            <option value="F" ${p?.sexo === 'F' ? 'selected' : ''}>Femenino</option>
            <option value="M" ${p?.sexo === 'M' ? 'selected' : ''}>Masculino</option>
            <option value="X" ${p?.sexo === 'X' ? 'selected' : ''}>Otro</option>
          </select>
        </div>
        <div class="campo">
          <label>Teléfono</label>
          <input id="c_tel" value="${p?.telefono || ''}">
        </div>
        <div class="campo full">
          <label>Dirección</label>
          <input id="c_dir" value="${p?.direccion || ''}">
        </div>
        <div class="campo full">
          <label>Contacto de emergencia</label>
          <input id="c_emerg" value="${p?.contactoEmerg || ''}">
        </div>

        <div class="campo">
          <label>Obra social</label>
          <input id="c_os" value="${p?.obraSocial || ''}">
        </div>
        <div class="campo">
          <label>Grupo sanguíneo</label>
          <select id="c_grupo">
            ${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(g => `<option ${p?.grupo === g ? 'selected' : ''}>${g}</option>`).join('')}
          </select>
        </div>
        <div class="campo full">
          <label>Alergias (separadas por coma)</label>
          <input id="c_alergias" value="${(p?.alergias || []).join(', ')}">
        </div>
        <div class="campo full">
          <label>Patologías previas (separadas por coma)</label>
          <input id="c_patologias" value="${(p?.patologias || []).join(', ')}">
        </div>
        <div class="campo full">
          <label>Medicación actual (separada por coma)</label>
          <input id="c_med" value="${(p?.medicacion || []).join(', ')}">
        </div>

        <div class="campo">
          <label>Área</label>
          <select id="c_area">
            ${App.data.areas.map(a => `<option value="${a.id}" ${p?.areaId === a.id ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Estado</label>
          <select id="c_estado">
            <option value="internado" ${p?.estado === 'internado' ? 'selected' : ''}>Internado</option>
            <option value="observacion" ${p?.estado === 'observacion' ? 'selected' : ''}>Observación</option>
            <option value="alta" ${p?.estado === 'alta' ? 'selected' : ''}>Alta</option>
          </select>
        </div>
        <div class="campo">
          <label>Habitación</label>
          <input id="c_hab" value="${p?.habitacion || ''}">
        </div>
        <div class="campo">
          <label>Cama</label>
          <input id="c_cama" value="${p?.cama || ''}">
        </div>
        <div class="campo full">
          <label>Enfermero asignado</label>
          <select id="c_enf">
            <option value="">Sin asignar</option>
            ${enfermeros.map(e => `<option value="${e.id}" ${p?.enfermeroId === e.id ? 'selected' : ''}>${e.nombre}</option>`).join('')}
          </select>
        </div>
      </div>`;

    const m = App.ui.modal({
      titulo: (edicion ? 'Editar ' : 'Nuevo ') + 'paciente',
      ancho: true,
      cuerpo,
      pie: `
        <button class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario" id="btnGuardar">${App.ui.icono('check', 16)} ${edicion ? 'Guardar cambios' : 'Crear paciente'}</button>
      `,
    });

    m.el.querySelector('#btnGuardar').addEventListener('click', () => {
      const nombre = m.el.querySelector('#c_nombre').value.trim();
      const apellido = m.el.querySelector('#c_apellido').value.trim();
      if (!nombre || !apellido) {
        App.ui.toast({ titulo: 'Faltan datos', msj: 'Nombre y apellido son obligatorios.', tipo: 'error' });
        return;
      }
      const datos = {
        nombre,
        apellido,
        dni: m.el.querySelector('#c_dni').value,
        fechaNac: m.el.querySelector('#c_fnac').value,
        edad: p?.edad || 0,
        sexo: m.el.querySelector('#c_sexo').value,
        obraSocial: m.el.querySelector('#c_os').value,
        grupo: m.el.querySelector('#c_grupo').value,
        alergias: m.el.querySelector('#c_alergias').value.split(',').map(s => s.trim()).filter(Boolean),
        patologias: m.el.querySelector('#c_patologias').value.split(',').map(s => s.trim()).filter(Boolean),
        medicacion: m.el.querySelector('#c_med').value.split(',').map(s => s.trim()).filter(Boolean),
        telefono: m.el.querySelector('#c_tel').value,
        direccion: m.el.querySelector('#c_dir').value,
        contactoEmerg: m.el.querySelector('#c_emerg').value,
        areaId: m.el.querySelector('#c_area').value,
        estado: m.el.querySelector('#c_estado').value,
        habitacion: m.el.querySelector('#c_hab').value,
        cama: m.el.querySelector('#c_cama').value,
        enfermeroId: m.el.querySelector('#c_enf').value || null,
      };
      if (edicion) {
        Object.assign(p, datos);
        p.avatar = App.data.avatar(p.nombre + ' ' + p.apellido);
        App.ui.toast({ titulo: 'Paciente actualizado', tipo: 'exito' });
      } else {
        const nuevo = { id: 'p_' + Date.now(), ...datos, avatar: App.data.avatar(nombre + ' ' + apellido) };
        App.data.pacientes.unshift(nuevo);
        App.ui.toast({ titulo: 'Paciente creado', msj: `${nombre} ${apellido}`, tipo: 'exito' });
      }
      m.cerrar();
      renderTabla();
    });
  }

  /* ---------- Detalle con tabs ---------- */
  function renderDetalle(cont, id) {
    const p = App.data.pacientes.find(x => x.id === id);
    if (!p) { cont.innerHTML = '<div class="empty"><h3>Paciente no encontrado</h3></div>'; return; }
    const a = App.data.areas.find(aa => aa.id === p.areaId);
    const enf = App.data.usuarios.find(u => u.id === p.enfermeroId);
    const llamadosPac = App.data.llamadosHistoricos.filter(l => l.pacienteId === p.id);

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro"><a href="#/pacientes">Pacientes</a> · Detalle</div>
          <h1>${p.nombre} ${p.apellido}</h1>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secundario" id="btnEdit">${App.ui.icono('editar', 16)} Editar</button>
          <a class="btn btn-fantasma" href="#/pacientes">Volver</a>
        </div>
      </div>

      <div class="ficha-cab">
        <img class="avatar-grande" src="${p.avatar}" alt="">
        <div class="datos-principales">
          <h2>${p.nombre} ${p.apellido}</h2>
          <div class="meta">${p.edad} años · DNI ${p.dni} · ${p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}</div>
          <div class="badges">
            ${badgeEstado(p.estado)}
            <span class="badge b-azul">${a?.nombre || '—'}</span>
            <span class="badge">Hab ${p.habitacion} · Cama ${p.cama}</span>
            ${p.alergias?.length ? `<span class="badge b-rojo">${App.ui.icono('alerta', 12)} Alergias</span>` : ''}
          </div>
        </div>
        <div style="text-align:right;font-size:13px;color:var(--texto-tenue)">
          <div>Enfermero asignado</div>
          <div style="display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:6px">
            ${enf ? `<img class="avatar" src="${enf.avatar}" style="width:32px;height:32px;border-radius:50%"><strong style="color:var(--texto)">${enf.nombre}</strong>` : '<em>Sin asignar</em>'}
          </div>
        </div>
      </div>

      <div class="tabs" id="tabs">
        <button class="tab activo" data-t="personales">Datos personales</button>
        <button class="tab" data-t="medicos">Datos médicos</button>
        <button class="tab" data-t="llamados">Historial de llamados (${llamadosPac.length})</button>
        <button class="tab" data-t="notas">Notas</button>
      </div>

      <div id="tabCont"></div>
    `;

    const paneles = {
      personales: () => `
        <div class="card">
          <div class="grid-form">
            <div><label class="mayuscula tenue">Nombre completo</label><p>${p.nombre} ${p.apellido}</p></div>
            <div><label class="mayuscula tenue">DNI</label><p>${p.dni}</p></div>
            <div><label class="mayuscula tenue">Fecha de nacimiento</label><p>${p.fechaNac || '—'}</p></div>
            <div><label class="mayuscula tenue">Edad</label><p>${p.edad} años</p></div>
            <div><label class="mayuscula tenue">Teléfono</label><p>${p.telefono}</p></div>
            <div><label class="mayuscula tenue">Sexo</label><p>${p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}</p></div>
            <div class="full"><label class="mayuscula tenue">Dirección</label><p>${p.direccion}</p></div>
            <div class="full"><label class="mayuscula tenue">Contacto de emergencia</label><p>${p.contactoEmerg}</p></div>
          </div>
        </div>`,
      medicos: () => `
        <div class="card">
          <div class="grid-form">
            <div><label class="mayuscula tenue">Obra social</label><p>${p.obraSocial}</p></div>
            <div><label class="mayuscula tenue">Grupo sanguíneo</label><p><span class="badge b-rojo">${p.grupo}</span></p></div>
            <div class="full"><label class="mayuscula tenue">Alergias</label><p>${p.alergias?.length ? p.alergias.map(x => `<span class="badge b-ambar">${x}</span>`).join(' ') : '<em>Sin registros</em>'}</p></div>
            <div class="full"><label class="mayuscula tenue">Patologías previas</label><p>${p.patologias?.length ? p.patologias.map(x => `<span class="badge">${x}</span>`).join(' ') : '<em>Sin registros</em>'}</p></div>
            <div class="full"><label class="mayuscula tenue">Medicación actual</label><p>${p.medicacion?.length ? '<ul style="margin-left:16px">' + p.medicacion.map(x => `<li>${x}</li>`).join('') + '</ul>' : '<em>Sin medicación</em>'}</p></div>
          </div>
        </div>`,
      llamados: () => `
        <div class="tabla-wrap">
          <div class="tabla-scroll">
            <table class="tabla">
              <thead><tr><th>Fecha</th><th>Tipo</th><th>Origen</th><th>Duración</th><th>Enfermero</th><th>Estado</th></tr></thead>
              <tbody>
                ${llamadosPac.length ? llamadosPac.map(l => `
                  <tr>
                    <td>${App.ui.formatearFechaHora(l.horaInicio)}</td>
                    <td>${l.tipo === 'codigo-azul' ? '<span class="badge b-azul-fuerte">Código Azul</span>' : l.tipo === 'emergencia' ? '<span class="badge b-rojo">Emergencia</span>' : '<span class="badge b-ambar">Normal</span>'}</td>
                    <td>${l.origen}</td>
                    <td>${App.ui.segundosADuracion(l.duracionSeg)}</td>
                    <td>${enfermeroNombre(l.enfermeroId)}</td>
                    <td>${l.estado === 'atendido' ? '<span class="badge b-verde">Atendido</span>' : '<span class="badge b-rojo">No atendido</span>'}</td>
                  </tr>
                `).join('') : `<tr><td colspan="6" class="tabla-vacia">Sin llamados registrados para este paciente.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>`,
      notas: () => `
        <div class="card">
          <p class="tenue">Sin notas médicas cargadas. Presioná el botón para agregar la primera.</p>
          <div style="margin-top:14px"><button class="btn btn-primario btn-sm">${App.ui.icono('mas', 14)} Agregar nota</button></div>
        </div>`,
    };

    const contTab = document.getElementById('tabCont');
    function pintar(t) { contTab.innerHTML = paneles[t](); }
    pintar('personales');

    document.getElementById('tabs').addEventListener('click', (e) => {
      const b = e.target.closest('.tab');
      if (!b) return;
      document.querySelectorAll('#tabs .tab').forEach(x => x.classList.remove('activo'));
      b.classList.add('activo');
      pintar(b.dataset.t);
    });

    document.getElementById('btnEdit').addEventListener('click', () => modalPaciente(p));
  }

  App.pages.pacientes = { titulo: 'Pacientes', render };
})();
