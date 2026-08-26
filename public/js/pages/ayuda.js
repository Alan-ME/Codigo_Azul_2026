/* =========================================================
 *  Ayuda / Manual / Acerca de
 * ========================================================= */

(function () {
  const App = window.App;

  const secciones = {
    protocolo: {
      titulo: 'Protocolo Código Azul',
      body: `
        <p class="tenue" style="margin-bottom:16px">Este protocolo detalla el flujo estandarizado desde la detección de un evento crítico hasta el cierre del llamado en el sistema.</p>
        ${paso(1, 'El paciente activa el botón de alarma', 'El botón puede estar en la cama, en el baño, en una pulsera o accionarse por comando de voz según el área.')}
        ${paso(2, 'El sistema recibe la señal y clasifica el llamado', 'Se determina el tipo (Normal / Emergencia / Código Azul) y se muestra al enfermero asignado.')}
        ${paso(3, 'Notificación en tablero y app móvil', 'La tarjeta del llamado aparece en el tablero, se dispara un sonido y se envía notificación push a la app.')}
        ${paso(4, 'El enfermero toma el llamado', 'Presiona "Tomar" para marcarse como responsable de la atención.')}
        ${paso(5, 'Atención presencial del paciente', 'El personal se dirige a la cama y realiza el procedimiento. Si es Código Azul se activa el equipo de reanimación.')}
        ${paso(6, 'Cierre del llamado', 'Al finalizar, se registra "Atendido" con nota opcional. El tiempo de respuesta queda registrado.')}
        ${paso(7, 'Análisis y estadísticas', 'La información alimenta el módulo de reportes para monitorear la calidad de atención por área y por enfermero.')}
      `,
    },
    uso: {
      titulo: 'Cómo usar el sistema',
      body: `
        <h3 style="margin-bottom:8px">Navegación principal</h3>
        <p class="tenue" style="margin-bottom:14px">Usá el menú lateral para moverte entre secciones. Todo el sistema se opera con teclado y mouse.</p>
        <ul style="padding-left:20px;line-height:1.9">
          <li><strong>Dashboard</strong>: vista general con KPIs y gráficos.</li>
          <li><strong>Tablero en vivo</strong>: llamados abiertos en tiempo real.</li>
          <li><strong>Pacientes</strong>: ficha completa y ABM de pacientes.</li>
          <li><strong>Historial</strong>: consulta con filtros y exportación.</li>
          <li><strong>Reportes</strong>: estadísticas visuales para gestión.</li>
        </ul>
      `,
    },
    equipo: {
      titulo: 'Créditos del equipo',
      body: `
        <div class="grilla-2">
          <div class="card">
            <h4>Frontend</h4>
            <p class="tenue">Diseño de interfaces, tablero en tiempo real, reportes estadísticos y experiencia mobile.</p>
          </div>
          <div class="card">
            <h4>Backend</h4>
            <p class="tenue">API REST, autenticación, base de datos, integración con dispositivos físicos.</p>
          </div>
        </div>
        <p class="tenue" style="margin-top:14px">Trabajo integrador — ONETP 2026 · Programación.</p>
      `,
    },
    contacto: {
      titulo: 'Soporte y contacto',
      body: `
        <p class="tenue" style="margin-bottom:16px">Si necesitás ayuda con el sistema, contactate con nosotros por cualquiera de estos medios:</p>
        <div class="grilla-2">
          <div class="card"><h4>${App.ui.icono('email', 16)} Email</h4><p>soporte.codigoazul@hospital.gob.ar</p></div>
          <div class="card"><h4>${App.ui.icono('telefono', 16)} Interno</h4><p>2010 — Área de Sistemas</p></div>
        </div>
        <p class="tenue" style="margin-top:14px">Horario de atención: lunes a viernes de 08:00 a 20:00.</p>
      `,
    },
  };

  function paso(n, t, d) {
    return `<div class="protocolo-paso"><div class="num">${n}</div><div><h4>${t}</h4><p>${d}</p></div></div>`;
  }

  function render(cont) {
    let activa = 'protocolo';
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Otros · Ayuda</div>
          <h1>Manual y ayuda</h1>
          <p class="tenue" style="margin-top:4px">Todo lo que necesitás saber para usar el sistema Código Azul.</p>
        </div>
        <div class="badge b-azul">Versión 1.0.0</div>
      </div>

      <div class="ayuda-grilla">
        <nav class="ayuda-nav">
          ${Object.entries(secciones).map(([k, s]) => `
            <a href="#" data-k="${k}" class="${k === activa ? 'activo' : ''}">${s.titulo}</a>
          `).join('')}
        </nav>
        <div class="card" id="contAyuda"></div>
      </div>
    `;
    const pintar = () => {
      document.getElementById('contAyuda').innerHTML = `
        <h2 style="margin-bottom:12px">${secciones[activa].titulo}</h2>
        ${secciones[activa].body}
      `;
    };
    pintar();
    document.querySelectorAll('.ayuda-nav a').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      activa = a.dataset.k;
      document.querySelectorAll('.ayuda-nav a').forEach(x => x.classList.remove('activo'));
      a.classList.add('activo');
      pintar();
    }));
  }

  App.pages.ayuda = { titulo: 'Ayuda', render };
})();
