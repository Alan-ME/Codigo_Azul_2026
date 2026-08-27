/* =========================================================
 *  Bootstrap: arma el layout (sidebar + topbar), maneja login,
 *  bindings globales y arranca el router.
 * ========================================================= */

(function () {
  const App = window.App;

  // Cronómetro global de llamados activos: actualiza cada segundo
  // los elementos con [data-cronometro="ISO..."] aplicando umbrales AHA (2 min advertencia, 3 min crítico).
  function tickCronometros() {
    document.querySelectorAll('[data-cronometro]').forEach(el => {
      const inicio = new Date(el.dataset.cronometro).getTime();
      const seg = Math.max(0, Math.floor((Date.now() - inicio) / 1000));
      el.textContent = App.ui.segundosADuracion(seg);

      if (seg >= 180) {
        el.classList.add('cron-critico');
        el.classList.remove('cron-advertencia');
        el.title = '🚨 >3 min sin respuesta (Límite AHA excedido)';
      } else if (seg >= 120) {
        el.classList.add('cron-advertencia');
        el.classList.remove('cron-critico');
        el.title = '⚠️ >2 min sin respuesta';
      } else {
        el.classList.remove('cron-advertencia', 'cron-critico');
      }
    });
  }
  setInterval(tickCronometros, 1000);

  /* ---------------- LOGIN ---------------- */
  function renderLogin() {
    const online = App.config.isBackendOnline();
    const modoIndicador = online
      ? '<span style="color:#10B981;font-size:12px;font-weight:600">En Vivo (PostgreSQL)</span>'
      : '<span style="color:#F59E0B;font-size:12px;font-weight:600">Demo (Datos Mock)</span>';

    const camposLogin = online
      ? `<div class="campo">
              <label for="usr">Email institucional</label>
              <input id="usr" type="email" placeholder="usuario@hospital.gob.ar" required autocomplete="username" value="medico.activador@hospital.gob.ar">
            </div>
            <div class="campo">
              <label for="pass">Contrasena</label>
              <input id="pass" type="password" placeholder="Password123!" required autocomplete="current-password" value="Password123!">
            </div>`
      : `<div class="campo">
              <label for="usr">Usuario</label>
              <input id="usr" type="text" placeholder="usuario.hospital" required autocomplete="username" value="jmolina">
            </div>
            <div class="campo">
              <label for="pass">Contrasena</label>
              <input id="pass" type="password" placeholder="demo1234" required autocomplete="current-password" value="demo1234">
            </div>`;

    document.body.innerHTML = `
      <div class="login-fondo">
        <div class="login-tarjeta aparecer">
          <div class="login-marca">
            <div class="logo">${App.ui.icono('corazon', 22)}</div>
            <div>
              <h1>Codigo Azul</h1>
              <p>Sistema hospitalario - ONETP 2026</p>
            </div>
          </div>
          <h2>Inicia sesion</h2>
          <p class="subtitulo">Ingresa con tus credenciales institucionales para acceder al panel. ${modoIndicador}</p>
          <div id="loginError" style="display:none;color:#DC2626;background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px"></div>
          <form id="formLogin">
            ${camposLogin}
            <div class="opciones">
              <label class="check"><input type="checkbox" checked> Recordarme</label>
              <a href="#" id="linkOlvido">Olvidaste tu contrasena?</a>
            </div>
            <button class="btn btn-primario btn-bloque btn-lg" type="submit" id="btnLogin">Ingresar</button>
          </form>
          <div class="demo">
            <p>Accesos rapidos DEMO</p>
            <div class="demo-fila">
              <button class="btn btn-secundario" data-rol="admin">Entrar como Administrador</button>
              <button class="btn btn-secundario" data-rol="enfermero">Entrar como Enfermero</button>
            </div>
          </div>
          <p class="login-pie">&copy; 2026 - Hospital Municipal - ONETP Programacion</p>
        </div>
      </div>`;

    document.getElementById('formLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btnLogin = document.getElementById('btnLogin');
      const errorDiv = document.getElementById('loginError');
      errorDiv.style.display = 'none';
      btnLogin.disabled = true;
      btnLogin.textContent = 'Ingresando...';

      try {
        if (online) {
          const email = document.getElementById('usr').value.trim();
          const password = document.getElementById('pass').value;
          await App.auth.ingresar({ email: email, password: password });
        } else {
          const usr = document.getElementById('usr').value.trim();
          await App.auth.ingresar({ usuario: usr });
        }
        arrancarAppLogueada();
      } catch (err) {
        errorDiv.textContent = err.message || 'Error de autenticacion';
        errorDiv.style.display = 'block';
        btnLogin.disabled = false;
        btnLogin.textContent = 'Ingresar';
      }
    });

    document.querySelectorAll('[data-rol]').forEach(b => {
      b.addEventListener('click', async () => {
        b.disabled = true;
        b.textContent = 'Ingresando...';
        try {
          await App.auth.ingresar({ rol: b.dataset.rol });
          arrancarAppLogueada();
        } catch (err) {
          const errorDiv = document.getElementById('loginError');
          errorDiv.textContent = err.message || 'Error de autenticacion';
          errorDiv.style.display = 'block';
          b.disabled = false;
          b.textContent = b.dataset.rol === 'admin' ? 'Entrar como Administrador' : 'Entrar como Enfermero';
        }
      });
    });

    document.getElementById('linkOlvido').addEventListener('click', (e) => {
      e.preventDefault();
      App.ui.modal({
        titulo: 'Recuperar contrasena',
        angosto: true,
        cuerpo: `<p>Contacta al area de <strong>Sistemas del Hospital</strong> al interno <strong>2010</strong> o al correo <a href="#">sistemas@hospital.gob.ar</a> para restablecer tu clave.</p>`,
        pie: `<button class="btn btn-primario" data-cerrar>Entendido</button>`,
      });
    });
  }

  /* ---------------- APP LAYOUT ---------------- */
  function renderShell() {
    const rol = App.auth.rolActual();
    const u = App.auth.usuarioActual();
    const menuAdmin = [
      { grupo: 'Operación' },
      { ruta: 'dashboard',       label: 'Dashboard',        icono: 'dashboard' },
      { ruta: 'tablero',         label: 'Tablero en vivo',  icono: 'tablero' },
      { ruta: 'historial',       label: 'Historial',        icono: 'historial' },
      { ruta: 'reportes',        label: 'Reportes',         icono: 'reportes' },
      { grupo: 'Gestión' },
      { ruta: 'pacientes',       label: 'Pacientes',        icono: 'pacientes' },
      { ruta: 'usuarios',        label: 'Usuarios',         icono: 'usuarios',       soloAdmin: true },
      { ruta: 'areas',           label: 'Áreas',            icono: 'areas',          soloAdmin: true },
      { ruta: 'configuracion',   label: 'Configuración',    icono: 'configuracion',  soloAdmin: true },
      { grupo: 'Otros' },
      { ruta: 'mobile-preview',  label: 'Vista mobile',     icono: 'mobile' },
      { ruta: 'perfil',          label: 'Mi perfil',        icono: 'perfil' },
      { ruta: 'notificaciones',  label: 'Notificaciones',   icono: 'notificaciones' },
      { ruta: 'ayuda',           label: 'Ayuda',            icono: 'ayuda' },
    ];

    const notifNoLeidas = App.data.notificaciones.filter(n => !n.leida).length;

    document.body.innerHTML = `
      <div class="app-shell">
        <aside class="sidebar">
          <div class="marca">
            <div class="logo">${App.ui.icono('corazon', 22)}</div>
            <div>
              <div class="nombre">Código Azul</div>
              <div class="subtitulo">Hospital Municipal</div>
            </div>
          </div>
          <nav>
            ${menuAdmin.map(m => {
              if (m.grupo) return `<div class="nav-grupo">${m.grupo}</div>`;
              const bloqueado = m.soloAdmin && rol !== 'admin';
              return `<a class="nav-item" data-ruta="${m.ruta}" href="#/${m.ruta}"
                        ${bloqueado ? 'aria-disabled="true" title="Requiere rol Administrador"' : ''}>
                        ${App.ui.icono(m.icono, 18)}<span>${m.label}</span>
                      </a>`;
            }).join('')}
          </nav>
          <div class="usuario-card">
            <img class="avatar" src="${u.avatar}" alt="${u.nombre}">
            <div>
              <div class="nombre">${u.nombre}</div>
              <div class="rol">${rol === 'admin' ? 'Administrador' : 'Enfermero/a'}</div>
            </div>
            <button title="Cerrar sesión" id="btnSalir">${App.ui.icono('salir', 18)}</button>
          </div>
        </aside>
        <div class="backdrop-menu" id="backdropMenu"></div>

        <div class="contenido">
          <div class="topbar">
            <button class="hamburguesa" id="btnMenu" aria-label="Menú">${App.ui.icono('menu', 22)}</button>
            <h2 class="titulo" id="tituloPagina">Dashboard</h2>
            <div class="buscador">
              ${App.ui.icono('lupa', 18)}
              <input type="text" placeholder="Buscar pacientes, llamados, áreas..." aria-label="Buscar">
            </div>
            <div class="acciones">
              <div class="rol-switch" title="Cambiar rol para demostración">
                <span>DEMO</span>
                <select id="rolSwitch">
                  <option value="admin"     ${rol === 'admin' ? 'selected' : ''}>Administrador</option>
                  <option value="enfermero" ${rol === 'enfermero' ? 'selected' : ''}>Enfermero/a</option>
                </select>
              </div>
              <button class="icono-btn" id="btnTema" title="Cambiar tema">${App.ui.icono('luna', 20)}</button>
              <button class="icono-btn" id="btnNotif" title="Notificaciones">
                ${App.ui.icono('campana', 20)}
                ${notifNoLeidas ? `<span class="badge">${notifNoLeidas}</span>` : ''}
              </button>
            </div>
          </div>
          <main class="main">
            <div id="vista"></div>
          </main>
        </div>
      </div>`;

    // Listeners
    document.getElementById('btnSalir').addEventListener('click', async () => {
      const ok = await App.ui.confirmar({
        titulo: 'Cerrar sesión',
        mensaje: '¿Estás seguro de que querés cerrar tu sesión?',
        textoOk: 'Cerrar sesión',
        peligroso: true,
      });
      if (ok) {
        App.auth.salir();
        renderLogin();
      }
    });

    document.getElementById('btnMenu').addEventListener('click', () => {
      const shell = document.querySelector('.app-shell');
      shell.dataset.menuAbierto = shell.dataset.menuAbierto === '1' ? '' : '1';
    });
    document.getElementById('backdropMenu').addEventListener('click', () => {
      document.querySelector('.app-shell').removeAttribute('data-menu-abierto');
    });

    document.getElementById('rolSwitch').addEventListener('change', (e) => {
      App.auth.cambiarRol(e.target.value);
      renderShell();
      App.router.renderRuta();
      App.ui.toast({ titulo: 'Rol cambiado', msj: 'Ahora navegás como ' + (e.target.value === 'admin' ? 'Administrador' : 'Enfermero/a'), tipo: 'info' });
    });

    document.getElementById('btnTema').addEventListener('click', () => {
      const raiz = document.documentElement;
      const actual = raiz.dataset.tema === 'oscuro' ? 'claro' : 'oscuro';
      raiz.dataset.tema = actual;
      document.getElementById('btnTema').innerHTML = App.ui.icono(actual === 'oscuro' ? 'sol' : 'luna', 20);
    });

    document.getElementById('btnNotif').addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownNotificaciones(e.currentTarget);
    });
  }

  function dropdownNotificaciones(btn) {
    // toggle
    const existente = document.getElementById('dropdownNotif');
    if (existente) { existente.remove(); return; }

    const dd = document.createElement('div');
    dd.className = 'dropdown';
    dd.id = 'dropdownNotif';
    dd.style.top = (btn.offsetTop + btn.offsetHeight + 8) + 'px';
    dd.style.right = '24px';
    dd.innerHTML = `
      <div class="cab">
        <strong>Notificaciones</strong>
        <button class="btn btn-fantasma btn-sm" id="marcarLeidas">Marcar todas</button>
      </div>
      <div class="lista">
        ${App.data.notificaciones.slice(0, 6).map(n => `
          <div class="item ${n.leida ? 'leida' : ''}">
            <span class="puntito"></span>
            <div class="txt">
              ${n.texto}
              <div class="hora">${App.ui.haceCuanto(n.hora)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="pie"><a href="#/notificaciones" id="verNotif">Ver todas las notificaciones</a></div>
    `;
    document.body.appendChild(dd);
    dd.style.position = 'fixed';
    dd.style.top = (btn.getBoundingClientRect().bottom + 8) + 'px';
    dd.style.right = '24px';

    dd.querySelector('#marcarLeidas').addEventListener('click', () => {
      App.data.notificaciones.forEach(n => n.leida = true);
      dd.remove();
      renderShell();
      App.router.renderRuta();
    });
    dd.querySelector('#verNotif').addEventListener('click', () => dd.remove());

    setTimeout(() => {
      document.addEventListener('click', function fuera(ev) {
        if (!dd.contains(ev.target)) { dd.remove(); document.removeEventListener('click', fuera); }
      });
    }, 0);
  }

  /* ---------------- Init ---------------- */
  async function arrancarAppLogueada() {
    renderShell();
    if (!location.hash) location.hash = '#/dashboard';
    App.router.renderRuta();

    // Sincronización en tiempo real con PostgreSQL y WebSockets
    if (App.api && App.api.conectarSockets) {
      App.api.conectarSockets();
    }
    if (App.api && App.api.sincronizarIncidentes) {
      await App.api.sincronizarIncidentes();
      App.router.renderRuta();
    }
  }

  async function init() {
    // Detectar si el backend esta en linea antes de renderizar
    if (typeof App.api !== 'undefined' && App.api.detectarBackend) {
      var online = await App.api.detectarBackend();
      if (online) {
        console.log('[INIT] Backend detectado — Modo En Vivo (PostgreSQL)');
      } else {
        console.log('[INIT] Backend no disponible — Modo Mock Demostrativo');
      }
    }

    if (App.auth.estaLogueado()) arrancarAppLogueada();
    else renderLogin();
  }

  document.addEventListener('DOMContentLoaded', init);

  App.shell = { renderShell };
})();
