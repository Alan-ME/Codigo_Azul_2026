// ─────────────────────────────────────────────────────────────
// client/src/pages/ReportesPage.jsx
// Reportes Estadísticos, Analítica Avanzada y Exportación Oficial en PDF.
// Modularizado con RankingEnfermerosTable y ResumenTipoEstadoCard.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { LineChart, PieChart, StackedBarChart } from '../components/common/Charts.jsx';
import {
  initialAreas,
  initialPacientes,
  initialUsuarios,
  initialOrigenesLlamado,
  initialTiposLlamado,
} from '../data/mockData.js';
import { descargarTablaPDF } from '../services/pdfService.js';

import RankingEnfermerosTable from '../components/reportes/RankingEnfermerosTable.jsx';
import ResumenTipoEstadoCard from '../components/reportes/ResumenTipoEstadoCard.jsx';

const PDF_COLS = [
  { key: 'id', label: 'ID', w: 20 },
  { key: 'horaInicio', label: 'Fecha/Hora', w: 34 },
  { key: 'tipo', label: 'Tipo', w: 20 },
  { key: 'estado', label: 'Estado', w: 22 },
  { key: 'origen', label: 'Origen', w: 18 },
  { key: 'area', label: 'Área', w: 20 },
  { key: 'enfermero', label: 'Enfermero', w: 30 },
  { key: 'tResp', label: 'T. Resp.', w: 18, align: 'right' },
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

  const enfermeros = useMemo(() => initialUsuarios.filter((u) => u.rol === 'enfermero'), []);

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
      series: initialOrigenesLlamado.map((o, idx) => {
        const colores = ['#0B5FFF', '#0EA5E9', '#8B5CF6', '#F59E0B', '#10B981'];
        return {
          nombre: o.nombre,
          color: colores[idx % colores.length],
          valores: initialAreas.map((a) => cuenta(a.id, o.id)),
        };
      }),
    };
  }, [lista]);

  // 5. Ranking de Enfermeros
  const ranking = useMemo(() => {
    const mapa = {};
    lista.forEach((l) => {
      if (!l.enfermeroId || l.estado !== 'atendido') return;
      if (!mapa[l.enfermeroId]) {
        const u = initialUsuarios.find((uu) => uu.id === l.enfermeroId);
        if (!u) return;
        mapa[l.enfermeroId] = { u, count: 0, tiempos: [] };
      }
      mapa[l.enfermeroId].count++;
      if (l.tiempoRespuestaSeg != null) {
        mapa[l.enfermeroId].tiempos.push(l.tiempoRespuestaSeg);
      }
    });

    return Object.values(mapa)
      .map((item) => ({
        u: item.u,
        count: item.count,
        prom: item.tiempos.length ? Math.round(item.tiempos.reduce((a, b) => a + b, 0) / item.tiempos.length) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [lista]);

  // Exportar PDF oficial
  const handleExportarPDF = async () => {
    const filas = lista.map((l) => {
      const pac = initialPacientes.find((p) => p.id === l.pacienteId);
      const a = initialAreas.find((x) => x.id === pac?.areaId);
      const enf = initialUsuarios.find((u) => u.id === l.enfermeroId);
      return {
        id: l.id,
        horaInicio: l.horaInicio.replace('T', ' ').slice(0, 16),
        tipo: l.tipo === 'codigo-azul' ? 'Código Azul' : l.tipo === 'emergencia' ? 'Emergencia' : 'Normal',
        estado: l.estado === 'atendido' ? 'Atendido' : 'No atendido',
        origen: l.origen,
        area: a?.abrev || '—',
        enfermero: enf?.nombre || '—',
        tResp: l.tiempoRespuestaSeg != null ? `${l.tiempoRespuestaSeg}s` : '—',
      };
    });

    const kpis = [
      { t: 'Total llamados', v: lista.length },
      { t: 'Tasa atención', v: `${tasaAtencion}%` },
      { t: 'Tiempo prom. respuesta', v: `${promResp}s` },
      { t: 'Código Azul', v: lista.filter((l) => l.tipo === 'codigo-azul').length },
    ];

    const filtrosTexto = [
      fDesde && `Desde: ${fDesde}`,
      fHasta && `Hasta: ${fHasta}`,
      origen !== 'todos' && `Origen: ${origen}`,
      tipo !== 'todos' && `Tipo: ${tipo}`,
      enfermero !== 'todos' && `Enfermero: ${initialUsuarios.find((u) => u.id === enfermero)?.nombre || enfermero}`,
      areasSel.size > 0 && `Áreas: ${Array.from(areasSel).map((id) => initialAreas.find((a) => a.id === id)?.abrev).join(', ')}`,
    ]
      .filter(Boolean)
      .join(' · ');

    const ok = await descargarTablaPDF({
      titulo: 'Reporte General de Llamados e Incidentes',
      nombreArchivo: `reporte_llamados_${new Date().toISOString().slice(0, 10)}.pdf`,
      filtros: filtrosTexto || 'Sin filtros específicos (todos los registros)',
      kpis,
      columnas: PDF_COLS,
      filas,
    });

    if (ok) toast({ titulo: 'PDF Generado', msj: 'El documento se descargó correctamente.', tipo: 'exito' });
    else toast({ titulo: 'Error al generar PDF', tipo: 'error' });
  };

  // Exportar CSV
  const handleExportarCSV = () => {
    if (!lista.length) {
      toast({ titulo: 'Sin datos para exportar', tipo: 'info' });
      return;
    }
    const headers = ['ID', 'Fecha/Hora', 'Tipo', 'Estado', 'Origen', 'Área', 'Enfermero', 'TiempoRespuestaSeg', 'DuracionSeg'];
    const rows = lista.map((l) => {
      const pac = initialPacientes.find((p) => p.id === l.pacienteId);
      const a = initialAreas.find((x) => x.id === pac?.areaId);
      const enf = initialUsuarios.find((u) => u.id === l.enfermeroId);
      return [
        l.id,
        l.horaInicio,
        l.tipo,
        l.estado,
        l.origen,
        a?.nombre || '',
        enf?.nombre || '',
        l.tiempoRespuestaSeg ?? '',
        l.duracionSeg ?? '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_llamados_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ titulo: 'CSV Descargado', msj: `${lista.length} registros exportados.`, tipo: 'exito' });
  };

  return (
    <div className="pagina">
      {/* Cabecera */}
      <div className="cabecera-pagina">
        <div>
          <h1>Reportes y Analítica</h1>
          <p className="tenue">Métricas de desempeño, tiempos de respuesta y análisis estadístico.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secundario" onClick={handleExportarCSV}>
            <Icono nombre="descargar" size={18} /> Exportar CSV
          </button>
          <button type="button" className="btn btn-primario" onClick={handleExportarPDF}>
            <Icono nombre="descargar" size={18} /> Exportar PDF Oficial
          </button>
        </div>
      </div>

      {/* Layout: Barra Lateral de Filtros + Tablero Analítico */}
      <div className="layout-reportes">
        {/* Barra Lateral de Filtros */}
        <aside className="panel-filtros-reportes">
          <div className="titulo-seccion">
            <Icono nombre="filtrar" size={16} /> Filtros de reporte
          </div>

          <div className="grupo-filtro">
            <label>Rango de fechas</label>
            <div className="rango-fechas">
              <input type="date" className="input" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
              <input type="date" className="input" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
            </div>
          </div>

          <div className="grupo-filtro">
            <label>Áreas hospitalarias</label>
            <div className="chips-areas">
              {initialAreas.map((a) => {
                const activo = areasSel.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`chip-area ${activo ? 'activo' : ''}`}
                    onClick={() => toggleArea(a.id)}
                  >
                    <span className="dot" style={{ background: a.color }} />
                    {a.abrev}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grupo-filtro">
            <label>Origen del llamado</label>
            <select className="select" value={origen} onChange={(e) => setOrigen(e.target.value)}>
              <option value="todos">Todos los orígenes</option>
              {initialOrigenesLlamado.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo-filtro">
            <label>Tipo de llamado</label>
            <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="todos">Todos los tipos</option>
              {initialTiposLlamado.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="grupo-filtro">
            <label>Enfermero/a</label>
            <select className="select" value={enfermero} onChange={(e) => setEnfermero(e.target.value)}>
              <option value="todos">Todo el personal</option>
              {enfermeros.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-secundario btn-full" onClick={limpiarFiltros}>
              <Icono nombre="limpiar" size={16} /> Limpiar filtros
            </button>
          </div>
        </aside>

        {/* Tablero Analítico Principal */}
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
          <ResumenTipoEstadoCard lista={lista} />

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
            <LineChart series={datosLineas.series} labelsX={datosLineas.labelsX} className="grande" />
          </div>

          {/* Gráficos Fila 3: Origen por área + Ranking */}
          <div className="grilla-2" style={{ marginTop: '20px' }}>
            <div className="card">
              <div className="titulo-card">
                <h3>Origen del llamado por área</h3>
              </div>
              <StackedBarChart categorias={origenesApiladas.categorias} series={origenesApiladas.series} className="grande" />
            </div>

            <RankingEnfermerosTable ranking={ranking} segundosADuracion={segundosADuracion} />
          </div>
        </section>
      </div>
    </div>
  );
}
