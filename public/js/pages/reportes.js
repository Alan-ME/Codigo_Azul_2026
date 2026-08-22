/* =========================================================
 *  Reportes estadísticos con filtros y 5+ gráficos.
 * ========================================================= */

(function () {
  const App = window.App;

  const state = {
    fDesde: '', fHasta: '',
    areasSel: new Set(),
    origen: 'todos',
    tipo: 'todos',
    enfermero: 'todos',
  };

  function filtrar() {
    return App.data.llamadosHistoricos.filter(l => {
      const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
      if (!p) return false;
      if (state.areasSel.size && !state.areasSel.has(p.areaId)) return false;
      if (state.origen !== 'todos' && l.origen !== state.origen) return false;
      if (state.tipo !== 'todos' && l.tipo !== state.tipo) return false;
      if (state.enfermero !== 'todos' && l.enfermeroId !== state.enfermero) return false;
      if (state.fDesde && l.horaInicio < state.fDesde) return false;
      if (state.fHasta && l.horaInicio > state.fHasta + 'T23:59:59') return false;
      return true;
    });
  }

  function render(cont) {
    const enfermeros = App.data.usuarios.filter(u => u.rol === 'enfermero');
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Analítica · Reportes</div>
          <h1>Reportes estadísticos</h1>
          <p class="tenue" style="margin-top:4px">Análisis operativo del sistema de alarmas del hospital.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secundario" id="expPdf">${App.ui.icono('descargar', 16)} PDF</button>
          <button class="btn btn-primario" id="expCsv">${App.ui.icono('descargar', 16)} CSV</button>
        </div>
      </div>

      <div class="reportes-layout">
        <aside class="panel-filtros">
          <div class="card">
            <h4>${App.ui.icono('filtro', 14)} Filtros</h4>
            <div class="grupo">
              <div class="campo"><label>Desde</label><input type="date" id="fDesde"></div>
              <div style="height:8px"></div>
              <div class="campo"><label>Hasta</label><input type="date" id="fHasta"></div>
            </div>
            <div class="grupo">
              <label class="mayuscula tenue" style="display:block;margin-bottom:6px">Áreas</label>
              <div id="chipsArea" style="display:flex;flex-wrap:wrap;gap:6px">
                ${App.data.areas.map(a => `<button class="chip" data-area="${a.id}">${a.abrev}</button>`).join('')}
              </div>
            </div>
            <div class="grupo">
              <div class="campo"><label>Origen</label>
                <select id="fOri">
                  <option value="todos">Todos</option>
                  ${App.data.origenesLlamado.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="grupo">
              <div class="campo"><label>Tipo</label>
                <select id="fTipo">
                  <option value="todos">Todos</option>
                  <option value="normal">Normal</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="codigo-azul">Código Azul</option>
                </select>
              </div>
            </div>
            <div class="grupo">
              <div class="campo"><label>Enfermero</label>
                <select id="fEnf">
                  <option value="todos">Todos</option>
                  ${enfermeros.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
                </select>
              </div>
            </div>
            <button class="btn btn-fantasma btn-bloque btn-sm" id="limpiar">Limpiar filtros</button>
          </div>
        </aside>

        <section id="dashReportes"></section>
      </div>
    `;

    document.getElementById('fDesde').addEventListener('change', (e) => { state.fDesde = e.target.value; pintar(); });
    document.getElementById('fHasta').addEventListener('change', (e) => { state.fHasta = e.target.value; pintar(); });
    document.getElementById('fOri').addEventListener('change', (e) => { state.origen = e.target.value; pintar(); });
    document.getElementById('fTipo').addEventListener('change', (e) => { state.tipo = e.target.value; pintar(); });
    document.getElementById('fEnf').addEventListener('change', (e) => { state.enfermero = e.target.value; pintar(); });
    document.getElementById('limpiar').addEventListener('click', () => {
      state.fDesde = ''; state.fHasta = '';
      state.areasSel.clear(); state.origen = 'todos'; state.tipo = 'todos'; state.enfermero = 'todos';
      render(cont);
    });
    document.getElementById('chipsArea').addEventListener('click', (e) => {
      const b = e.target.closest('[data-area]');
      if (!b) return;
      const id = b.dataset.area;
      if (state.areasSel.has(id)) state.areasSel.delete(id);
      else state.areasSel.add(id);
      b.classList.toggle('activo');
      pintar();
    });

    document.getElementById('expCsv').addEventListener('click', () => App.ui.toast({ titulo: 'Reporte CSV generado', tipo: 'exito' }));
    document.getElementById('expPdf').addEventListener('click', () => App.ui.toast({ titulo: 'Reporte PDF generado', tipo: 'exito' }));

    pintar();
  }

  function pintar() {
    const lista = filtrar();
    const cont = document.getElementById('dashReportes');
    const atendidos = lista.filter(l => l.estado === 'atendido').length;
    const noAtendidos = lista.filter(l => l.estado === 'no-atendido').length;
    const promResp = (() => {
      const arr = lista.filter(l => l.tiempoRespuestaSeg != null).map(l => l.tiempoRespuestaSeg);
      return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    })();

    cont.innerHTML = `
      <!-- Fila superior con KPI + tabla resumen -->
      <div class="kpi-grilla" style="grid-template-columns:repeat(3, 1fr);margin-bottom:20px">
        <div class="kpi">
          <div class="titulo">Total de llamados</div>
          <div class="valor">${lista.length}</div>
          <div class="delta tenue">período filtrado</div>
        </div>
        <div class="kpi tono-exito">
          <div class="titulo">Tasa de atención</div>
          <div class="valor">${lista.length ? Math.round(atendidos / lista.length * 100) : 0}%</div>
          <div class="delta positivo">${App.ui.icono('flechaArr', 12)} +4% vs mes anterior</div>
        </div>
        <div class="kpi tono-ambar">
          <div class="titulo">Tiempo prom. respuesta</div>
          <div class="valor">${App.ui.segundosADuracion(promResp)}</div>
          <div class="delta positivo">${App.ui.icono('flechaAb', 12)} -18s vs mes anterior</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="titulo-card"><h3>Resumen por tipo × estado</h3></div>
        <div class="tabla-scroll">
          <table class="tabla">
            <thead><tr><th>Tipo</th><th>Atendidos</th><th>No atendidos</th><th>Total</th><th>% atención</th></tr></thead>
            <tbody>
              ${['normal','emergencia','codigo-azul'].map(t => {
                const arr = lista.filter(l => l.tipo === t);
                const at = arr.filter(l => l.estado === 'atendido').length;
                const na = arr.filter(l => l.estado === 'no-atendido').length;
                const nom = t === 'codigo-azul' ? 'Código Azul' : t === 'emergencia' ? 'Emergencia' : 'Normal';
                const pct = arr.length ? Math.round(at / arr.length * 100) : 0;
                return `<tr>
                  <td><strong>${nom}</strong></td>
                  <td>${at}</td><td>${na}</td><td>${arr.length}</td>
                  <td><span class="badge ${pct >= 80 ? 'b-verde' : pct >= 50 ? 'b-ambar' : 'b-rojo'}">${pct}%</span></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="grilla-2">
        <div class="card">
          <div class="titulo-card"><h3>Atendidos vs no atendidos por área</h3></div>
          <div id="chBarras" class="chart-holder grande"></div>
        </div>
        <div class="card">
          <div class="titulo-card"><h3>Distribución por tipo de llamado</h3></div>
          <div id="chTorta" class="chart-holder grande"></div>
        </div>
      </div>

      <div class="card" style="margin-top:20px">
        <div class="titulo-card"><h3>Evolución diaria de llamados</h3></div>
        <div id="chLineas" class="chart-holder grande"></div>
      </div>

      <div class="grilla-2" style="margin-top:20px">
        <div class="card">
          <div class="titulo-card"><h3>Origen del llamado por área</h3></div>
          <div id="chApiladas" class="chart-holder grande"></div>
        </div>
        <div class="card">
          <div class="titulo-card"><h3>Ranking de enfermeros</h3></div>
          <div id="ranking" class="ranking"></div>
        </div>
      </div>
    `;

    setTimeout(() => {
      if (!document.getElementById('chBarras')) return; // el usuario ya navegó
      // 1) Barras por área — atendidos vs no atendidos
      const areasArr = App.data.areas;
      const datosBarrasApiladas = {
        categorias: areasArr.map(a => a.abrev),
        series: [
          { nombre: 'Atendidos', color: '#16A34A', valores: areasArr.map(a => lista.filter(l => {
            const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
            return p && p.areaId === a.id && l.estado === 'atendido';
          }).length) },
          { nombre: 'No atendidos', color: '#DC2626', valores: areasArr.map(a => lista.filter(l => {
            const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
            return p && p.areaId === a.id && l.estado === 'no-atendido';
          }).length) },
        ],
      };
      App.charts.barrasApiladas(document.getElementById('chBarras'), datosBarrasApiladas);

      // 2) Torta por tipo
      const porTipo = ['normal','emergencia','codigo-azul'].map(t => {
        const tp = App.data.tiposLlamado.find(x => x.id === t);
        return { label: tp.nombre, valor: lista.filter(l => l.tipo === t).length, color: tp.color };
      });
      App.charts.torta(document.getElementById('chTorta'), { datos: porTipo });

      // 3) Líneas por día
      const dias = {};
      lista.forEach(l => {
        const d = App.ui.formatearFecha(l.horaInicio);
        dias[d] = (dias[d] || 0) + 1;
      });
      const labels = Object.keys(dias).slice(0, 14).reverse();
      const vals = labels.map(l => dias[l]);
      App.charts.lineas(document.getElementById('chLineas'), {
        series: [{ nombre: 'Llamados', color: '#0B5FFF', valores: vals }],
        labelsX: labels,
      });

      // 4) Origen por área (apiladas)
      const origenesApiladas = {
        categorias: areasArr.map(a => a.abrev),
        series: [
          { nombre: 'Cama',    color: '#0B5FFF', valores: areasArr.map(a => cuenta(lista, a.id, 'cama')) },
          { nombre: 'Baño',    color: '#0EA5E9', valores: areasArr.map(a => cuenta(lista, a.id, 'baño')) },
          { nombre: 'Pulsera', color: '#8B5CF6', valores: areasArr.map(a => cuenta(lista, a.id, 'pulsera')) },
        ],
      };
      App.charts.barrasApiladas(document.getElementById('chApiladas'), origenesApiladas);

      // 5) Ranking enfermeros
      const ranking = App.data.usuarios.filter(u => u.rol === 'enfermero').map(e => {
        const suyos = lista.filter(l => l.enfermeroId === e.id && l.estado === 'atendido');
        const tiempos = suyos.map(l => l.tiempoRespuestaSeg).filter(Boolean);
        const prom = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;
        return { u: e, count: suyos.length, prom };
      }).sort((a, b) => b.count - a.count);

      document.getElementById('ranking').innerHTML = ranking.map((r, i) => `
        <div class="fila">
          <div class="pos">${i + 1}</div>
          <img class="avatar" src="${r.u.avatar}" alt="">
          <div class="nombre">${r.u.nombre}</div>
          <div class="metric"><strong>${r.count}</strong> atenciones · ${App.ui.segundosADuracion(r.prom)} prom.</div>
        </div>
      `).join('') || '<p class="tenue">Sin datos para los filtros elegidos.</p>';
    }, 0);
  }

  function cuenta(lista, areaId, origen) {
    return lista.filter(l => {
      const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
      return p && p.areaId === areaId && l.origen === origen;
    }).length;
  }

  App.pages.reportes = { titulo: 'Reportes', render };
})();
