/* =========================================================
 *  Historial de llamados con filtros + paginación + export
 * ========================================================= */

(function () {
  const App = window.App;

  const state = {
    fDesde: '', fHasta: '',
    fArea: 'todas', fOrigen: 'todos', fTipo: 'todos',
    fEstado: 'todos', fEnfermero: 'todos', q: '',
    pagina: 1, porPagina: 10,
  };

  function filtrar() {
    return App.data.llamadosHistoricos.filter(l => {
      const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
      if (!p) return false;
      if (state.fArea !== 'todas' && p.areaId !== state.fArea) return false;
      if (state.fOrigen !== 'todos' && l.origen !== state.fOrigen) return false;
      if (state.fTipo !== 'todos' && l.tipo !== state.fTipo) return false;
      if (state.fEstado !== 'todos' && l.estado !== state.fEstado) return false;
      if (state.fEnfermero !== 'todos' && l.enfermeroId !== state.fEnfermero) return false;
      if (state.fDesde && l.horaInicio < state.fDesde) return false;
      if (state.fHasta && l.horaInicio > state.fHasta + 'T23:59:59') return false;
      if (state.q) {
        const q = state.q.toLowerCase();
        const nombreC = (p.nombre + ' ' + p.apellido).toLowerCase();
        if (!nombreC.includes(q) && !p.dni.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function exportar(formato) {
    App.ui.toast({ titulo: `Exportación ${formato.toUpperCase()} generada`, msj: 'Archivo listo para descargar (demo).', tipo: 'exito' });
    // Descarga dummy de CSV (funciona genuinamente para el CSV)
    if (formato === 'csv') {
      const lista = filtrar();
      const filas = [
        ['id','fecha','tipo','origen','paciente','area','habitacion','duracion(seg)','enfermero','estado','tiempoRespuesta(seg)'].join(','),
        ...lista.map(l => {
          const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
          const a = App.data.areas.find(aa => aa.id === p.areaId);
          const e = App.data.usuarios.find(u => u.id === l.enfermeroId);
          return [l.id, l.horaInicio, l.tipo, l.origen, `"${p.nombre} ${p.apellido}"`, a.nombre, p.habitacion, l.duracionSeg, `"${e?.nombre || ''}"`, l.estado, l.tiempoRespuestaSeg || ''].join(',');
        }),
      ].join('\n');
      const blob = new Blob([filas], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'historial-codigo-azul.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  function render(cont) {
    const enfermeros = App.data.usuarios.filter(u => u.rol === 'enfermero');
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Operación · Historial</div>
          <h1>Historial de llamados</h1>
          <p class="tenue" style="margin-top:4px">${App.data.llamadosHistoricos.length} llamados registrados en total.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secundario" id="expPdf">${App.ui.icono('descargar', 16)} PDF</button>
          <button class="btn btn-primario" id="expCsv">${App.ui.icono('descargar', 16)} CSV</button>
        </div>
      </div>

      <div class="historial-filtros">
        <div class="campo">
          <label>Desde</label>
          <input type="date" id="fDesde" value="${state.fDesde}">
        </div>
        <div class="campo">
          <label>Hasta</label>
          <input type="date" id="fHasta" value="${state.fHasta}">
        </div>
        <div class="campo">
          <label>Área</label>
          <select id="fArea"><option value="todas">Todas</option>${App.data.areas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}</select>
        </div>
        <div class="campo">
          <label>Origen</label>
          <select id="fOrigen"><option value="todos">Todos</option>${App.data.origenesLlamado.map(o => `<option value="${o.id}">${o.nombre}</option>`).join('')}</select>
        </div>
        <div class="campo">
          <label>Tipo</label>
          <select id="fTipo">
            <option value="todos">Todos</option>
            <option value="normal">Normal</option>
            <option value="emergencia">Emergencia</option>
            <option value="codigo-azul">Código Azul</option>
          </select>
        </div>
        <div class="campo">
          <label>Estado</label>
          <select id="fEstado">
            <option value="todos">Todos</option>
            <option value="atendido">Atendido</option>
            <option value="no-atendido">No atendido</option>
          </select>
        </div>
        <div class="campo">
          <label>Enfermero</label>
          <select id="fEnf">
            <option value="todos">Todos</option>
            ${enfermeros.map(e => `<option value="${e.id}">${e.nombre}</option>`).join('')}
          </select>
        </div>
        <div class="campo">
          <label>Búsqueda libre</label>
          <input type="text" id="q" placeholder="Nombre o DNI">
        </div>
      </div>

      <div class="tabla-wrap">
        <div class="tabla-scroll">
          <table class="tabla" id="tabH"></table>
        </div>
        <div class="paginacion" id="pag"></div>
      </div>
    `;

    ['fDesde','fHasta','fArea','fOrigen','fTipo','fEstado'].forEach(f => {
      document.getElementById(f).addEventListener('change', (e) => {
        state[f.startsWith('f') ? f : f] = e.target.value;
        state.pagina = 1;
        pintar();
      });
    });
    document.getElementById('fEnf').addEventListener('change', (e) => { state.fEnfermero = e.target.value; state.pagina = 1; pintar(); });
    document.getElementById('q').addEventListener('input', (e) => { state.q = e.target.value; state.pagina = 1; pintar(); });
    document.getElementById('expCsv').addEventListener('click', () => exportar('csv'));
    document.getElementById('expPdf').addEventListener('click', () => exportar('pdf'));

    pintar();
  }

  function pintar() {
    const lista = filtrar();
    const totalPag = Math.max(1, Math.ceil(lista.length / state.porPagina));
    if (state.pagina > totalPag) state.pagina = totalPag;
    const desde = (state.pagina - 1) * state.porPagina;
    const pag = lista.slice(desde, desde + state.porPagina);
    document.getElementById('tabH').innerHTML = `
      <thead><tr>
        <th>Fecha</th><th>Inicio</th><th>Fin</th><th>Dur.</th>
        <th>Paciente</th><th>Área</th><th>Hab.</th><th>Origen</th>
        <th>Tipo</th><th>Enfermero</th><th>Estado</th><th>T. Resp.</th>
      </tr></thead>
      <tbody>
        ${pag.length ? pag.map(l => {
          const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
          const a = App.data.areas.find(aa => aa.id === p.areaId);
          const e = App.data.usuarios.find(u => u.id === l.enfermeroId);
          const tipoBadge = l.tipo === 'codigo-azul' ? '<span class="badge b-azul-fuerte">Cód. Azul</span>' :
                            l.tipo === 'emergencia' ? '<span class="badge b-rojo">Emergencia</span>' :
                                                       '<span class="badge b-ambar">Normal</span>';
          const est = l.estado === 'atendido' ? '<span class="badge b-verde">Atendido</span>' : '<span class="badge b-rojo">No atendido</span>';
          return `
            <tr>
              <td>${App.ui.formatearFecha(l.horaInicio)}</td>
              <td>${App.ui.formatearHora(l.horaInicio)}</td>
              <td>${App.ui.formatearHora(l.horaFin)}</td>
              <td>${App.ui.segundosADuracion(l.duracionSeg)}</td>
              <td><strong>${p.nombre} ${p.apellido}</strong></td>
              <td>${a.nombre}</td>
              <td>${p.habitacion}/${p.cama}</td>
              <td>${l.origen}</td>
              <td>${tipoBadge}</td>
              <td>${e?.nombre || '—'}</td>
              <td>${est}</td>
              <td>${l.tiempoRespuestaSeg ? App.ui.segundosADuracion(l.tiempoRespuestaSeg) : '—'}</td>
            </tr>`;
        }).join('') : '<tr><td colspan="12" class="tabla-vacia">Sin resultados para los filtros elegidos.</td></tr>'}
      </tbody>
    `;
    const p = document.getElementById('pag');
    p.innerHTML = `
      <span>Mostrando ${lista.length ? desde + 1 : 0}–${Math.min(desde + state.porPagina, lista.length)} de ${lista.length}</span>
      <div class="paginas">
        <button ${state.pagina === 1 ? 'disabled' : ''} data-p="prev">‹</button>
        ${Array.from({ length: totalPag }, (_, i) => `<button data-p="${i + 1}" class="${state.pagina === i + 1 ? 'activo' : ''}">${i + 1}</button>`).join('')}
        <button ${state.pagina === totalPag ? 'disabled' : ''} data-p="next">›</button>
      </div>`;
    p.querySelectorAll('button[data-p]').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.p === 'prev') state.pagina = Math.max(1, state.pagina - 1);
      else if (b.dataset.p === 'next') state.pagina = Math.min(totalPag, state.pagina + 1);
      else state.pagina = +b.dataset.p;
      pintar();
    }));
  }

  App.pages.historial = { titulo: 'Historial de llamados', render };
})();
