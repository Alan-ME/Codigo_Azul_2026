/* =========================================================
 *  Dashboard principal — centro de comando.
 * ========================================================= */

(function () {
  const App = window.App;

  function ultimos24hs() {
    // Genera un mock de llamados por hora de las últimas 24 horas
    // usando los históricos + activos.
    const buckets = new Array(24).fill(0);
    const ahora = new Date();
    App.data.llamadosHistoricos.forEach(l => {
      const d = new Date(l.horaInicio);
      const diff = (ahora - d) / 3600000;
      if (diff < 24) {
        const h = d.getHours();
        buckets[h]++;
      }
    });
    App.data.llamadosActivos.forEach(l => {
      const d = new Date(l.horaInicio);
      const h = d.getHours();
      buckets[h]++;
    });
    return buckets;
  }

  function render(cont) {
    const activos = App.data.llamadosActivos;
    const historicos = App.data.llamadosHistoricos;
    const hoy = new Date().toDateString();

    const llamadosHoy = historicos.filter(l => new Date(l.horaInicio).toDateString() === hoy).length + activos.length;
    const atendidosHoy = historicos.filter(l => new Date(l.horaInicio).toDateString() === hoy && l.estado === 'atendido').length;
    const noAtendidosHoy = historicos.filter(l => new Date(l.horaInicio).toDateString() === hoy && l.estado === 'no-atendido').length;
    const atendidosTiempos = historicos.filter(l => l.tiempoRespuestaSeg != null).map(l => l.tiempoRespuestaSeg);
    const promSeg = atendidosTiempos.length ? Math.round(atendidosTiempos.reduce((a, b) => a + b, 0) / atendidosTiempos.length) : 0;

    const codAzul = activos.find(l => l.tipo === 'codigo-azul' && !l.atendido) || activos.find(l => l.tipo === 'codigo-azul');
    let tituloCA = 'Código Azul';
    let detalleCA = 'Emergencia hospitalaria en curso';
    if (codAzul) {
      if (codAzul.ubicacion) {
        tituloCA = codAzul.ubicacion.sectorSala ? `${codAzul.ubicacion.sectorSala} — ${codAzul.ubicacion.cama || 'Cama'}` : 'Ubicación Hospitalaria';
        detalleCA = `${codAzul.ubicacion.edificio || ''} · ${codAzul.ubicacion.piso || ''} · Activado por: ${codAzul.enfermeroNombre || 'Personal Médico'}`;
      } else {
        const pacCA = App.data.pacientes.find(p => p.id === codAzul.pacienteId);
        const areaCA = pacCA ? App.data.areas.find(a => a.id === pacCA.areaId) : null;
        tituloCA = pacCA ? `${pacCA.nombre} ${pacCA.apellido}` : (codAzul.pacienteNombre || 'Paciente');
        detalleCA = `${areaCA?.nombre || ''} · Habitación ${pacCA?.habitacion || ''} — Cama ${pacCA?.cama || ''} · Origen: ${codAzul.origen || 'Cama'}`;
      }
    }

    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Panel de control · Vista general</div>
          <h1>Buenos días, ${App.auth.usuarioActual()?.nombre?.split(' ')[0] || ''} 👋</h1>
          <p class="tenue" style="margin-top:4px">Este es el estado del hospital al ${App.ui.formatearFechaHora(new Date().toISOString())}.</p>
        </div>
        <div style="display:flex;gap:8px">
          <a class="btn btn-secundario" href="#/tablero">${App.ui.icono('tablero', 18)} Ir al tablero</a>
          <a class="btn btn-primario" href="#/reportes">${App.ui.icono('reportes', 18)} Ver reportes</a>
        </div>
      </div>

      ${codAzul ? `
        <div class="banner-cod-azul" style="margin-bottom:20px">
          <div class="badge-cod">CÓDIGO AZUL ACTIVO</div>
          <div class="info">
            <h3>${tituloCA}</h3>
            <p>${detalleCA}</p>
          </div>
          <div class="cron" data-cronometro="${codAzul.horaInicio}">00:00</div>
          <a href="#/tablero" class="btn btn-peligro btn-lg">${App.ui.icono('alerta', 18)} Atender ahora</a>
        </div>
      ` : ''}

      <section class="kpi-grilla">
        <div class="kpi">
          <div class="icono">${App.ui.icono('campana', 20)}</div>
          <div class="titulo">Llamados hoy</div>
          <div class="valor">${llamadosHoy}</div>
          <div class="delta positivo">${App.ui.icono('flechaArr', 12)} +8% vs ayer</div>
        </div>
        <div class="kpi tono-exito">
          <div class="icono">${App.ui.icono('check', 20)}</div>
          <div class="titulo">Atendidos</div>
          <div class="valor">${atendidosHoy}</div>
          <div class="delta positivo">${App.ui.icono('flechaArr', 12)} +12% vs ayer</div>
        </div>
        <div class="kpi tono-emergencia">
          <div class="icono">${App.ui.icono('alerta', 20)}</div>
          <div class="titulo">No atendidos</div>
          <div class="valor">${noAtendidosHoy}</div>
          <div class="delta negativo">${App.ui.icono('flechaAb', 12)} -3% vs ayer</div>
        </div>
        <div class="kpi tono-ambar">
          <div class="icono">${App.ui.icono('reloj', 20)}</div>
          <div class="titulo">Tiempo promedio</div>
          <div class="valor">${App.ui.segundosADuracion(promSeg)}</div>
          <div class="delta positivo">${App.ui.icono('flechaAb', 12)} -14s vs ayer</div>
        </div>
      </section>

      <section class="grilla-dashboard">
        <div class="col-izq">
          <div class="card">
            <div class="titulo-card">
              <h3>Llamados por hora — últimas 24 hs</h3>
              <div class="acciones"><span class="badge b-azul">En vivo</span></div>
            </div>
            <div id="chartLineas" class="chart-holder grande"></div>
          </div>
          <div class="grilla-2">
            <div class="card">
              <div class="titulo-card">
                <h3>Distribución por tipo</h3>
              </div>
              <div id="chartTorta" class="chart-holder"></div>
            </div>
            <div class="card">
              <div class="titulo-card">
                <h3>Llamados por área</h3>
              </div>
              <div id="chartBarras" class="chart-holder"></div>
            </div>
          </div>
        </div>

        <div class="col-der">
          <div class="card">
            <div class="titulo-card">
              <h3>Últimos llamados</h3>
              <div class="acciones"><a href="#/tablero" class="btn btn-fantasma btn-sm">Ver tablero</a></div>
            </div>
            <div class="lista-ultimos" id="listaUltimos"></div>
          </div>
          <div class="card">
            <div class="titulo-card">
              <h3>Estado de camas por área</h3>
            </div>
            <div id="camasArea"></div>
          </div>
        </div>
      </section>
    `;

    // Datos y renders diferidos (esperamos que el DOM calcule dimensiones)
    function dibujarGraficos() {
      if (!document.getElementById('chartLineas')) return;
      const labelsH = Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' + i : '' + i) + ':00');
      const valores = ultimos24hs();
      App.charts.lineas(document.getElementById('chartLineas'), {
        series: [{ nombre: 'Llamados', color: '#0B5FFF', valores }],
        labelsX: labelsH,
      });

      const porTipo = ['normal', 'emergencia', 'codigo-azul'].map(t => {
        const total = App.data.llamadosHistoricos.filter(l => l.tipo === t).length +
                      App.data.llamadosActivos.filter(l => l.tipo === t).length;
        const tp = App.data.tiposLlamado.find(x => x.id === t);
        return { label: tp.nombre, valor: total, color: tp.color };
      });
      App.charts.torta(document.getElementById('chartTorta'), { datos: porTipo });

      const porArea = App.data.areas.map(a => ({
        label: a.abrev,
        color: a.color,
        valor: App.data.llamadosHistoricos.filter(l => {
          const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
          return p && p.areaId === a.id;
        }).length,
      })).sort((a, b) => b.valor - a.valor).slice(0, 6);
      App.charts.barras(document.getElementById('chartBarras'), { datos: porArea, orientacion: 'horizontal' });
    }

    setTimeout(() => {
      dibujarGraficos();

      // Últimos llamados
      const ult = App.data.llamadosHistoricos.slice(0, 5);
      const listaUlt = document.getElementById('listaUltimos');
      if (listaUlt) {
        listaUlt.innerHTML = ult.map(l => {
          const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
          const a = App.data.areas.find(aa => aa.id === p.areaId);
          const clase = l.tipo === 'codigo-azul' ? 'b-azul-fuerte' : l.tipo === 'emergencia' ? 'b-rojo' : 'b-ambar';
          return `<div class="item">
            <img class="avatar" src="${p.avatar}" alt="">
            <div class="datos">
              <div class="nom">${p.nombre} ${p.apellido}</div>
              <div class="info">${a.nombre} · Hab. ${p.habitacion}</div>
            </div>
            <div style="text-align:right">
              <span class="badge ${clase}">${l.tipo === 'codigo-azul' ? 'Código Azul' : l.tipo === 'emergencia' ? 'Emergencia' : 'Normal'}</span>
              <div class="hora">${App.ui.formatearHora(l.horaInicio)}</div>
            </div>
          </div>`;
        }).join('');
      }

      // Estado de camas por área
      const camasEl = document.getElementById('camasArea');
      if (camasEl) {
        camasEl.innerHTML = App.data.areas.slice(0, 5).map(a => {
          const pct = Math.round(a.camasOcupadas / a.camasTotales * 100);
          return `
            <div style="margin-bottom:12px">
              <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
                <span><span class="punto" style="background:${a.color}"></span> ${a.nombre}</span>
                <strong>${a.camasOcupadas}/${a.camasTotales}</strong>
              </div>
              <div style="height:8px;background:var(--superficie-2);border-radius:6px;overflow:hidden">
                <div style="width:${pct}%;height:100%;background:${a.color};border-radius:6px;transition:width 400ms"></div>
              </div>
            </div>`;
        }).join('');
      }
    }, 50);

    window.addEventListener('resize', () => {
      clearTimeout(window.__dashboardResizeTimer);
      window.__dashboardResizeTimer = setTimeout(dibujarGraficos, 150);
    }, { once: false });
  }

  App.pages.dashboard = { titulo: 'Dashboard', render };
})();
