// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/AreasPage.jsx
// Gestión de Áreas y Pabellones del Hospital (Solo Admin).
// Replica 1:1 el HTML, CSS y modales de public/js/pages/areas.js
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialAreas, initialPacientes, initialUsuarios } from '../data/mockData.js';

export default function AreasPage() {
  const { toast, abrirModal, cerrarModal } = useUI();
  const { llamadosActivos } = useIncidentes();

  const [areas, setAreas] = useState(initialAreas);
  const [areaDetalleId, setAreaDetalleId] = useState(null);

  const areaSeleccionada = areas.find((a) => a.id === areaDetalleId) || null;

  const modalArea = (a = null) => {
    const edicion = !!a;
    let formState = {
      nombre: a?.nombre || '',
      abrev: a?.abrev || '',
      color: a?.color || '#0B5FFF',
      descripcion: a?.descripcion || '',
      habitaciones: a?.habitaciones || 0,
      camasTotales: a?.camasTotales || 0,
      responsable: a?.responsable || '',
    };

    const Formulario = () => {
      const [f, setF] = useState(formState);
      const update = (k, v) => {
        setF((prev) => {
          const next = { ...prev, [k]: v };
          formState = next;
          return next;
        });
      };

      return (
        <div className="grid-form">
          <div className="campo full">
            <label>
              Nombre<span className="obligatorio">*</span>
            </label>
            <input
              value={f.nombre}
              onChange={(e) => update('nombre', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Abreviatura</label>
            <input
              placeholder="Ej: UTI"
              value={f.abrev}
              onChange={(e) => update('abrev', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Color de identificación</label>
            <input
              type="color"
              value={f.color}
              onChange={(e) => update('color', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Descripción</label>
            <textarea
              value={f.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Habitaciones</label>
            <input
              type="number"
              min="0"
              value={f.habitaciones}
              onChange={(e) => update('habitaciones', +e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Camas totales</label>
            <input
              type="number"
              min="0"
              value={f.camasTotales}
              onChange={(e) => update('camasTotales', +e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Responsable</label>
            <input
              value={f.responsable}
              onChange={(e) => update('responsable', e.target.value)}
            />
          </div>
        </div>
      );
    };

    abrirModal({
      titulo: (edicion ? 'Editar ' : 'Nueva ') + 'área',
      cuerpo: <Formulario />,
      pie: (
        <>
          <button type="button" className="btn btn-fantasma" onClick={cerrarModal}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={() => {
              const { nombre, abrev, color, descripcion, habitaciones, camasTotales, responsable } = formState;
              if (!nombre.trim()) {
                toast({ titulo: 'Falta el nombre', tipo: 'error' });
                return;
              }
              const datos = {
                nombre: nombre.trim(),
                abrev: (abrev || nombre.slice(0, 3)).toUpperCase(),
                color,
                descripcion,
                habitaciones: +habitaciones || 0,
                camasTotales: +camasTotales || 0,
                responsable,
              };

              if (edicion) {
                setAreas((prev) =>
                  prev.map((item) => (item.id === a.id ? { ...item, ...datos } : item))
                );
                toast({ titulo: 'Área actualizada', tipo: 'exito' });
              } else {
                setAreas((prev) => [
                  ...prev,
                  { id: 'a_' + Date.now(), camasOcupadas: 0, ...datos },
                ]);
                toast({ titulo: 'Área creada', tipo: 'exito' });
              }
              cerrarModal();
            }}
          >
            {edicion ? 'Guardar' : 'Crear área'}
          </button>
        </>
      ),
    });
  };

  // ─── Render: Detalle de Área ─────────────────────────────────────
  if (areaSeleccionada) {
    const a = areaSeleccionada;
    const pacs = initialPacientes.filter((p) => p.areaId === a.id);
    const enfs = initialUsuarios.filter((u) => u.areaId === a.id);
    const ocupacionPct = a.camasTotales > 0 ? Math.round((a.camasOcupadas / a.camasTotales) * 100) : 0;

    return (
      <div className="areas-detalle aparecer">
        <div className="cabecera-pagina">
          <div>
            <div className="rastro">
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setAreaDetalleId(null)}
              >
                Áreas
              </span>{' '}
              · Detalle
            </div>
            <h1>{a.nombre}</h1>
            <p className="tenue">{a.descripcion}</p>
          </div>
          <button
            type="button"
            className="btn btn-fantasma"
            onClick={() => setAreaDetalleId(null)}
          >
            Volver
          </button>
        </div>

        <div className="kpi-grilla" style={{ marginBottom: '20px' }}>
          <div className="kpi">
            <div className="titulo">Camas</div>
            <div className="valor">
              {a.camasOcupadas}/{a.camasTotales}
            </div>
            <div className="delta tenue">{ocupacionPct}% ocupación</div>
          </div>
          <div className="kpi tono-exito">
            <div className="titulo">Habitaciones</div>
            <div className="valor">{a.habitaciones}</div>
          </div>
          <div className="kpi tono-ambar">
            <div className="titulo">Enfermeros de guardia</div>
            <div className="valor">{enfs.length}</div>
          </div>
          <div className="kpi tono-emergencia">
            <div className="titulo">Pacientes internados</div>
            <div className="valor">{pacs.length}</div>
          </div>
        </div>

        <div className="grilla-2">
          <div className="card">
            <div className="titulo-card">
              <h3>Pacientes en el área</h3>
            </div>
            {pacs.length ? (
              pacs.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--borde)',
                  }}
                >
                  <img
                    className="avatar"
                    src={p.avatar}
                    style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    alt=""
                  />
                  <div style={{ flex: 1 }}>
                    <strong>
                      {p.nombre} {p.apellido}
                    </strong>
                    <br />
                    <small className="tenue">
                      Hab {p.habitacion} · Cama {p.cama}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p className="tenue">Sin pacientes internados.</p>
            )}
          </div>

          <div className="card">
            <div className="titulo-card">
              <h3>Equipo de enfermería</h3>
            </div>
            {enfs.length ? (
              enfs.map((u) => (
                <div
                  key={u.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0',
                    borderBottom: '1px solid var(--borde)',
                  }}
                >
                  <img
                    className="avatar"
                    src={u.avatar}
                    style={{ width: '36px', height: '36px', borderRadius: '50%' }}
                    alt=""
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{u.nombre}</strong>
                    <br />
                    <small className="tenue">{u.email}</small>
                  </div>
                  {u.estado === 'activo' ? (
                    <span className="badge b-verde">Activo</span>
                  ) : (
                    <span className="badge b-gris">Inactivo</span>
                  )}
                </div>
              ))
            ) : (
              <p className="tenue">Sin enfermeros asignados a esta área.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Grilla General de Áreas ─────────────────────────────
  return (
    <div className="areas-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Gestión · Áreas</div>
          <h1>Áreas del hospital</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            {areas.length} áreas registradas. Hacé clic en una para ver su detalle.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          id="btnNuevo"
          onClick={() => modalArea()}
        >
          <Icono nombre="mas" size={16} /> Nueva área
        </button>
      </div>

      <div className="grilla-areas" id="grillaA">
        {areas.map((a) => {
          const enfermerosArea = initialUsuarios.filter(
            (u) => u.rol === 'enfermero' && u.areaId === a.id && u.estado === 'activo'
          ).length;

          const activos = llamadosActivos.filter((l) => {
            const p = initialPacientes.find((pp) => pp.id === l.pacienteId);
            return p && p.areaId === a.id;
          }).length;

          return (
            <article
              key={a.id}
              className="tarjeta-area"
              style={{ borderTopColor: a.color, cursor: 'pointer' }}
              onClick={() => setAreaDetalleId(a.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span className="color-swatch" style={{ background: a.color }} />
                <h3>{a.nombre}</h3>
                <span className="badge b-gris" style={{ marginLeft: 'auto' }}>
                  {a.abrev}
                </span>
              </div>
              <p className="desc">{a.descripcion}</p>

              <div className="stats">
                <div className="stat">
                  <span className="n">{a.habitaciones}</span>
                  <span className="l">Habitaciones</span>
                </div>
                <div className="stat">
                  <span className="n">
                    {a.camasOcupadas}/{a.camasTotales}
                  </span>
                  <span className="l">Camas ocup.</span>
                </div>
                <div className="stat">
                  <span className="n">{enfermerosArea}</span>
                  <span className="l">Enfermeros</span>
                </div>
                <div className="stat">
                  <span
                    className="n"
                    style={{ color: activos > 0 ? 'var(--rojo-emergencia)' : 'var(--texto)' }}
                  >
                    {activos}
                  </span>
                  <span className="l">Llamados act.</span>
                </div>
              </div>

              <div className="footer-area">
                <span>Responsable: {a.responsable}</span>
                <button
                  type="button"
                  className="btn btn-fantasma btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    modalArea(a);
                  }}
                >
                  <Icono nombre="editar" size={14} />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
