// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/HistorialPage.jsx
// Módulo de Historial y Auditoría de Llamados con Paginación y Exportación.
// Replica 1:1 los filtros, tabla, CSV y PDF de public/js/pages/historial.js
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialAreas, initialPacientes, initialUsuarios, initialOrigenesLlamado } from '../data/mockData.js';
import { descargarTablaPDF } from '../services/pdfService.js';

const PDF_COLS = [
  { key: 'fecha',     label: 'Fecha',     w: 20 },
  { key: 'inicio',    label: 'Inicio',    w: 14 },
  { key: 'fin',       label: 'Fin',       w: 14 },
  { key: 'duracion',  label: 'Dur.',      w: 14, align: 'right' },
  { key: 'paciente',  label: 'Paciente',  w: 40 },
  { key: 'area',      label: 'Área',      w: 22 },
  { key: 'hab',       label: 'Hab.',      w: 14 },
  { key: 'origen',    label: 'Origen',    w: 18 },
  { key: 'tipo',      label: 'Tipo',      w: 22 },
  { key: 'enfermero', label: 'Enfermero', w: 32 },
  { key: 'estado',    label: 'Estado',    w: 20 },
  { key: 'tResp',     label: 'T. Resp.',  w: 14, align: 'right' },
];

export default function HistorialPage() {
  const { llamadosHistoricos } = useIncidentes();
  const { toast, formatearFecha, formatearHora, segundosADuracion } = useUI();

  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [fArea, setFArea] = useState('todas');
  const [fOrigen, setFOrigen] = useState('todos');
  const [fTipo, setFTipo] = useState('todos');
  const [fEstado, setFEstado] = useState('todos');
  const [fEnfermero, setFEnfermero] = useState('todos');
  const [q, setQ] = useState('');
  const [pagina, setPagina] = useState(1);
  const porPagina = 10;

  const enfermeros = useMemo(
    () => initialUsuarios.filter((u) => u.rol === 'enfermero'),
    []
  );

  const filtrados = useMemo(() => {
    return llamadosHistoricos.filter((l) => {
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const nombrePaciente = p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Emergencia en Cama');
      const areaId = p ? p.areaId : (l.ubicacion?.sectorSala || 'guardia');

      if (fArea !== 'todas' && areaId !== fArea) return false;
      if (fOrigen !== 'todos' && l.origen !== fOrigen) return false;
      if (fTipo !== 'todos' && l.tipo !== fTipo) return false;
      if (fEstado !== 'todos' && l.estado !== fEstado) return false;
      if (fEnfermero !== 'todos' && l.enfermeroId !== fEnfermero) return false;
      if (fDesde && l.horaInicio < fDesde) return false;
      if (fHasta && l.horaInicio > fHasta + 'T23:59:59') return false;
      if (q.trim()) {
        const query = q.toLowerCase();
        const dni = p?.dni || '';
        if (!nombrePaciente.toLowerCase().includes(query) && !dni.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [llamadosHistoricos, fArea, fOrigen, fTipo, fEstado, fEnfermero, fDesde, fHasta, q]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaActual = Math.min(pagina, totalPaginas);
  const desde = (paginaActual - 1) * porPagina;
  const itemsPagina = filtrados.slice(desde, desde + porPagina);

  const normalizarFilaPDF = (l) => {
    const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
    const a = p ? initialAreas.find((aa) => aa.id === p.areaId) : null;
    const e = initialUsuarios.find((u) => u.id === l.enfermeroId);
    return {
      fecha:     formatearFecha(l.horaInicio),
      inicio:    formatearHora(l.horaInicio),
      fin:       l.horaFin ? formatearHora(l.horaFin) : '—',
      duracion:  segundosADuracion(l.duracionSeg),
      paciente:  p ? `${p.nombre} ${p.apellido}` : (l.pacienteNombre || 'Emergencia en Cama'),
      area:      a?.nombre || l.ubicacion?.sectorSala || 'Guardia',
      hab:       p ? `${p.habitacion}/${p.cama}` : (l.ubicacion?.cama || 'Cama'),
      origen:    l.origen || 'cama',
      tipo:      l.tipo === 'codigo-azul' ? 'Código Azul' : (l.tipo || 'Emergencia'),
      enfermero: e?.nombre || l.reanimadorNombre || 'Enfermería',
      estado:    l.estado || 'atendido',
      tResp:     l.tiempoRespuestaSeg ? segundosADuracion(l.tiempoRespuestaSeg) : '',
    };
  };

  const filtrosLegibles = () => {
    const partes = [];
    if (fDesde) partes.push(`desde ${fDesde}`);
    if (fHasta) partes.push(`hasta ${fHasta}`);
    if (fArea !== 'todas') {
      const a = initialAreas.find((x) => x.id === fArea);
      partes.push(`área: ${a?.nombre || fArea}`);
    }
    if (fOrigen !== 'todos') partes.push(`origen: ${fOrigen}`);
    if (fTipo !== 'todos') partes.push(`tipo: ${fTipo}`);
    if (fEstado !== 'todos') partes.push(`estado: ${fEstado}`);
    if (fEnfermero !== 'todos') {
      const e = initialUsuarios.find((u) => u.id === fEnfermero);
      partes.push(`enfermero: ${e?.nombre || fEnfermero}`);
    }
    if (q) partes.push(`búsqueda: "${q}"`);
    return partes.length ? partes.join(' · ') : 'sin filtros aplicados';
  };

  const handleExportarCsv = () => {
    if (!filtrados.length) {
      toast({ titulo: 'Sin datos para exportar con los filtros actuales', tipo: 'aviso' });
      return;
    }
    const escapar = (v) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cabeceras = ['id','fecha','tipo','origen','paciente','area','habitacion','duracion_seg','enfermero','estado','tiempo_respuesta_seg'];
    const filas = filtrados.map((l) => {
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      const a = p && initialAreas.find((aa) => aa.id === p.areaId);
      const e = initialUsuarios.find((u) => u.id === l.enfermeroId);
      return [
        l.id,
        l.horaInicio,
        l.tipo,
        l.origen,
        p ? `${p.nombre} ${p.apellido}` : '',
        a?.nombre || '',
        p ? p.habitacion : '',
        l.duracionSeg,
        e?.nombre || '',
        l.estado,
        l.tiempoRespuestaSeg || '',
      ].map(escapar).join(',');
    });

    const blob = new Blob(['\uFEFF' + [cabeceras.join(','), ...filas].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-codigo-azul_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ titulo: `Historial CSV descargado (${filtrados.length} filas)`, tipo: 'exito' });
  };

  const handleExportarPdf = () => {
    if (!filtrados.length) {
      toast({ titulo: 'Sin datos para exportar con los filtros actuales', tipo: 'aviso' });
      return;
    }
    const atendidos = filtrados.filter((l) => l.estado === 'atendido').length;
    const noAtendidos = filtrados.filter((l) => l.estado === 'no-atendido').length;
    const tiempos = filtrados.filter((l) => l.tiempoRespuestaSeg != null).map((l) => l.tiempoRespuestaSeg);
    const promResp = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;

    const ok = descargarTablaPDF({
      titulo: 'Historial de llamados — Código Azul',
      nombreArchivo: `historial-codigo-azul_${new Date().toISOString().slice(0, 10)}.pdf`,
      filtros: filtrosLegibles(),
      kpis: [
        { t: 'Total registros',        v: String(filtrados.length) },
        { t: 'Atendidos',              v: String(atendidos) },
        { t: 'No atendidos',           v: String(noAtendidos) },
        { t: 'Tiempo prom. respuesta', v: segundosADuracion(promResp) },
      ],
      columnas: PDF_COLS,
      filas: filtrados.map(normalizarFilaPDF),
    });

    if (ok) {
      toast({ titulo: `Historial PDF descargado (${filtrados.length} llamados)`, tipo: 'exito' });
    }
  };

  return (
    <div className="historial-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Operación · Historial</div>
          <h1>Historial de llamados</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            {llamadosHistoricos.length} llamados registrados en total.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secundario" id="expPdf" onClick={handleExportarPdf}>
            <Icono nombre="descargar" size={16} /> PDF
          </button>
          <button type="button" className="btn btn-primario" id="expCsv" onClick={handleExportarCsv}>
            <Icono nombre="descargar" size={16} /> CSV
          </button>
        </div>
      </div>

      {/* ─── Barra de Filtros ─────────────────────────────────────── */}
      <div className="historial-filtros">
        <div className="campo">
          <label>Desde</label>
          <input type="date" value={fDesde} onChange={(e) => { setFDesde(e.target.value); setPagina(1); }} />
        </div>
        <div className="campo">
          <label>Hasta</label>
          <input type="date" value={fHasta} onChange={(e) => { setFHasta(e.target.value); setPagina(1); }} />
        </div>
        <div className="campo">
          <label>Área</label>
          <select value={fArea} onChange={(e) => { setFArea(e.target.value); setPagina(1); }}>
            <option value="todas">Todas</option>
            {initialAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Origen</label>
          <select value={fOrigen} onChange={(e) => { setFOrigen(e.target.value); setPagina(1); }}>
            <option value="todos">Todos</option>
            {initialOrigenesLlamado.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Tipo</label>
          <select value={fTipo} onChange={(e) => { setFTipo(e.target.value); setPagina(1); }}>
            <option value="todos">Todos</option>
            <option value="normal">Normal</option>
            <option value="emergencia">Emergencia</option>
            <option value="codigo-azul">Código Azul</option>
          </select>
        </div>
        <div className="campo">
          <label>Estado</label>
          <select value={fEstado} onChange={(e) => { setFEstado(e.target.value); setPagina(1); }}>
            <option value="todos">Todos</option>
            <option value="atendido">Atendido</option>
            <option value="no-atendido">No atendido</option>
          </select>
        </div>
        <div className="campo">
          <label>Enfermero</label>
          <select value={fEnfermero} onChange={(e) => { setFEnfermero(e.target.value); setPagina(1); }}>
            <option value="todos">Todos</option>
            {enfermeros.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Búsqueda libre</label>
          <input
            type="text"
            placeholder="Nombre o DNI"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPagina(1); }}
          />
        </div>
      </div>

      {/* ─── Tabla y Paginación ───────────────────────────────────── */}
      <div className="tabla-wrap">
        <div className="tabla-scroll">
          <table className="tabla" id="tabH">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th style={{ textAlign: 'right' }}>Dur.</th>
                <th>Paciente</th>
                <th>Área</th>
                <th>Hab.</th>
                <th>Origen</th>
                <th>Tipo</th>
                <th>Enfermero</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>T. Resp.</th>
              </tr>
            </thead>
            <tbody>
              {itemsPagina.length ? (
                itemsPagina.map((l) => {
                  const p = initialPacientes.find((pp) => pp.id === l.pacienteId) || initialPacientes[0];
                  const a = initialAreas.find((aa) => aa.id === p.areaId) || initialAreas[0];
                  const e = initialUsuarios.find((u) => u.id === l.enfermeroId);
                  const tipoBadge =
                    l.tipo === 'codigo-azul' ? (
                      <span className="badge b-azul-fuerte">Cód. Azul</span>
                    ) : l.tipo === 'emergencia' ? (
                      <span className="badge b-rojo">Emergencia</span>
                    ) : (
                      <span className="badge b-ambar">Normal</span>
                    );
                  const est =
                    l.estado === 'atendido' ? (
                      <span className="badge b-verde">Atendido</span>
                    ) : (
                      <span className="badge b-rojo">No atendido</span>
                    );

                  return (
                    <tr key={l.id}>
                      <td>{formatearFecha(l.horaInicio)}</td>
                      <td>{formatearHora(l.horaInicio)}</td>
                      <td>{l.horaFin ? formatearHora(l.horaFin) : '—'}</td>
                      <td style={{ textAlign: 'right' }}>{segundosADuracion(l.duracionSeg)}</td>
                      <td>
                        <strong>
                          {p.nombre} {p.apellido}
                        </strong>
                      </td>
                      <td>{a.nombre}</td>
                      <td>
                        {p.habitacion}/{p.cama}
                      </td>
                      <td>{l.origen}</td>
                      <td>{tipoBadge}</td>
                      <td>{e?.nombre || '—'}</td>
                      <td>{est}</td>
                      <td style={{ textAlign: 'right' }}>
                        {l.tiempoRespuestaSeg ? segundosADuracion(l.tiempoRespuestaSeg) : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className="tabla-vacia">
                    Sin resultados para los filtros elegidos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="paginacion" id="pag">
          <span>
            Mostrando {filtrados.length ? desde + 1 : 0}–{Math.min(desde + porPagina, filtrados.length)} de{' '}
            {filtrados.length}
          </span>
          <div className="paginas">
            <button
              type="button"
              disabled={paginaActual === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => (
              <button
                key={i + 1}
                type="button"
                className={paginaActual === i + 1 ? 'activo' : ''}
                onClick={() => setPagina(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              disabled={paginaActual === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
