/* =========================================================
 *  Perfil de usuario
 * ========================================================= */

(function () {
  const App = window.App;

  function render(cont) {
    const u = App.auth.usuarioActual();
    if (!u) { cont.innerHTML = '<div class="empty"><h3>Sesión no encontrada</h3></div>'; return; }
    const a = App.data.areas.find(x => x.id === u.areaId);

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Cuenta · Mi perfil</div>
          <h1>Mi perfil</h1>
        </div>
      </div>

      <div class="grilla-2">
        <div class="card">
          <div class="titulo-card"><h3>Información personal</h3></div>
          <div style="display:flex;align-items:center;gap:18px;margin-bottom:20px">
            <img class="avatar" src="${u.avatar}" style="width:80px;height:80px;border-radius:50%">
            <div>
              <h2 style="font-size:22px">${u.nombre}</h2>
              <p class="tenue">${u.rol === 'admin' ? 'Administrador del sistema' : 'Enfermero/a'}${a ? ' · ' + a.nombre : ''}</p>
              <button class="btn btn-fantasma btn-sm" style="margin-top:6px">${App.ui.icono('editar', 14)} Cambiar foto</button>
            </div>
          </div>
          <div class="grid-form">
            <div class="campo"><label>Nombre completo</label><input value="${u.nombre}"></div>
            <div class="campo"><label>Usuario</label><input value="${u.usuario}" disabled></div>
            <div class="campo full"><label>Email</label><input value="${u.email}"></div>
            <div class="campo"><label>Teléfono</label><input value="${u.telefono || ''}"></div>
            <div class="campo"><label>Área</label><input value="${a?.nombre || 'Sin asignar'}" disabled></div>
          </div>
          <div style="margin-top:16px"><button class="btn btn-primario" id="guardarP">${App.ui.icono('check', 14)} Guardar cambios</button></div>
        </div>

        <div class="col">
          <div class="card">
            <div class="titulo-card"><h3>Seguridad</h3></div>
            <div class="grid-form">
              <div class="campo full"><label>Contraseña actual</label><input type="password" placeholder="••••••••"></div>
              <div class="campo"><label>Nueva contraseña</label><input type="password" placeholder="Mín. 8 caracteres"></div>
              <div class="campo"><label>Repetir nueva</label><input type="password"></div>
            </div>
            <div style="margin-top:14px"><button class="btn btn-secundario" id="cambClave">Cambiar contraseña</button></div>
          </div>

          <div class="card">
            <div class="titulo-card"><h3>Preferencias</h3></div>
            <label class="check" style="display:flex;gap:10px;padding:10px 0"><input type="checkbox" checked> Notificaciones en pantalla</label>
            <label class="check" style="display:flex;gap:10px;padding:10px 0"><input type="checkbox" checked> Sonido de alerta al recibir un Código Azul</label>
            <label class="check" style="display:flex;gap:10px;padding:10px 0"><input type="checkbox"> Vibración en dispositivos móviles</label>
            <div class="campo" style="margin-top:10px">
              <label>Idioma</label>
              <select>
                <option>Español (Argentina)</option>
                <option>Español (España)</option>
                <option>English (US)</option>
                <option>Português (Brasil)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('guardarP').addEventListener('click', () => App.ui.toast({ titulo: 'Perfil actualizado', tipo: 'exito' }));
    document.getElementById('cambClave').addEventListener('click', () => App.ui.toast({ titulo: 'Contraseña actualizada', msj: 'La próxima vez ingresá con tu nueva clave.', tipo: 'exito' }));
  }

  App.pages.perfil = { titulo: 'Mi perfil', render };
})();
