// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/ReportesPage.jsx
// Reportes Estadísticos, Analítica Avanzada y Exportación Oficial en PDF.
// Replica 1:1 los gráficos, filtros, ranking y exportaciones de reportes.js
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { LineChart, PieChart, StackedBarChart } from '../components/common/Charts.jsx';
import { initialAreas, initialPacientes, initialUsuarios, initialOrigenesLlamado, initialTiposLlamado } from '../data/mockData.js';
import { descargarTablaPDF } from '../services/pdfService.js';

const PDF_COLS = [
  { key: 'id',          label: 'ID',         w: 20 },
  { key: 'horaInicio',  label: 'Fecha/Hora', w: 34 },
  { key: 'tipo',        label: 'Tipo',       w: 20 },
  { key: 'estado',      label: 'Estado',     w: 22 },
  { key: 'origen',      label: 'Origen',     w: 18 },
  { key: 'area',        label: 'Área',       w: 20 },
  { key: 'enfermero',   label: 'Enfermero',  w: 30 },
  { key: 'tResp',       label: 'T. Resp.',   w: 18, align: 'right' },
];

export default function ReportesPage() {
  const { llamadosHistoricos } = useIncidentes();
  const { toast, formatearFecha, segundosADuracion } = useUI();

  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [areasSel, setAreasSel] = useState(new Set());
  const [origen, setOrigen] = useState('todos');
  const [tipo, setTipo] = useState('todos');
  const [enfermero, setEnfermero] = useState('todos');

  const enfermeros = useMemo(
    () => initialUsuarios.filter((u) => u.rol === 'enfermero'),
    []
  );

  const toggleArea = (id) => {
    setAreasSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const limpiarFiltros = () => {
    setFDesde('');
    setFHasta('');
    setAreasSel(new Set());
    setOrigen('todos');
    setTipo('todos');
    setEnfermero('todos');
  };

  // Filtrado de llamados
  const lista = useMemo(() => {
    return llamadosHistoricos.filter((l) => {
      const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
      if (!p) return false;
      if (areasSel.size > 0 && !areasSel.has(p.areaId)) return false;
      if (origen !== 'todos' && l.origen !== origen) return false;
      if (tipo !== 'todos' && l.tipo !== tipo) return false;
      if (enfermero !== 'todos' && l.enfermeroId !== enfermero) return false;
      if (fDesde && l.horaInicio < fDesde) return false;
      if (fHasta && l.horaInicio > fHasta + 'T23:59:59') return false;
      return true;
    });
  }, [llamadosHistoricos, areasSel, origen, tipo, enfermero, fDesde, fHasta]);

  // KPIs
  const atendidos = useMemo(() => lista.filter((l) => l.estado === 'atendido').length, [lista]);
  const promResp = useMemo(() => {
    const arr = lista.filter((l) => l.tiempoRespuestaSeg != null).map((l) => l.tiempoRespuestaSeg);
    return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  }, [lista]);
  const tasaAtencion = lista.length ? Math.round((atendidos / lista.length) * 100) : 0;

  // 1. Gráfico Barras Apiladas: Atendidos vs No atendidos por área
  const datosBarrasApiladas = useMemo(() => {
    return {
      categorias: initialAreas.map((a) => a.abrev),
      series: [
        {
          nombre: 'Atendidos',
          color: '#16A34A',
          valores: initialAreas.map(
            (a) =>
              lista.filter((l) => {
                const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
                return p && p.areaId === a.id && l.estado === 'atendido';
              }).length
          ),
        },
        {
          nombre: 'No atendidos',
          color: '#DC2626',
          valores: initialAreas.map(
            (a) =>
              lista.filter((l) => {
                const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
                return p && p.areaId === a.id && l.estado === 'no-atendido';
              }).length
          ),
        },
      ],
    };
  }, [lista]);

  // 2. Gráfico de Torta: Distribución por tipo de llamado
  const datosTorta = useMemo(() => {
    return ['normal', 'emergencia', 'codigo-azul'].map((t) => {
      const tp = initialTiposLlamado.find((x) => x.id === t) || { nombre: t, color: '#0B5FFF' };
      return {
        label: tp.nombre,
        valor: lista.filter((l) => l.tipo === t).length,
        color: tp.color,
      };
    });
  }, [lista]);

  // 3. Gráfico de Líneas: Evolución diaria
  const datosLineas = useMemo(() => {
    const dias = {};
    lista.forEach((l) => {
      const d = formatearFecha(l.horaInicio);
      dias[d] = (dias[d] || 0) + 1;
    });
    const labels = Object.keys(dias).slice(0, 14).reverse();
    const vals = labels.map((l) => dias[l]);
    return {
      labelsX: labels,
      series: [{ nombre: 'Llamados', color: '#0B5FFF', valores: vals }],
    };
  }, [lista, formatearFecha]);

  // 4. Gráfico Barras Apiladas: Origen por área
  const origenesApiladas = useMemo(() => {
    const cuenta = (areaId, ori) => {
      return lista.filter((l) => {
        const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
        return p && p.areaId === areaId && l.origen === ori;
      }).length;
    };

    return {
      categorias: initialAreas.map((a) => a.abrev),
      series: [
        { nombre: 'Cama',    color: '#0B5FFF', valores: initialAreas.map((a) => cuenta(a.id, 'cama')) },
        { nombre: 'Baño',    color: '#0EA5E9', valores: initialAreas.map((a) => cuenta(a.id, 'baño')) },
        { nombre: 'Pulsera', color: '#8B5CF6', valores: initialAreas.map((a) => cuenta(a.id, 'pulsera')) },
      ],
    };
  }, [lista]);

  // 5. Ranking de Enfermeros
  const ranking = useMemo(() => {
    return enfermeros
      .map((e) => {
        const suyos = lista.filter((l) => l.enfermeroId === e.id && l.estado === 'atendido');
        const tiempos = suyos.map((l) => l.tiempoRespuestaSeg).filter(Boolean);
        const prom = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;
        return { u: e, count: suyos.length, prom };
      })
      .sort((a, b) => b.count - a.count);
  }, [lista, enfermeros]);

  // Exportaciones
  const filtrosLegibles = () => {
    const partes = [];
    if (fDesde) partes.push(`desde ${fDesde}`);
    if (fHasta) partes.push(`hasta ${fHasta}`);
    if (origen !== 'todos') {
      const o = initialOrigenesLlamado.find((x) => x.id === origen);
      partes.push(`origen: ${o?.nombre || origen}`);
    }
    if (tipo !== 'todos') partes.push(`tipo: ${tipo}`);
    if (enfermero !== 'todos') {
      const e = initialUsuarios.find((u) => u.id === enfermero);
      partes.push(`enfermero: ${e?.nombre || enfermero}`);
    }
    if (areasSel.size > 0) {
      const nombres = [...areasSel]
        .map((id) => initialAreas.find((a) => a.id === id)?.abrev)
        .filter(Boolean);
      partes.push(`áreas: ${nombres.join(', ')}`);
    }
    return partes.length ? partes.join(' · ') : 'sin filtros aplicados';
  };

  const handleExportarCsv = () => {
    if (!lista.length) {
      toast({ titulo: 'Sin datos para exportar con los filtros actuales', tipo: 'aviso' });
      return;
    }
    const escapar = (v) => {
      if (v == null) return '';
      const s = String(v);
      return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const cabeceras = ['id','fecha_inicio','fecha_fin','tipo','estado','origen','area','paciente','enfermero','tiempo_respuesta_seg'];
    const filas = lista.map((llamado) => {
      const paciente = initialPacientes.find((p) => p.id === llamado.pacienteId);
      const area = paciente && initialAreas.find((a) => a.id === paciente.areaId);
      const enf = initialUsuarios.find((u) => u.id === llamado.enfermeroId);
      return [
        llamado.id,
        llamado.horaInicio,
        llamado.horaFin || '',
        llamado.tipo,
        llamado.estado,
        llamado.origen,
        area?.nombre || '',
        paciente?.nombre || '',
        enf?.nombre || '',
        llamado.tiempoRespuestaSeg ?? '',
      ].map(escapar).join(',');
    });

    const blob = new Blob(['\uFEFF' + [cabeceras.join(','), ...filas].join('\r\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-codigo-azul_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast({ titulo: `Reporte CSV descargado (${lista.length} filas)`, tipo: 'exito' });
  };

  const handleExportarPdf = () => {
    if (!lista.length) {
      toast({ titulo: 'Sin datos para exportar con los filtros actuales', tipo: 'aviso' });
      return;
    }

    const normalizarFila = (llamado) => {
      const paciente = initialPacientes.find((p) => p.id === llamado.pacienteId);
      const area = paciente && initialAreas.find((a) => a.id === paciente.areaId);
      const enf = initialUsuarios.find((u) => u.id === llamado.enfermeroId);
      return {
        id:         llamado.id,
        horaInicio: String(llamado.horaInicio).replace('T', ' ').slice(0, 16),
        tipo:       llamado.tipo === 'codigo-azul' ? 'Código Azul' : llamado.tipo,
        estado:     llamado.estado,
        origen:     llamado.origen,
        area:       area?.abrev || area?.nombre || '',
        enfermero:  enf?.nombre || '',
        tResp:      llamado.tiempoRespuestaSeg != null ? segundosADuracion(llamado.tiempoRespuestaSeg) : '',
      };
    };

    const ok = descargarTablaPDF({
      titulo: 'Reporte estadístico — Código Azul',
      nombreArchivo: `reporte-codigo-azul_${new Date().toISOString().slice(0, 10)}.pdf`,
      filtros: filtrosLegibles(),
      kpis: [
        { t: 'Total de llamados',      v: String(lista.length) },
        { t: 'Tasa de atención',       v: `${tasaAtencion}%` },
        { t: 'Tiempo prom. respuesta', v: segundosADuracion(promResp) },
      ],
      columnas: PDF_COLS,
      filas: lista.map(normalizarFila),
    });

    if (ok) toast({ titulo: `Reporte PDF descargado (${lista.length} llamados)`, tipo: 'exito' });
  };

  return (
    <div className="reportes-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Analítica · Reportes</div>
          <h1>Reportes estadísticos</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Análisis operativo del sistema de alarmas del hospital.
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

      <div className="reportes-layout">
        {/* ─── Panel Lateral de Filtros ───────────────────────────── */}
        <aside className="panel-filtros">
          <div className="card">
            <h4>
              <Icono nombre="filtro" size={14} /> Filtros
            </h4>
            <div className="grupo">
              <div className="campo">
                <label>Desde</label>
                <input type="date" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
              </div>
              <div style={{ height: '8px' }} />
              <div className="campo">
                <label>Hasta</label>
                <input type="date" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
              </div>
            </div>

            <div className="grupo">
              <label className="mayuscula tenue" style={{ display: 'block', marginBottom: '6px' }}>
                Áreas
              </label>
              <div id="chipsArea" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {initialAreas.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`chip ${areasSel.has(a.id) ? 'activo' : ''}`}
                    onClick={() => toggleArea(a.id)}
                  >
                    {a.abrev}
                  </button>
                ))}
              </div>
            </div>

            <div className="grupo">
              <div className="campo">
                <label>Origen</label>
                <select value={origen} onChange={(e) => setOrigen(e.target.value)}>
                  <option value="todos">Todos</option>
                  {initialOrigenesLlamado.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grupo">
              <div className="campo">
                <label>Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="todos">Todos</option>
                  <option value="normal">Normal</option>
                  <option value="emergencia">Emergencia</option>
                  <option value="codigo-azul">Código Azul</option>
                </select>
              </div>
            </div>

            <div className="grupo">
              <div className="campo">
                <label>Enfermero</label>
                <select value={enfermero} onChange={(e) => setEnfermero(e.target.value)}>
                  <option value="todos">Todos</option>
                  {enfermeros.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-fantasma btn-bloque btn-sm"
              id="limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          </div>
        </aside>

        {/* ─── Tablero Analítico Principal ────────────────────────── */}
        <section id="dashReportes">
          {/* Fila superior con KPIs */}
          <div className="kpi-grilla" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '20px' }}>
            <div className="kpi">
              <div className="titulo">Total de llamados</div>
              <div className="valor">{lista.length}</div>
              <div className="delta tenue">período filtrado</div>
            </div>
            <div className="kpi tono-exito">
              <div className="titulo">Tasa de atención</div>
              <div className="valor">{tasaAtencion}%</div>
              <div className="delta positivo">
                <Icono nombre="flechaArr" size={12} /> +4% vs mes anterior
              </div>
            </div>
            <div className="kpi tono-ambar">
              <div className="titulo">Tiempo prom. respuesta</div>
              <div className="valor">{segundosADuracion(promResp)}</div>
              <div className="delta positivo">
                <Icono nombre="flechaAb" size={12} /> -18s vs mes anterior
              </div>
            </div>
          </div>

          {/* Resumen por tipo x estado */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div className="titulo-card">
              <h3>Resumen por tipo × estado</h3>
            </div>
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Atendidos</th>
                    <th>No atendidos</th>
                    <th>Total</th>
                    <th>% atención</th>
                  </tr>
                </thead>
                <tbody>
                  {['normal', 'emergencia', 'codigo-azul'].map((t) => {
                    const arr = lista.filter((l) => l.tipo === t);
                    const at = arr.filter((l) => l.estado === 'atendido').length;
                    const na = arr.filter((l) => l.estado === 'no-atendido').length;
                    const nom = t === 'codigo-azul' ? 'Código Azul' : t === 'emergencia' ? 'Emergencia' : 'Normal';
                    const pct = arr.length ? Math.round((at / arr.length) * 100) : 0;
                    return (
                      <tr key={t}>
                        <td>
                          <strong>{nom}</strong>
                        </td>
                        <td>{at}</td>
                        <td>{na}</td>
                        <td>{arr.length}</td>
                        <td>
                          <span
                            className={`badge ${
                              pct >= 80 ? 'b-verde' : pct >= 50 ? 'b-ambar' : 'b-rojo'
                            }`}
                          >
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Gráficos Fila 1 */}
          <div className="grilla-2">
            <div className="card">
              <div className="titulo-card">
                <h3>Atendidos vs no atendidos por área</h3>
              </div>
              <StackedBarChart
                categorias={datosBarrasApiladas.categorias}
                series={datosBarrasApiladas.series}
                className="grande"
              />
            </div>
            <div className="card">
              <div className="titulo-card">
                <h3>Distribución por tipo de llamado</h3>
              </div>
              <PieChart datos={datosTorta} className="grande" />
            </div>
          </div>

          {/* Gráfico Fila 2: Evolución Diaria */}
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="titulo-card">
              <h3>Evolución diaria de llamados</h3>
            </div>
            <LineChart
              series={datosLineas.series}
              labelsX={datosLineas.labelsX}
              className="grande"
            />
          </div>

          {/* Gráficos Fila 3: Origen por área + Ranking */}
          <div className="grilla-2" style={{ marginTop: '20px' }}>
            <div className="card">
              <div className="titulo-card">
                <h3>Origen del llamado por área</h3>
              </div>
              <StackedBarChart
                categorias={origenesApiladas.categorias}
                series={origenesApiladas.series}
                className="grande"
              />
            </div>

            <div className="card">
              <div className="titulo-card">
                <h3>Ranking de enfermeros</h3>
              </div>
              <div className="ranking" id="ranking">
                {ranking.length ? (
                  ranking.map((r, i) => (
                    <div key={r.u.id} className="fila">
                      <div className="pos">{i + 1}</div>
                      <img className="avatar" src={r.u.avatar} alt="" />
                      <div className="nombre">{r.u.nombre}</div>
                      <div className="metric">
                        <strong>{r.count}</strong> atenciones · {segundosADuracion(r.prom)} prom.
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="tenue">Sin datos para los filtros elegidos.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
