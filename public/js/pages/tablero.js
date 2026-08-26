/* =========================================================
 *  Tablero de llamados en tiempo real (kanban / grilla)
 * ========================================================= */

(function () {
  const App = window.App;

  const state = {
    filtroArea: 'todas',
    filtroTipo: 'todos',
    orden: 'prioridad',
  };

  function ordenar(lista) {
    const peso = { 'codigo-azul': 3, emergencia: 2, normal: 1 };
    if (state.orden === 'prioridad') {
      return [...lista].sort((a, b) => peso[b.tipo] - peso[a.tipo] || a.horaInicio.localeCompare(b.horaInicio));
    }
    if (state.orden === 'tiempo') {
      return [...lista].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    if (state.orden === 'area') {
      return [...lista].sort((a, b) => {
        const pa = App.data.pacientes.find(p => p.id === a.pacienteId);
        const pb = App.data.pacientes.find(p => p.id === b.pacienteId);
        return pa.areaId.localeCompare(pb.areaId);
      });
    }
    return lista;
  }

  function renderTarjetas() {
    let filtrados = App.data.llamadosActivos.filter(l => !l.atendido);
    if (state.filtroTipo !== 'todos') filtrados = filtrados.filter(l => l.tipo === state.filtroTipo);
    if (state.filtroArea !== 'todas') {
      filtrados = filtrados.filter(l => {
        const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
        return p && p.areaId === state.filtroArea;
      });
    }
    filtrados = ordenar(filtrados);
    const cont = document.getElementById('grillaLlamados');
    if (!filtrados.length) {
      cont.innerHTML = `
        <div class="empty" style="grid-column:1 / -1">
          <div class="ilustracion">${App.ui.icono('check', 48)}</div>
          <h3>Sin llamados activos</h3>
          <p>El equipo está al día. Cuando entre un llamado, va a aparecer acá al instante.</p>
        </div>`;
      return;
    }
    cont.innerHTML = filtrados.map(l => {
      const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
      const a = p ? App.data.areas.find(aa => aa.id === p.areaId) : null;
      const enf = l.enfermeroId ? App.data.usuarios.find(u => u.id === l.enfermeroId) : null;
      const nom = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul Urgente');
      const ubi = a ? `${a.nombre} · Hab. ${p.habitacion} · Cama ${p.cama}` : (l.ubicacion ? `${l.ubicacion.sectorSala || ''} — ${l.ubicacion.cama || ''}` : 'Ubicación Hospital');
      const avatarSrc = p?.avatar || App.ui.avatarFallback(nom);
      const enfNom = enf?.nombre ? enf.nombre.split(' ')[0] : (l.enfermeroNombre ? l.enfermeroNombre.split(' ')[0] : 'Personal');

      const claseTipo = l.tipo === 'codigo-azul' ? 'tipo-codigo-azul' :
                        l.tipo === 'emergencia' ? 'tipo-emergencia' : '';
      const badgeTipo = l.tipo === 'codigo-azul'
        ? '<span class="badge b-azul-fuerte">Código Azul</span>'
        : l.tipo === 'emergencia'
          ? '<span class="badge b-rojo">Emergencia</span>'
          : '<span class="badge b-ambar">Normal</span>';
      return `
        <article class="tarjeta-llamado ${claseTipo}" data-id="${l.id}">
          <div class="cab-tarjeta">
            <img class="avatar" src="${avatarSrc}" alt="">
            <div class="paciente">
              <div class="nom">${nom}</div>
              <div class="ubi">${ubi}</div>
            </div>
            <div class="cron" data-cronometro="${l.horaInicio}">00:00</div>
          </div>

          <div class="fila-info">
            <div>${App.ui.icono(l.origen === 'baño' ? 'bath' : 'cama', 14)} Origen: <strong>${l.origen}</strong></div>
            <div>${badgeTipo}</div>
            <div>${App.ui.icono('reloj', 14)} Inicio: ${App.ui.formatearHora(l.horaInicio)}</div>
            <div>${App.ui.icono('usuarios', 14)} ${enfNom}</div>
          </div>

          <div class="botones">
            <button class="btn btn-secundario btn-sm" data-accion="tomar">${App.ui.icono('check', 14)} Tomar</button>
            <button class="btn btn-exito btn-sm" data-accion="atender">Marcar atendido</button>
            <button class="btn btn-fantasma btn-sm" data-accion="escalar" title="Escalar a Código Azul">${App.ui.icono('alerta', 14)}</button>
          </div>
        </article>`;
    }).join('');
  }

  function render(cont) {
    cont.innerHTML = `
      <div class="cabecera-pagina">
        <div>
          <div class="rastro">Operación · Tiempo real</div>
          <h1>Tablero de llamados</h1>
          <p class="tenue" style="margin-top:4px">Todos los llamados abiertos en el hospital, actualizados al segundo.</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-secundario" id="btnSimular">${App.ui.icono('mas', 16)} Simular llamado</button>
        </div>
      </div>

      <div class="tablero-barra">
        <div class="filtros" id="filtroTipos"></div>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <select id="filArea">
            <option value="todas">Todas las áreas</option>
            ${App.data.areas.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
          </select>
          <div class="orden">Ordenar:
            <select id="orden">
              <option value="prioridad">Prioridad</option>
              <option value="tiempo">Tiempo transcurrido</option>
              <option value="area">Área</option>
            </select>
          </div>
        </div>
      </div>

      <div class="grilla-llamados" id="grillaLlamados"></div>
    `;

    // Chips de tipos
    const chips = [
      { id: 'todos', label: 'Todos', color: null },
      { id: 'codigo-azul', label: 'Código Azul', color: '#0047FF' },
      { id: 'emergencia', label: 'Emergencia', color: '#DC2626' },
      { id: 'normal', label: 'Normal', color: '#F59E0B' },
    ];
    document.getElementById('filtroTipos').innerHTML = chips.map(c => `
      <button class="chip ${state.filtroTipo === c.id ? 'activo' : ''}" data-tipo="${c.id}">
        ${c.color ? `<span class="punto" style="background:${c.color}"></span>` : ''}
        ${c.label}
      </button>
    `).join('');
    document.getElementById('filtroTipos').addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      state.filtroTipo = b.dataset.tipo;
      render(cont);
    });

    document.getElementById('filArea').value = state.filtroArea;
    document.getElementById('filArea').addEventListener('change', (e) => {
      state.filtroArea = e.target.value;
      renderTarjetas();
    });
    document.getElementById('orden').value = state.orden;
    document.getElementById('orden').addEventListener('change', (e) => {
      state.orden = e.target.value;
      renderTarjetas();
    });

    document.getElementById('btnSimular').addEventListener('click', simularLlamado);

    renderTarjetas();

    // Delegación de acciones en tarjetas
    document.getElementById('grillaLlamados').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-accion]');
      if (!btn) return;
      const card = btn.closest('.tarjeta-llamado');
      const id = card.dataset.id;
      const l = App.data.llamadosActivos.find(x => x.id === id);
      if (!l) return;
      const p = App.data.pacientes.find(pp => pp.id === l.pacienteId);
      const nombreMostrar = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Código Azul');

      if (btn.dataset.accion === 'tomar') {
        if (l.backendId && App.api && App.api.incidenteService) {
          try {
            await App.api.incidenteService.confirmarAck(l.backendId);
            App.ui.toast({ titulo: 'ACK Confirmado', msj: `${nombreMostrar} — asistencia registrada en PostgreSQL`, tipo: 'exito' });
          } catch (err) {
            App.ui.toast({ titulo: 'Aviso', msj: err.message, tipo: 'info' });
          }
        } else {
          App.ui.toast({ titulo: 'Llamado tomado', msj: `${nombreMostrar} — quedaste asignado/a`, tipo: 'info' });
        }
      } else if (btn.dataset.accion === 'atender') {
        if (l.backendId && App.api && App.api.incidenteService) {
          try {
            await App.api.incidenteService.cancelar(l.backendId, 'Atendido y resuelto en guardia');
            App.ui.toast({ titulo: 'Incidente Resuelto', msj: `${nombreMostrar} — cerrado en PostgreSQL`, tipo: 'exito' });
            App.data.llamadosActivos = App.data.llamadosActivos.filter(x => x.id !== l.id);
            renderTarjetas();
          } catch (err) {
            App.ui.toast({ titulo: 'Error', msj: err.message, tipo: 'error' });
          }
        } else {
          // Mover a histórico
          const dur = Math.floor((Date.now() - new Date(l.horaInicio).getTime()) / 1000);
          App.data.llamadosHistoricos.unshift({
            id: 'lh_' + Date.now(),
            pacienteId: l.pacienteId,
            tipo: l.tipo,
            origen: l.origen,
            estado: 'atendido',
            enfermeroId: l.enfermeroId,
            horaInicio: l.horaInicio,
            horaFin: new Date().toISOString(),
            duracionSeg: dur,
            tiempoRespuestaSeg: dur,
          });
          const i = App.data.llamadosActivos.indexOf(l);
          App.data.llamadosActivos.splice(i, 1);
          App.ui.toast({ titulo: 'Llamado atendido', msj: `${nombreMostrar} — cerrado correctamente`, tipo: 'exito' });
          renderTarjetas();
        }
      } else if (btn.dataset.accion === 'escalar') {
        l.tipo = 'codigo-azul';
        App.ui.toast({ titulo: 'Escalado a Código Azul', msj: `${nombreMostrar} — protocolo activado`, tipo: 'aviso' });
        renderTarjetas();
      }
    });
  }

  function simularLlamado() {
    const p = App.data.pacientes[Math.floor(Math.random() * App.data.pacientes.length)];
    const tipos = ['normal', 'normal', 'emergencia', 'codigo-azul'];
    const origenes = ['cama', 'baño', 'pulsera'];
    const enf = App.data.usuarios.find(u => u.rol === 'enfermero' && u.estado === 'activo');
    App.data.llamadosActivos.unshift({
      id: 'la_' + Date.now(),
      pacienteId: p.id,
      tipo: tipos[Math.floor(Math.random() * tipos.length)],
      origen: origenes[Math.floor(Math.random() * origenes.length)],
      enfermeroId: enf.id,
      horaInicio: new Date().toISOString(),
      atendido: false,
    });
    App.ui.toast({ titulo: 'Nuevo llamado', msj: `${p.nombre} ${p.apellido} — ${p.habitacion}`, tipo: 'info' });
    renderTarjetas();
  }

  App.pages.tablero = { titulo: 'Tablero de llamados', render };
})();
