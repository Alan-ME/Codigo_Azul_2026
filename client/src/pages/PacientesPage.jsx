// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/PacientesPage.jsx
// Módulo de Gestión Clínica y Ficha del Paciente.
// Replica 1:1 el listado, filtros, modales y tabs de public/js/pages/pacientes.js
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialAreas, initialPacientes, initialUsuarios, initialLlamadosHistoricos, avatar } from '../data/mockData.js';

export default function PacientesPage() {
  const { toast, abrirModal, cerrarModal, confirmar, formatearFechaHora, segundosADuracion } = useUI();

  const [pacientes, setPacientes] = useState(initialPacientes);
  const [busqueda, setBusqueda] = useState('');
  const [filArea, setFilArea] = useState('todas');
  const [filEstado, setFilEstado] = useState('todos');

  // Estado para la vista de detalle
  const [pacienteDetalleId, setPacienteDetalleId] = useState(null);
  const [tabActiva, setTabActiva] = useState('personales');

  const areaNombre = (id) => initialAreas.find((a) => a.id === id)?.nombre || '—';
  const enfermeroNombre = (id) => initialUsuarios.find((u) => u.id === id)?.nombre || 'Sin asignar';

  const badgeEstado = (estado) => {
    switch (estado) {
      case 'internado':
        return <span className="badge b-azul">Internado</span>;
      case 'observacion':
        return <span className="badge b-ambar">Observación</span>;
      case 'alta':
        return <span className="badge b-verde">Alta</span>;
      default:
        return <span className="badge">—</span>;
    }
  };

  const pacientesFiltrados = useMemo(() => {
    return pacientes.filter((p) => {
      if (filArea !== 'todas' && p.areaId !== filArea) return false;
      if (filEstado !== 'todos' && p.estado !== filEstado) return false;
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        const nombreCompleto = `${p.nombre} ${p.apellido}`.toLowerCase();
        if (!nombreCompleto.includes(q) && !p.dni.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [pacientes, filArea, filEstado, busqueda]);

  const pacienteSeleccionado = useMemo(() => {
    return pacientes.find((p) => p.id === pacienteDetalleId) || null;
  }, [pacientes, pacienteDetalleId]);

  // Modal Alta / Edición de Paciente
  const abrirModalPaciente = (pacienteEditar = null) => {
    const edicion = !!pacienteEditar;
    const enfermeros = initialUsuarios.filter((u) => u.rol === 'enfermero' && u.estado === 'activo');

    let formState = {
      nombre: pacienteEditar?.nombre || '',
      apellido: pacienteEditar?.apellido || '',
      dni: pacienteEditar?.dni || '',
      fechaNac: pacienteEditar?.fechaNac || '',
      edad: pacienteEditar?.edad || 0,
      sexo: pacienteEditar?.sexo || 'F',
      telefono: pacienteEditar?.telefono || '',
      direccion: pacienteEditar?.direccion || '',
      contactoEmerg: pacienteEditar?.contactoEmerg || '',
      obraSocial: pacienteEditar?.obraSocial || '',
      grupo: pacienteEditar?.grupo || 'O+',
      alergias: (pacienteEditar?.alergias || []).join(', '),
      patologias: (pacienteEditar?.patologias || []).join(', '),
      medicacion: (pacienteEditar?.medicacion || []).join(', '),
      areaId: pacienteEditar?.areaId || initialAreas[0]?.id || 'a1',
      estado: pacienteEditar?.estado || 'internado',
      habitacion: pacienteEditar?.habitacion || '',
      cama: pacienteEditar?.cama || '',
      enfermeroId: pacienteEditar?.enfermeroId || '',
    };

    const FormularioModal = () => {
      const [f, setF] = useState(formState);
      const update = (key, val) => {
        setF((prev) => {
          const next = { ...prev, [key]: val };
          formState = next;
          return next;
        });
      };

      return (
        <div className="grid-form">
          <div className="campo">
            <label>
              Nombre<span className="obligatorio">*</span>
            </label>
            <input
              required
              value={f.nombre}
              onChange={(e) => update('nombre', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>
              Apellido<span className="obligatorio">*</span>
            </label>
            <input
              required
              value={f.apellido}
              onChange={(e) => update('apellido', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>DNI</label>
            <input
              placeholder="00.000.000"
              value={f.dni}
              onChange={(e) => update('dni', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              value={f.fechaNac}
              onChange={(e) => update('fechaNac', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Sexo</label>
            <select
              value={f.sexo}
              onChange={(e) => update('sexo', e.target.value)}
            >
              <option value="F">Femenino</option>
              <option value="M">Masculino</option>
              <option value="X">Otro</option>
            </select>
          </div>
          <div className="campo">
            <label>Teléfono</label>
            <input
              value={f.telefono}
              onChange={(e) => update('telefono', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Dirección</label>
            <input
              value={f.direccion}
              onChange={(e) => update('direccion', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Contacto de emergencia</label>
            <input
              value={f.contactoEmerg}
              onChange={(e) => update('contactoEmerg', e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Obra social</label>
            <input
              value={f.obraSocial}
              onChange={(e) => update('obraSocial', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Grupo sanguíneo</label>
            <select
              value={f.grupo}
              onChange={(e) => update('grupo', e.target.value)}
            >
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="campo full">
            <label>Alergias (separadas por coma)</label>
            <input
              value={f.alergias}
              onChange={(e) => update('alergias', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Patologías previas (separadas por coma)</label>
            <input
              value={f.patologias}
              onChange={(e) => update('patologias', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Medicación actual (separada por coma)</label>
            <input
              value={f.medicacion}
              onChange={(e) => update('medicacion', e.target.value)}
            />
          </div>

          <div className="campo">
            <label>Área</label>
            <select
              value={f.areaId}
              onChange={(e) => update('areaId', e.target.value)}
            >
              {initialAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Estado</label>
            <select
              value={f.estado}
              onChange={(e) => update('estado', e.target.value)}
            >
              <option value="internado">Internado</option>
              <option value="observacion">Observación</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div className="campo">
            <label>Habitación</label>
            <input
              value={f.habitacion}
              onChange={(e) => update('habitacion', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Cama</label>
            <input
              value={f.cama}
              onChange={(e) => update('cama', e.target.value)}
            />
          </div>
          <div className="campo full">
            <label>Enfermero asignado</label>
            <select
              value={f.enfermeroId}
              onChange={(e) => update('enfermeroId', e.target.value)}
            >
              <option value="">Sin asignar</option>
              {enfermeros.map((enf) => (
                <option key={enf.id} value={enf.id}>
                  {enf.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    };

    abrirModal({
      titulo: (edicion ? 'Editar ' : 'Nuevo ') + 'paciente',
      ancho: true,
      cuerpo: <FormularioModal />,
      pie: (
        <>
          <button type="button" className="btn btn-fantasma" onClick={cerrarModal}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={() => {
              const { nombre, apellido } = formState;
              if (!nombre.trim() || !apellido.trim()) {
                toast({
                  titulo: 'Faltan datos',
                  msj: 'Nombre y apellido son obligatorios.',
                  tipo: 'error',
                });
                return;
              }

              const datosNormalizados = {
                ...formState,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                alergias: formState.alergias.split(',').map((s) => s.trim()).filter(Boolean),
                patologias: formState.patologias.split(',').map((s) => s.trim()).filter(Boolean),
                medicacion: formState.medicacion.split(',').map((s) => s.trim()).filter(Boolean),
                enfermeroId: formState.enfermeroId || null,
              };

              if (edicion) {
                setPacientes((prev) =>
                  prev.map((item) =>
                    item.id === pacienteEditar.id
                      ? {
                          ...item,
                          ...datosNormalizados,
                          avatar: avatar(`${datosNormalizados.nombre} ${datosNormalizados.apellido}`),
                        }
                      : item
                  )
                );
                toast({ titulo: 'Paciente actualizado', tipo: 'exito' });
              } else {
                const nuevo = {
                  id: 'p_' + Date.now(),
                  ...datosNormalizados,
                  avatar: avatar(`${datosNormalizados.nombre} ${datosNormalizados.apellido}`),
                };
                setPacientes((prev) => [nuevo, ...prev]);
                toast({
                  titulo: 'Paciente creado',
                  msj: `${nuevo.nombre} ${nuevo.apellido}`,
                  tipo: 'exito',
                });
              }
              cerrarModal();
            }}
          >
            <Icono nombre="check" size={16} />{' '}
            {edicion ? 'Guardar cambios' : 'Crear paciente'}
          </button>
        </>
      ),
    });
  };

  const handleEliminarPaciente = async (p) => {
    const ok = await confirmar({
      titulo: 'Eliminar paciente',
      mensaje: `¿Confirmás la eliminación del registro de <strong>${p.nombre} ${p.apellido}</strong>? Esta acción no se puede deshacer.`,
      peligroso: true,
      textoOk: 'Eliminar',
    });
    if (ok) {
      setPacientes((prev) => prev.filter((x) => x.id !== p.id));
      if (pacienteDetalleId === p.id) setPacienteDetalleId(null);
      toast({ titulo: 'Paciente eliminado', tipo: 'exito' });
    }
  };

  // ─── Render: Ficha de Detalle del Paciente ───────────────────────
  if (pacienteSeleccionado) {
    const p = pacienteSeleccionado;
    const a = initialAreas.find((aa) => aa.id === p.areaId);
    const enf = initialUsuarios.find((u) => u.id === p.enfermeroId);
    const llamadosPac = initialLlamadosHistoricos.filter((l) => l.pacienteId === p.id);

    return (
      <div className="paciente-detalle aparecer">
        <div className="cabecera-pagina">
          <div>
            <div className="rastro">
              <span
                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => setPacienteDetalleId(null)}
              >
                Pacientes
              </span>{' '}
              · Detalle
            </div>
            <h1>
              {p.nombre} {p.apellido}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secundario"
              onClick={() => abrirModalPaciente(p)}
            >
              <Icono nombre="editar" size={16} /> Editar
            </button>
            <button
              type="button"
              className="btn btn-fantasma"
              onClick={() => setPacienteDetalleId(null)}
            >
              Volver
            </button>
          </div>
        </div>

        <div className="ficha-cab">
          <img className="avatar-grande" src={p.avatar} alt="" />
          <div className="datos-principales">
            <h2>
              {p.nombre} {p.apellido}
            </h2>
            <div className="meta">
              {p.edad} años · DNI {p.dni} ·{' '}
              {p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}
            </div>
            <div className="badges">
              {badgeEstado(p.estado)}
              <span className="badge b-azul">{a?.nombre || '—'}</span>
              <span className="badge">
                Hab {p.habitacion} · Cama {p.cama}
              </span>
              {p.alergias?.length > 0 && (
                <span className="badge b-rojo">
                  <Icono nombre="alerta" size={12} /> Alergias
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--texto-tenue)' }}>
            <div>Enfermero asignado</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                justifyContent: 'flex-end',
                marginTop: '6px',
              }}
            >
              {enf ? (
                <>
                  <img
                    className="avatar"
                    src={enf.avatar}
                    style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    alt=""
                  />
                  <strong style={{ color: 'var(--texto)' }}>{enf.nombre}</strong>
                </>
              ) : (
                <em>Sin asignar</em>
              )}
            </div>
          </div>
        </div>

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tabActiva === 'personales' ? 'activo' : ''}`}
            onClick={() => setTabActiva('personales')}
          >
            Datos personales
          </button>
          <button
            type="button"
            className={`tab ${tabActiva === 'medicos' ? 'activo' : ''}`}
            onClick={() => setTabActiva('medicos')}
          >
            Datos médicos
          </button>
          <button
            type="button"
            className={`tab ${tabActiva === 'llamados' ? 'activo' : ''}`}
            onClick={() => setTabActiva('llamados')}
          >
            Historial de llamados ({llamadosPac.length})
          </button>
          <button
            type="button"
            className={`tab ${tabActiva === 'notas' ? 'activo' : ''}`}
            onClick={() => setTabActiva('notas')}
          >
            Notas
          </button>
        </div>

        {tabActiva === 'personales' && (
          <div className="card">
            <div className="grid-form">
              <div>
                <label className="mayuscula tenue">Nombre completo</label>
                <p>{p.nombre} {p.apellido}</p>
              </div>
              <div>
                <label className="mayuscula tenue">DNI</label>
                <p>{p.dni}</p>
              </div>
              <div>
                <label className="mayuscula tenue">Fecha de nacimiento</label>
                <p>{p.fechaNac || '—'}</p>
              </div>
              <div>
                <label className="mayuscula tenue">Edad</label>
                <p>{p.edad} años</p>
              </div>
              <div>
                <label className="mayuscula tenue">Teléfono</label>
                <p>{p.telefono}</p>
              </div>
              <div>
                <label className="mayuscula tenue">Sexo</label>
                <p>{p.sexo === 'F' ? 'Femenino' : p.sexo === 'M' ? 'Masculino' : 'Otro'}</p>
              </div>
              <div className="full">
                <label className="mayuscula tenue">Dirección</label>
                <p>{p.direccion}</p>
              </div>
              <div className="full">
                <label className="mayuscula tenue">Contacto de emergencia</label>
                <p>{p.contactoEmerg}</p>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'medicos' && (
          <div className="card">
            <div className="grid-form">
              <div>
                <label className="mayuscula tenue">Obra social</label>
                <p>{p.obraSocial}</p>
              </div>
              <div>
                <label className="mayuscula tenue">Grupo sanguíneo</label>
                <p>
                  <span className="badge b-rojo">{p.grupo}</span>
                </p>
              </div>
              <div className="full">
                <label className="mayuscula tenue">Alergias</label>
                <p>
                  {p.alergias?.length
                    ? p.alergias.map((x) => (
                        <span key={x} className="badge b-ambar" style={{ marginRight: '6px' }}>
                          {x}
                        </span>
                      ))
                    : 'Sin registros'}
                </p>
              </div>
              <div className="full">
                <label className="mayuscula tenue">Patologías previas</label>
                <p>
                  {p.patologias?.length
                    ? p.patologias.map((x) => (
                        <span key={x} className="badge" style={{ marginRight: '6px' }}>
                          {x}
                        </span>
                      ))
                    : 'Sin registros'}
                </p>
              </div>
              <div className="full">
                <label className="mayuscula tenue">Medicación actual</label>
                <div>
                  {p.medicacion?.length ? (
                    <ul style={{ marginLeft: '16px', margin: '4px 0 0 16px' }}>
                      {p.medicacion.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  ) : (
                    'Sin medicación'
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {tabActiva === 'llamados' && (
          <div className="tabla-wrap">
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Origen</th>
                    <th>Duración</th>
                    <th>Enfermero</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {llamadosPac.length ? (
                    llamadosPac.map((l) => (
                      <tr key={l.id}>
                        <td>{formatearFechaHora(l.horaInicio)}</td>
                        <td>
                          {l.tipo === 'codigo-azul' ? (
                            <span className="badge b-azul-fuerte">Código Azul</span>
                          ) : l.tipo === 'emergencia' ? (
                            <span className="badge b-rojo">Emergencia</span>
                          ) : (
                            <span className="badge b-ambar">Normal</span>
                          )}
                        </td>
                        <td>{l.origen}</td>
                        <td>{segundosADuracion(l.duracionSeg)}</td>
                        <td>{enfermeroNombre(l.enfermeroId)}</td>
                        <td>
                          {l.estado === 'atendido' ? (
                            <span className="badge b-verde">Atendido</span>
                          ) : (
                            <span className="badge b-rojo">No atendido</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="tabla-vacia">
                        Sin llamados registrados para este paciente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabActiva === 'notas' && (
          <div className="card">
            <p className="tenue">Sin notas médicas cargadas. Presioná el botón para agregar la primera.</p>
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-primario btn-sm"
                onClick={() => toast({ titulo: 'Nueva nota', msj: 'Editor de notas clínicas abierto', tipo: 'info' })}
              >
                <Icono nombre="mas" size={14} /> Agregar nota
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render: Listado General de Pacientes ────────────────────────
  return (
    <div className="pacientes-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Gestión · Pacientes</div>
          <h1>Pacientes</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            {pacientes.length} pacientes registrados en el hospital.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          id="btnNuevo"
          onClick={() => abrirModalPaciente()}
        >
          <Icono nombre="mas" size={16} /> Nuevo paciente
        </button>
      </div>

      <div className="tabla-wrap">
        <div className="barra-tabla">
          <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '340px' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '9px',
                color: 'var(--texto-tenue)',
                pointerEvents: 'none',
              }}
            >
              <Icono nombre="lupa" size={16} />
            </span>
            <input
              id="q"
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                border: '1px solid var(--borde)',
                borderRadius: '8px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <select
            id="filArea"
            value={filArea}
            onChange={(e) => setFilArea(e.target.value)}
          >
            <option value="todas">Todas las áreas</option>
            {initialAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <select
            id="filEstado"
            value={filEstado}
            onChange={(e) => setFilEstado(e.target.value)}
          >
            <option value="todos">Todos los estados</option>
            <option value="internado">Internado</option>
            <option value="observacion">En observación</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="tabla-scroll">
          <table className="tabla" id="tablaPacientes">
            <thead>
              <tr>
                <th style={{ width: '48px' }}></th>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Edad</th>
                <th>Área</th>
                <th>Hab/Cama</th>
                <th>Enfermero</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.length ? (
                pacientesFiltrados.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <img className="avatar" src={p.avatar} alt="" />
                    </td>
                    <td>
                      <strong>
                        {p.nombre} {p.apellido}
                      </strong>
                    </td>
                    <td>{p.dni}</td>
                    <td>{p.edad}</td>
                    <td>{areaNombre(p.areaId)}</td>
                    <td>
                      {p.habitacion} · {p.cama}
                    </td>
                    <td>{enfermeroNombre(p.enfermeroId)}</td>
                    <td>{badgeEstado(p.estado)}</td>
                    <td className="acciones" style={{ justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        title="Ver detalle"
                        onClick={() => setPacienteDetalleId(p.id)}
                      >
                        <Icono nombre="ojo" size={16} />
                      </button>
                      <button
                        type="button"
                        title="Editar"
                        onClick={() => abrirModalPaciente(p)}
                      >
                        <Icono nombre="editar" size={16} />
                      </button>
                      <button
                        type="button"
                        className="peligro"
                        title="Eliminar"
                        onClick={() => handleEliminarPaciente(p)}
                      >
                        <Icono nombre="basura" size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="tabla-vacia">
                    No se encontraron pacientes con esos criterios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
