/* =========================================================
 *  Router hash muy sencillo.
 *  Cada página se registra como App.pages[nombre] = { titulo, render, permite }
 *  Y navegar es cambiar location.hash.
 * ========================================================= */

(function () {
  const App = window.App = window.App || {};
  App.pages = App.pages || {};

  function parsear() {
    const raw = (location.hash || '#/dashboard').slice(1);
    const [ruta, query = ''] = raw.split('?');
    const partes = ruta.split('/').filter(Boolean);
    const nombre = partes[0] || 'dashboard';
    const params = partes.slice(1);
    const qs = new URLSearchParams(query);
    return { nombre, params, qs };
  }

  function renderRuta() {
    const contenedor = document.getElementById('vista');
    if (!contenedor) return;
    const { nombre, params, qs } = parsear();
    const pagina = App.pages[nombre] || App.pages['dashboard'];
    // Permisos por rol
    const rol = App.auth?.rolActual() || 'admin';
    if (pagina.permite && !pagina.permite.includes(rol)) {
      contenedor.innerHTML = `<div class="empty">
        <div class="ilustracion">${App.ui.icono('alerta', 42)}</div>
        <h3>Acceso restringido</h3>
        <p>Este apartado está disponible únicamente para el rol Administrador.</p>
      </div>`;
      return;
    }
    // Título en la topbar
    const tituloEl = document.getElementById('tituloPagina');
    if (tituloEl) tituloEl.textContent = pagina.titulo || 'Sistema Código Azul';
    // Sidebar activo
    document.querySelectorAll('.sidebar a.nav-item').forEach(a => {
      a.classList.toggle('activo', a.dataset.ruta === nombre);
    });
    // Fade suave
    contenedor.classList.remove('aparecer');
    contenedor.innerHTML = '';
    try {
      pagina.render(contenedor, { params, qs });
    } catch (err) {
      console.error(err);
      contenedor.innerHTML = `<div class="empty"><h3>Ocurrió un error al renderizar la vista</h3><p>${err.message}</p></div>`;
    }
    void contenedor.offsetWidth;
    contenedor.classList.add('aparecer');

    // Cerrar drawer mobile al navegar
    const shell = document.querySelector('.app-shell');
    if (shell) shell.removeAttribute('data-menu-abierto');

    // Scroll al tope
    document.querySelector('.main')?.scrollTo?.(0, 0);
    window.scrollTo(0, 0);
  }

  function navegar(ruta) {
    if (!ruta.startsWith('#')) ruta = '#' + ruta;
    location.hash = ruta;
  }

  App.router = { renderRuta, navegar, parsear };
  window.addEventListener('hashchange', renderRuta);
})();
