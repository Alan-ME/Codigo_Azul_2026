/* =========================================================
 *  Usuarios (solo Administrador)
 * ========================================================= */

(function () {
  const App = window.App;

  function areaNombre(id) { return App.data.areas.find(a => a.id === id)?.nombre || '—'; }

  function badgeRol(rol) {
    return rol === 'admin'
      ? '<span class="badge b-azul-fuerte">Administrador</span>'
      : '<span class="badge b-azul">Enfermero/a</span>';
  }
  function badgeEstado(e) {
    return e === 'activo'
      ? '<span class="badge b-verde">Activo</span>'
      : '<span class="badge b-gris">Inactivo</span>';
  }

  function render(cont) {
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Gestión · Usuarios</div>
          <h1>Usuarios del sistema</h1>
          <p class="tenue" style="margin-top:4px">Administrá cuentas, roles y áreas de trabajo del personal.</p>
        </div>
        <button class="btn btn-primario" id="btnNuevo">${App.ui.icono('mas', 16)} Nuevo usuario</button>
      </div>

      <div class="tabla-wrap">
        <div class="barra-tabla">
          <span class="tenue" style="font-size:13px">${App.data.usuarios.length} usuarios · ${App.data.usuarios.filter(u => u.estado === 'activo').length} activos</span>
        </div>
        <div class="tabla-scroll"><table class="tabla" id="tabU"></table></div>
      </div>
    `;
    document.getElementById('btnNuevo').addEventListener('click', () => modalUsuario());
    pintar();
  }

  function pintar() {
    const el = document.getElementById('tabU');
    el.innerHTML = `
      <thead>
        <tr>
          <th></th><th>Nombre</th><th>Usuario</th><th>Email</th><th>Rol</th>
          <th>Área</th><th>Estado</th><th>Último acceso</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${App.data.usuarios.map(u => `
          <tr>
            <td><img class="avatar" src="${u.avatar}" alt=""></td>
            <td><strong>${u.nombre}</strong></td>
            <td>${u.usuario}</td>
            <td>${u.email}</td>
            <td>${badgeRol(u.rol)}</td>
            <td>${areaNombre(u.areaId)}</td>
            <td>
              <label class="check" style="cursor:pointer">
                <input type="checkbox" ${u.estado === 'activo' ? 'checked' : ''} data-toggle="${u.id}">
                ${u.estado === 'activo' ? 'Activo' : 'Inactivo'}
              </label>
            </td>
            <td>${u.ultimoAcceso}</td>
            <td class="acciones">
              <button data-accion="editar" data-id="${u.id}" title="Editar">${App.ui.icono('editar', 16)}</button>
              <button class="peligro" data-accion="eliminar" data-id="${u.id}" title="Eliminar">${App.ui.icono('basura', 16)}</button>
            </td>
          </tr>`).join('')}
      </tbody>`;
    el.querySelectorAll('button[data-accion]').forEach(b => {
      b.addEventListener('click', () => manejar(b.dataset.accion, b.dataset.id));
    });
    el.querySelectorAll('[data-toggle]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const u = App.data.usuarios.find(x => x.id === e.target.dataset.toggle);
        u.estado = e.target.checked ? 'activo' : 'inactivo';
        App.ui.toast({ titulo: `Cuenta ${u.estado}`, msj: u.nombre, tipo: 'info' });
        pintar();
      });
    });
  }

  function manejar(accion, id) {
    const u = App.data.usuarios.find(x => x.id === id);
    if (!u) return;
    if (accion === 'editar') modalUsuario(u);
    else if (accion === 'eliminar') eliminar(u);
  }

  async function eliminar(u) {
    const ok = await App.ui.confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `¿Confirmás eliminar la cuenta de <strong>${u.nombre}</strong>?`,
      peligroso: true, textoOk: 'Eliminar',
    });
    if (!ok) return;
    App.data.usuarios.splice(App.data.usuarios.indexOf(u), 1);
    App.ui.toast({ titulo: 'Usuario eliminado', tipo: 'exito' });
    pintar();
  }

  function modalUsuario(u = null) {
    const edicion = !!u;
    const cuerpo = document.createElement('div');
    cuerpo.innerHTML = `
      <div class="grid-form">
        <div class="campo full">
          <label>Nombre completo<span class="obligatorio">*</span></label>
          <input id="u_nombre" value="${u?.nombre || ''}" required>
        </div>
        <div class="campo">
          <label>Usuario<span class="obligatorio">*</span></label>
          <input id="u_user" value="${u?.usuario || ''}" required>
        </div>
        <div class="campo">
          <label>Email</label>
          <input id="u_email" type="email" value="${u?.email || ''}">
        </div>
        ${edicion ? '' : `
          <div class="campo">
            <label>Contraseña<span class="obligatorio">*</span></label>
            <input id="u_pass" type="password" placeholder="Mínimo 8 caracteres">
          </div>
          <div class="campo">
            <label>Repetir contraseña</label>
            <input id="u_pass2" type="password">
          </div>
        `}
        <div class="campo full">
          <label>Rol</label>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <label class="check" style="border:1px solid var(--borde);padding:12px;border-radius:10px;background:var(--superficie-2)">
              <input type="radio" name="rol" value="admin" ${u?.rol === 'admin' || !u ? 'checked' : ''}>
              <div><strong>Administrador</strong><br><small class="tenue">Acceso completo al sistema.</small></div>
            </label>
            <label class="check" style="border:1px solid var(--borde);padding:12px;border-radius:10px;background:var(--superficie-2)">
              <input type="radio" name="rol" value="enfermero" ${u?.rol === 'enfermero' ? 'checked' : ''}>
              <div><strong>Enfermero/a</strong><br><small class="tenue">Ve tablero, sus pacientes y perfil.</small></div>
            </label>
          </div>
        </div>
        <div class="campo">
          <label>Área asignada</label>
          <select id="u_area">
            <option value="">Sin asignar</option>
            ${App.data.areas.map(a => `<option value="${a.id}" ${u?.areaId === a.id ? 'selected' : ''}>${a.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Teléfono</label>
          <input id="u_tel" value="${u?.telefono || ''}">
        </div>
      </div>
    `;
    const m = App.ui.modal({
      titulo: (edicion ? 'Editar ' : 'Nuevo ') + 'usuario',
      cuerpo,
      pie: `
        <button class="btn btn-fantasma" data-cerrar>Cancelar</button>
        <button class="btn btn-primario" id="ug">${edicion ? 'Guardar' : 'Crear usuario'}</button>
      `,
    });
    m.el.querySelector('#ug').addEventListener('click', () => {
      const nombre = m.el.querySelector('#u_nombre').value.trim();
      const usuario = m.el.querySelector('#u_user').value.trim();
      if (!nombre || !usuario) { App.ui.toast({ titulo: 'Faltan campos', tipo: 'error' }); return; }
      const datos = {
        nombre,
        usuario,
        email: m.el.querySelector('#u_email').value,
        rol: m.el.querySelector('input[name="rol"]:checked').value,
        areaId: m.el.querySelector('#u_area').value || null,
        telefono: m.el.querySelector('#u_tel').value,
      };
      if (edicion) {
        Object.assign(u, datos);
        u.avatar = App.data.avatar(u.nombre);
        App.ui.toast({ titulo: 'Usuario actualizado', tipo: 'exito' });
      } else {
        App.data.usuarios.unshift({
          id: 'u_' + Date.now(), estado: 'activo', ultimoAcceso: '—',
          avatar: App.data.avatar(nombre), ...datos,
        });
        App.ui.toast({ titulo: 'Usuario creado', tipo: 'exito' });
      }
      m.cerrar();
      pintar();
    });
  }

  App.pages.usuarios = { titulo: 'Usuarios', render, permite: ['admin'] };
})();
