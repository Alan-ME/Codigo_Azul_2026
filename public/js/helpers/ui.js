/* =========================================================
 *  UI helpers: iconos, toasts, modales, formateadores.
 *  Todo bajo App.ui — sin dependencias.
 * ========================================================= */

(function () {
  const App = window.App = window.App || {};

  /* ------------------- ICONOS (estilo Lucide, hechos a mano) ------------------- */
  const iconos = {
    // navegación
    dashboard:  '<path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/>',
    tablero:    '<rect x="3" y="4" width="7" height="16" rx="2"/><rect x="14" y="4" width="7" height="10" rx="2"/><rect x="14" y="16" width="7" height="4" rx="2"/>',
    pacientes:  '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    usuarios:   '<circle cx="12" cy="8" r="4"/><path d="M4 20c1-4 5-6 8-6s7 2 8 6"/>',
    areas:      '<path d="M3 21h18"/><path d="M4 21V7l5-4 5 4v14"/><path d="M14 12h6v9"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>',
    configuracion:'<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    historial:  '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    reportes:   '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="4" width="3" height="14"/>',
    perfil:     '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/>',
    notificaciones:'<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    ayuda:      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
    mobile:     '<rect x="7" y="2" width="10" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18.01"/>',
    // topbar / acciones
    lupa:       '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    campana:    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    menu:       '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    salir:      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    sol:        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    luna:       '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    // acciones
    mas:        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    ojo:        '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    editar:     '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    basura:     '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    check:      '<polyline points="20 6 9 17 4 12"/>',
    cruz:       '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    descargar:  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    // médicos / iconos custom
    cama:       '<path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><circle cx="7" cy="12" r="2"/>',
    bath:       '<path d="M4 12h16v4a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z"/><path d="M4 12V6a2 2 0 0 1 2-2h1"/><path d="M2 20l2 2M22 20l-2 2"/>',
    watch:      '<circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.51 17.35l-.35 3.83a2 2 0 0 1-2 1.82H9.83a2 2 0 0 1-2-1.82l-.35-3.83m.01-10.7l.35-3.83A2 2 0 0 1 9.83 1h4.35a2 2 0 0 1 2 1.82l.35 3.83"/>',
    radio:      '<path d="M4.9 19.1a12 12 0 0 1 0-14.14"/><path d="M7.76 16.24a8 8 0 0 1 0-8.48"/><path d="M16.24 7.76a8 8 0 0 1 0 8.48"/><path d="M19.1 4.9a12 12 0 0 1 0 14.14"/><circle cx="12" cy="12" r="2"/>',
    mic:        '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/>',
    alerta:     '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    corazon:    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    reloj:      '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    filtro:     '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    telefono:   '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0 1 22 16.92z"/>',
    email:      '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    flechaArr:  '<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>',
    flechaAb:   '<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>',
    hospital:   '<rect x="3" y="6" width="18" height="15" rx="1"/><path d="M12 10v6M9 13h6M9 3v3M15 3v3"/>',
  };

  function icono(nombre, size = 20, color) {
    const body = iconos[nombre] || iconos.check;
    const st = color ? `style="color:${color}"` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${st}>${body}</svg>`;
  }

  function avatarFallback(texto = 'CA', bg = '#0B5FFF') {
    const iniciales = (texto || 'CA').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${encodeURIComponent(bg)}"/><text x="50" y="62" font-family="Arial,sans-serif" font-size="38" font-weight="bold" fill="%23ffffff" text-anchor="middle">${iniciales}</text></svg>`;
  }

  /* ------------------- Toasts ------------------- */
  let toastCont = null;
  function contToasts() {
    if (!toastCont) {
      toastCont = document.createElement('div');
      toastCont.className = 'toast-cont';
      document.body.appendChild(toastCont);
    }
    return toastCont;
  }

  function toast({ titulo, msj, tipo = 'info', duracion = 3500 } = {}) {
    const c = contToasts();
    const el = document.createElement('div');
    el.className = 'toast ' + tipo;
    const iconoMap = { exito: 'check', error: 'cruz', aviso: 'alerta', info: 'campana' };
    el.innerHTML = `
      <div class="icono">${icono(iconoMap[tipo] || 'check', 22)}</div>
      <div>
        <div class="titulo">${titulo}</div>
        ${msj ? `<div class="msj">${msj}</div>` : ''}
      </div>`;
    c.appendChild(el);
    setTimeout(() => {
      el.classList.add('saliendo');
      setTimeout(() => el.remove(), 250);
    }, duracion);
  }

  /* ------------------- Modales ------------------- */
  function modal({ titulo, cuerpo, pie, ancho, angosto, onClose } = {}) {
    const backdrop = document.createElement('div');
    backdrop.className = 'backdrop-modal';
    const clase = ancho ? 'ancho' : angosto ? 'angosto' : '';
    backdrop.innerHTML = `
      <div class="modal ${clase}" role="dialog" aria-modal="true">
        <div class="cabecera-modal">
          <h3>${titulo || ''}</h3>
          <button class="cerrar" aria-label="Cerrar" data-cerrar>${icono('cruz', 20)}</button>
        </div>
        <div class="cuerpo-modal">${typeof cuerpo === 'string' ? cuerpo : ''}</div>
        ${pie ? `<div class="pie-modal">${pie}</div>` : ''}
      </div>`;
    if (typeof cuerpo !== 'string') {
      const cuerpoEl = backdrop.querySelector('.cuerpo-modal');
      cuerpoEl.innerHTML = '';
      cuerpoEl.appendChild(cuerpo);
    }
    document.body.appendChild(backdrop);
    const cerrar = () => {
      backdrop.remove();
      onClose && onClose();
    };
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('[data-cerrar]')) cerrar();
    });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { cerrar(); document.removeEventListener('keydown', esc); }
    });
    return { cerrar, el: backdrop.querySelector('.modal') };
  }

  function confirmar({ titulo, mensaje, textoOk = 'Confirmar', textoCancel = 'Cancelar', peligroso = false } = {}) {
    return new Promise(resolve => {
      const m = modal({
        titulo,
        angosto: true,
        cuerpo: `<p>${mensaje}</p>`,
        pie: `
          <button class="btn btn-fantasma" data-cerrar>${textoCancel}</button>
          <button class="btn ${peligroso ? 'btn-peligro' : 'btn-primario'}" id="__ok">${textoOk}</button>
        `,
      });
      m.el.querySelector('#__ok').addEventListener('click', () => {
        m.cerrar();
        resolve(true);
      });
      m.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-cerrar]')) resolve(false);
      });
    });
  }

  /* ------------------- Formateadores ------------------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatearHora(iso) {
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function formatearFecha(iso) {
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
  function formatearFechaHora(iso) {
    return formatearFecha(iso) + ' ' + formatearHora(iso);
  }
  function haceCuanto(iso) {
    const seg = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seg < 60)   return 'hace ' + seg + 's';
    if (seg < 3600) return 'hace ' + Math.floor(seg / 60) + ' min';
    if (seg < 86400) return 'hace ' + Math.floor(seg / 3600) + ' h';
    return formatearFecha(iso);
  }
  function segundosADuracion(seg) {
    seg = Math.max(0, Math.floor(seg));
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${pad(m)}:${pad(s)}`;
  }

  /* ------------------- Export ------------------- */
  App.ui = {
    icono,
    avatarFallback,
    toast,
    modal,
    confirmar,
    formatearHora,
    formatearFecha,
    formatearFechaHora,
    haceCuanto,
    segundosADuracion,
    iconos,
  };
})();
