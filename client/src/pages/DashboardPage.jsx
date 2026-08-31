// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/DashboardPage.jsx
// Panel Principal de Guardia: Métricas, Gráficos y Alerta de Código Azul.
// Replica 1:1 el HTML, CSS y comportamiento de public/js/pages/dashboard.js
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import ModalCancelacion from '../components/common/ModalCancelacion.jsx';
import { LineChart, BarChart, PieChart } from '../components/common/Charts.jsx';
import { initialAreas, initialPacientes, initialTiposLlamado } from '../data/mockData.js';

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    llamadosActivos,
    llamadosHistoricos,
    sirenaSilenciada,
    silenciarSirena,
    reactivarSirena,
    tomarLlamado,
    atenderLlamado,
    cancelarLlamado,
    puedeUsuarioFinalizarLlamado,
    esUsuarioMiembroDelEquipo,
  } = useIncidentes();
  const { formatearHora, formatearFechaHora, segundosADuracion } = useUI();

  const [tiempoActual, setTiempoActual] = useState(Date.now());
  const [incidenteACancelar, setIncidenteACancelar] = useState(null);

  // Ticker de 1 segundo para los cronómetros en vivo
  useEffect(() => {
    const timer = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hoy = new Date().toDateString();

  // Métricas KPI
  const llamadosHoy = useMemo(() => {
    return llamadosHistoricos.filter((l) => new Date(l.horaInicio).toDateString() === hoy).length + llamadosActivos.length;
  }, [llamadosHistoricos, llamadosActivos, hoy]);

  const atendidosHoy = useMemo(() => {
    return llamadosHistoricos.filter((l) => new Date(l.horaInicio).toDateString() === hoy && l.estado === 'atendido').length;
  }, [llamadosHistoricos, hoy]);

  const noAtendidosHoy = useMemo(() => {
    return llamadosHistoricos.filter((l) => new Date(l.horaInicio).toDateString() === hoy && l.estado === 'no-atendido').length;
  }, [llamadosHistoricos, hoy]);

  const promSeg = useMemo(() => {
    const atendidosTiempos = llamadosHistoricos.filter((l) => l.tiempoRespuestaSeg != null).map((l) => l.tiempoRespuestaSeg);
    return atendidosTiempos.length ? Math.round(atendidosTiempos.reduce((a, b) => a + b, 0) / atendidosTiempos.length) : 0;
  }, [llamadosHistoricos]);

  // Alerta de Código Azul Activo
  const codAzul = useMemo(() => {
    return llamadosActivos.find((l) => l.tipo === 'codigo-azul' && !l.atendido) || llamadosActivos.find((l) => l.tipo === 'codigo-azul');
  }, [llamadosActivos]);

  let tituloCA = 'Código Azul';
  let detalleCA = 'Emergencia hospitalaria en curso';
  if (codAzul) {
    if (codAzul.ubicacion) {
      tituloCA = codAzul.ubicacion.sectorSala ? `${codAzul.ubicacion.sectorSala} — ${codAzul.ubicacion.cama || 'Cama'}` : 'Ubicación Hospitalaria';
      detalleCA = `${codAzul.ubicacion.edificio || ''} · ${codAzul.ubicacion.piso || ''} · Activado por: ${codAzul.enfermeroNombre || 'Personal Médico'}`;
    } else {
      const pacCA = initialPacientes.find((p) => p.id === codAzul.pacienteId);
      const areaCA = pacCA ? initialAreas.find((a) => a.id === pacCA.areaId) : null;
      tituloCA = pacCA ? `${pacCA.nombre} ${pacCA.apellido}` : codAzul.pacienteNombre || 'Paciente';
      detalleCA = `${areaCA?.nombre || ''} · Habitación ${pacCA?.habitacion || ''} — Cama ${pacCA?.cama || ''} · Origen: ${codAzul.origen || 'Cama'}`;
    }
  }

  const cronometroCodAzul = useMemo(() => {
    if (!codAzul) return '00:00';
    const inicio = new Date(codAzul.horaInicio).getTime();
    const seg = Math.max(0, Math.floor((tiempoActual - inicio) / 1000));
    return segundosADuracion(seg);
  }, [codAzul, tiempoActual, segundosADuracion]);

  // Datos para Gráficos
  const datosLineas = useMemo(() => {
    const buckets = new Array(24).fill(0);
    const ahora = new Date();
    llamadosHistoricos.forEach((l) => {
      const d = new Date(l.horaInicio);
      const diff = (ahora - d) / 3600000;
      if (diff < 24) buckets[d.getHours()]++;
    });
    llamadosActivos.forEach((l) => {
      const d = new Date(l.horaInicio);
      buckets[d.getHours()]++;
    });
    const labelsX = Array.from({ length: 24 }, (_, i) => (i < 10 ? '0' + i : '' + i) + ':00');
    return {
      labelsX,
      series: [{ nombre: 'Llamados', color: '#0B5FFF', valores: buckets }],
    };
  }, [llamadosHistoricos, llamadosActivos]);

  const datosTorta = useMemo(() => {
    return ['normal', 'emergencia', 'codigo-azul'].map((t) => {
      const total =
        llamadosHistoricos.filter((l) => l.tipo === t).length +
        llamadosActivos.filter((l) => l.tipo === t).length;
      const tp = initialTiposLlamado.find((x) => x.id === t) || { nombre: t, color: '#0B5FFF' };
      return { label: tp.nombre, valor: total, color: tp.color };
    });
  }, [llamadosHistoricos, llamadosActivos]);

  const datosBarras = useMemo(() => {
    return initialAreas
      .map((a) => ({
        label: a.abrev,
        color: a.color,
        valor: llamadosHistoricos.filter((l) => {
          const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
          return p && p.areaId === a.id;
        }).length,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6);
  }, [llamadosHistoricos]);

  const ultimosLlamados = useMemo(() => {
    return llamadosHistoricos.slice(0, 5);
  }, [llamadosHistoricos]);

  return (
    <div className="dashboard-page aparecer">
      {/* ─── Encabezado de Página ─────────────────────────────────── */}
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Panel de control · Vista general</div>
          <h1>Buenos días, {user?.nombre?.split(' ')[0] || ''} 👋</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Este es el estado del hospital al {formatearFechaHora(new Date().toISOString())}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <NavLink className="btn btn-secundario" to="/tablero">
            <Icono nombre="tablero" size={18} /> Ir al tablero
          </NavLink>
          <NavLink className="btn btn-primario" to="/reportes">
            <Icono nombre="reportes" size={18} /> Ver reportes
          </NavLink>
        </div>
      </div>

      {/* ─── Banner Código Azul Activo ───────────────────────────── */}
      {codAzul && (
        <div
          className="banner-cod-azul"
          style={{
            marginBottom: '20px',
            background: codAzul.atendido
              ? 'linear-gradient(135deg, rgba(5, 150, 105, 0.95), rgba(15, 23, 42, 0.95))'
              : undefined,
          }}
        >
          <div
            className="badge-cod"
            style={{ background: codAzul.atendido ? '#10b981' : undefined }}
          >
            {codAzul.atendido ? '✓ EN ATENCIÓN MÉDICA' : '🚨 CÓDIGO AZUL ACTIVO'}
          </div>
          <div className="info">
            <h3>{tituloCA}</h3>
            <p>
              {codAzul.atendido
                ? `👨‍⚕️ En atención por: ${codAzul.reanimadorNombre || 'Dr. Ivan Cardozo'} · ${detalleCA}`
                : codAzul.reanimadorNombre
                ? `👨‍⚕️ Asistencia: ${codAzul.reanimadorNombre} (en camino)`
                : detalleCA}
            </p>
          </div>
          <div className="cron">{cronometroCodAzul}</div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={sirenaSilenciada ? reactivarSirena : silenciarSirena}
              style={{
                background: sirenaSilenciada ? 'rgba(255,255,255,0.15)' : 'rgba(220,38,38,0.2)',
                borderColor: 'rgba(255,255,255,0.3)',
                color: '#ffffff',
              }}
            >
              <Icono nombre="campana" size={16} />
              {sirenaSilenciada ? 'Reactivar sirena' : 'Silenciar sirena'}
            </button>

            {!codAzul.atendido && (
              <button
                type="button"
                className="btn btn-primario"
                onClick={() => tomarLlamado(codAzul.id)}
              >
                <Icono nombre="check" size={18} /> Confirmar Asistencia (ACK)
              </button>
            )}

            {puedeUsuarioFinalizarLlamado(codAzul, user) ? (
              <button
                type="button"
                className="btn btn-exito"
                onClick={() => atenderLlamado(codAzul.id)}
                style={{ background: '#16a34a', color: '#ffffff' }}
              >
                <Icono nombre="check" size={18} /> Marcar Atendido / Finalizar
              </button>
            ) : codAzul.atendido && (
              <button
                type="button"
                className="btn"
                disabled
                style={{
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#94a3b8',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
                title="Debés sumarte al equipo de RCP (+ Sumarme al equipo) o ser Administrador para poder finalizar este Código Azul."
              >
                🔒 Finalizar (Solo Equipo / Admin)
              </button>
            )}

            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => setIncidenteACancelar(codAzul)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                borderColor: '#ef4444',
                color: '#fca5a5',
              }}
            >
              <Icono nombre="x" size={16} /> Cancelar Alarma
            </button>

            <NavLink to="/tablero" className="btn btn-peligro">
              <Icono nombre="alerta" size={18} /> Ver en tablero
            </NavLink>
          </div>
        </div>
      )}

      {/* ─── Grilla de KPIs ──────────────────────────────────────── */}
      <section className="kpi-grilla">
        <div className="kpi">
          <div className="icono">
            <Icono nombre="campana" size={20} color="#ffffff" />
          </div>
          <div className="titulo">Llamados hoy</div>
          <div className="valor">{llamadosHoy}</div>
          <div className="delta positivo">
            <Icono nombre="flechaArr" size={12} /> +8% vs ayer
          </div>
        </div>

        <div className="kpi tono-exito">
          <div className="icono">
            <Icono nombre="check" size={20} color="#ffffff" />
          </div>
          <div className="titulo">Atendidos</div>
          <div className="valor">{atendidosHoy}</div>
          <div className="delta positivo">
            <Icono nombre="flechaArr" size={12} /> +12% vs ayer
          </div>
        </div>

        <div className="kpi tono-emergencia">
          <div className="icono">
            <Icono nombre="alerta" size={20} color="#ffffff" />
          </div>
          <div className="titulo">No atendidos</div>
          <div className="valor">{noAtendidosHoy}</div>
          <div className="delta negativo">
            <Icono nombre="flechaAb" size={12} /> -3% vs ayer
          </div>
        </div>

        <div className="kpi tono-ambar">
          <div className="icono">
            <Icono nombre="reloj" size={20} color="#ffffff" />
          </div>
          <div className="titulo">Tiempo promedio</div>
          <div className="valor">{segundosADuracion(promSeg)}</div>
          <div className="delta positivo">
            <Icono nombre="flechaAb" size={12} /> -14s vs ayer
          </div>
        </div>
      </section>

      {/* ─── Grilla Principal del Dashboard ───────────────────────── */}
      <section className="grilla-dashboard">
        {/* Columna Izquierda: Gráficos */}
        <div className="col-izq">
          <div className="card">
            <div className="titulo-card">
              <h3>Llamados por hora — últimas 24 hs</h3>
              <div className="acciones">
                <span className="badge b-azul">En vivo</span>
              </div>
            </div>
            <LineChart series={datosLineas.series} labelsX={datosLineas.labelsX} className="grande" />
          </div>

          <div className="grilla-2">
            <div className="card">
              <div className="titulo-card">
                <h3>Distribución por tipo</h3>
              </div>
              <PieChart datos={datosTorta} />
            </div>

            <div className="card">
              <div className="titulo-card">
                <h3>Llamados por área</h3>
              </div>
              <BarChart datos={datosBarras} orientacion="horizontal" />
            </div>
          </div>
        </div>

        {/* Columna Derecha: Listas y Camas */}
        <div className="col-der">
          <div className="card">
            <div className="titulo-card">
              <h3>Últimos llamados</h3>
              <div className="acciones">
                <NavLink to="/tablero" className="btn btn-fantasma btn-sm">
                  Ver tablero
                </NavLink>
              </div>
            </div>
            <div className="lista-ultimos">
              {ultimosLlamados.map((l) => {
                const p = initialPacientes.find((pp) => pp.id === l.pacienteId) || initialPacientes[0];
                const a = initialAreas.find((aa) => aa.id === p.areaId) || initialAreas[0];
                const clase =
                  l.tipo === 'codigo-azul'
                    ? 'b-azul-fuerte'
                    : l.tipo === 'emergencia'
                    ? 'b-rojo'
                    : 'b-ambar';

                return (
                  <div key={l.id} className="item">
                    <img className="avatar" src={p.avatar} alt="" />
                    <div className="datos">
                      <div className="nom">
                        {p.nombre} {p.apellido}
                      </div>
                      <div className="info">
                        {a.nombre} · Hab. {p.habitacion}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${clase}`}>
                        {l.tipo === 'codigo-azul' ? 'Código Azul' : l.tipo === 'emergencia' ? 'Emergencia' : 'Normal'}
                      </span>
                      <div className="hora">{formatearHora(l.horaInicio)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="titulo-card">
              <h3>Estado de camas por área</h3>
            </div>
            <div>
              {initialAreas.slice(0, 5).map((a) => {
                const pct = Math.round((a.camasOcupadas / a.camasTotales) * 100);
                return (
                  <div key={a.id} style={{ marginBottom: '12px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12.5px',
                        marginBottom: '4px',
                      }}
                    >
                      <span>
                        <span className="punto" style={{ background: a.color }} /> {a.nombre}
                      </span>
                      <strong>
                        {a.camasOcupadas}/{a.camasTotales}
                      </strong>
                    </div>
                    <div
                      style={{
                        height: '8px',
                        background: 'var(--superficie-2)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: a.color,
                          borderRadius: '6px',
                          transition: 'width 400ms',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Cancelación de Código Azul */}
      <ModalCancelacion
        abierto={!!incidenteACancelar}
        incidente={incidenteACancelar}
        onConfirmar={cancelarLlamado}
        onCerrar={() => setIncidenteACancelar(null)}
      />
    </div>
  );
}
