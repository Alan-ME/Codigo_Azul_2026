// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/TableroPage.jsx
// Tablero de llamados en tiempo real (Kanban / Grilla)
// Replica 1:1 el HTML, CSS y funcionalidad de public/js/pages/tablero.js
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import ModalCancelacion from '../components/common/ModalCancelacion.jsx';
import { initialAreas, initialPacientes, initialUsuarios } from '../data/mockData.js';

export default function TableroPage() {
  const { user } = useAuth();
  const {
    llamadosActivos,
    tomarLlamado,
    atenderLlamado,
    cancelarLlamado,
    escalarLlamado,
    puedeUsuarioFinalizarLlamado,
    esUsuarioMiembroDelEquipo,
  } = useIncidentes();
  const { formatearHora, segundosADuracion, avatarFallback } = useUI();

  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');
  const [orden, setOrden] = useState('prioridad');
  const [tiempoActual, setTiempoActual] = useState(Date.now());
  const [incidenteACancelar, setIncidenteACancelar] = useState(null);

  // Timer para cronómetros cada 1 segundo
  useEffect(() => {
    const timer = setInterval(() => setTiempoActual(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const chips = [
    { id: 'todos', label: 'Todos', color: null },
    { id: 'codigo-azul', label: 'Código Azul', color: '#0047FF' },
    { id: 'emergencia', label: 'Emergencia', color: '#DC2626' },
    { id: 'normal', label: 'Normal', color: '#F59E0B' },
  ];

  // Filtrado y Ordenamiento
  const llamadosFiltrados = useMemo(() => {
    let list = [...llamadosActivos];

    if (filtroTipo !== 'todos') {
      list = list.filter((l) => l.tipo === filtroTipo);
    }

    if (filtroArea !== 'todas') {
      list = list.filter((l) => {
        const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
        const ubiMatch = (l.ubicacion?.sectorSala || '').toLowerCase().includes(filtroArea.toLowerCase());
        return (p && p.areaId === filtroArea) || ubiMatch || filtroArea === 'todas';
      });
    }

    const peso = { 'codigo-azul': 3, emergencia: 2, normal: 1 };
    if (orden === 'prioridad') {
      return [...list].sort((a, b) => (peso[b.tipo] || 1) - (peso[a.tipo] || 1) || a.horaInicio.localeCompare(b.horaInicio));
    }
    if (orden === 'tiempo') {
      return [...list].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }
    if (orden === 'area') {
      return [...list].sort((a, b) => {
        const pa = initialPacientes.find((p) => p.id === a.pacienteId);
        const pb = initialPacientes.find((p) => p.id === b.pacienteId);
        return (pa?.areaId || '').localeCompare(pb?.areaId || '');
      });
    }

    return list;
  }, [llamadosActivos, filtroTipo, filtroArea, orden]);

  return (
    <div className="tablero-page aparecer">
      {/* ─── Encabezado de Página ─────────────────────────────────── */}
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Operación · Tiempo real</div>
          <h1>Tablero de llamados</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Todos los llamados abiertos en el hospital, actualizados al segundo.
          </p>
        </div>
      </div>

      {/* ─── Barra de Filtros y Ordenamiento ──────────────────────── */}
      <div className="tablero-barra">
        <div className="filtros" id="filtroTipos">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${filtroTipo === c.id ? 'activo' : ''}`}
              onClick={() => setFiltroTipo(c.id)}
            >
              {c.color && <span className="punto" style={{ background: c.color }} />}
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select id="filArea" value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)}>
            <option value="todas">Todas las áreas</option>
            {initialAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <div className="orden">
            Ordenar:
            <select id="orden" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="prioridad">Prioridad</option>
              <option value="tiempo">Tiempo transcurrido</option>
              <option value="area">Área</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── Grilla de Tarjetas en Tiempo Real ────────────────────── */}
      <div className="grilla-llamados" id="grillaLlamados">
        {llamadosFiltrados.length === 0 ? (
          <div className="empty" style={{ gridColumn: '1 / -1' }}>
            <div className="ilustracion">
              <Icono nombre="check" size={48} />
            </div>
            <h3>Sin llamados activos</h3>
            <p>El equipo está al día. Cuando entre un llamado, va a aparecer acá al instante.</p>
          </div>
        ) : (
          llamadosFiltrados.map((l) => {
            const tieneUbi = Boolean(l.ubicacion && (l.ubicacion.sectorSala || l.ubicacion.cama));
            const p = !tieneUbi && l.pacienteId ? initialPacientes.find((pp) => pp.id === l.pacienteId) : null;
            const a = p ? initialAreas.find((aa) => aa.id === p.areaId) : null;
            const enf = l.enfermeroId ? initialUsuarios.find((u) => u.id === l.enfermeroId) : null;

            const nom = tieneUbi
              ? `Emergencia en ${l.ubicacion.cama || l.ubicacion.sectorSala || 'Cama'}`
              : p
              ? `${p.nombre} ${p.apellido}`
              : l.pacienteNombre || 'Código Azul Urgente';

            const ubi = tieneUbi
              ? `${l.ubicacion.sectorSala || ''} — ${l.ubicacion.cama || ''}`
              : a
              ? `${a.nombre} · Hab. ${p.habitacion} · Cama ${p.cama}`
              : 'Ubicación Hospital';

            const avatarSrc = p?.avatar || avatarFallback(nom);
            const enfNom = enf?.nombre
              ? enf.nombre.split(' ')[0]
              : l.enfermeroNombre
              ? l.enfermeroNombre.split(' ')[0]
              : 'Personal';

            const claseTipo =
              l.tipo === 'codigo-azul'
                ? 'tipo-codigo-azul'
                : l.tipo === 'emergencia'
                ? 'tipo-emergencia'
                : '';

            const badgeTipo =
              l.tipo === 'codigo-azul' ? (
                <span className="badge b-azul-fuerte">Código Azul</span>
              ) : l.tipo === 'emergencia' ? (
                <span className="badge b-rojo">Emergencia</span>
              ) : (
                <span className="badge b-ambar">Normal</span>
              );

            const inicio = new Date(l.horaInicio).getTime();
            const seg = Math.max(0, Math.floor((tiempoActual - inicio) / 1000));
            const cronometroTexto = segundosADuracion(seg);

            return (
              <article key={l.id} className={`tarjeta-llamado ${claseTipo}`} data-id={l.id}>
                <div className="cab-tarjeta">
                  <img className="avatar" src={avatarSrc} alt="" />
                  <div className="paciente">
                    <div className="nom">{nom}</div>
                    <div className="ubi">{ubi}</div>
                  </div>
                  <div className="cron">{cronometroTexto}</div>
                </div>

                {l.atendido && (
                  <div style={{ margin: '8px 12px 2px', padding: '5px 10px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '11.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icono nombre="check" size={13} />
                    <span>En atención: <strong>{l.reanimadorNombre || 'Dr. Ivan Cardozo'}</strong></span>
                  </div>
                )}

                <div className="fila-info">
                  <div>
                    <Icono nombre={l.origen === 'baño' ? 'bath' : 'cama'} size={14} />
                    <span>
                      Origen: <strong>{l.origen}</strong>
                    </span>
                  </div>
                  <div>{badgeTipo}</div>
                  <div>
                    <Icono nombre="reloj" size={14} />
                    <span>Inicio: {formatearHora(l.horaInicio)}</span>
                  </div>
                  <div>
                    <Icono nombre="usuarios" size={14} />
                    <span>{enfNom}</span>
                  </div>
                </div>

                <div className="botones">
                  {!l.atendido ? (
                    <button
                      type="button"
                      className="btn btn-secundario btn-sm"
                      onClick={() => tomarLlamado(l.id)}
                    >
                      <Icono nombre="check" size={14} /> Tomar
                    </button>
                  ) : null}

                  {puedeUsuarioFinalizarLlamado(l, user) ? (
                    <button
                      type="button"
                      className="btn btn-exito btn-sm"
                      onClick={() => atenderLlamado(l.id)}
                    >
                      Finalizar
                    </button>
                  ) : l.atendido && (
                    <button
                      type="button"
                      className="btn btn-secundario btn-sm"
                      disabled
                      style={{ opacity: 0.55, cursor: 'not-allowed' }}
                      title={`Solo ${l.reanimadorNombre || 'el reanimador asignado'} o un administrador pueden finalizar este llamado.`}
                    >
                      <Icono nombre="lock" size={12} /> Finalizar
                    </button>
                  )}

                  {l.tipo !== 'codigo-azul' ? (
                    <button
                      type="button"
                      className="btn btn-fantasma btn-sm"
                      title="Escalar a Código Azul"
                      onClick={() => escalarLlamado(l.id)}
                    >
                      <Icono nombre="alerta" size={14} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-fantasma btn-sm"
                      title="Cancelar Código Azul (Falsa Alarma)"
                      onClick={() => setIncidenteACancelar(l)}
                      style={{ color: '#f87171' }}
                    >
                      <Icono nombre="x" size={14} />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>

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
