// ─────────────────────────────────────────────────────────────
// client/src/components/pacientes/FichaMedicaModal.jsx
// Visualización clínica detallada de historia, patologías y llamados
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Icono from '../common/Icono.jsx';
import { initialAreas, initialUsuarios, initialLlamadosHistoricos } from '../../data/mockData.js';

export default function FichaMedicaModal({
  paciente,
  onEditar,
  onDarAlta,
  onCerrar,
  formatearFechaHora,
  segundosADuracion,
}) {
  const [tabActiva, setTabActiva] = useState('personales');

  if (!paciente) return null;

  const a = initialAreas.find((x) => x.id === paciente.areaId);
  const enf = initialUsuarios.find((x) => x.id === paciente.enfermeroId);
  const llamadosPac = initialLlamadosHistoricos.filter((l) => l.pacienteId === paciente.id);

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

  return (
    <div className="detalle-paciente">
      <div className="cabecera-detalle">
        <img className="avatar" src={paciente.avatar} alt="" />
        <div>
          <h2>
            {paciente.nombre} {paciente.apellido}
          </h2>
          <p className="tenue">
            DNI {paciente.dni} · {paciente.edad} años · {paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Otro'}
          </p>
          <div className="tags" style={{ marginTop: '8px' }}>
            {badgeEstado(paciente.estado)}
            <span className="badge b-azul">{a?.nombre || '—'}</span>
            <span className="badge">
              Hab {paciente.habitacion} · Cama {paciente.cama}
            </span>
            {paciente.alergias?.length > 0 && (
              <span className="badge b-rojo">
                <Icono nombre="alerta" size={12} /> Alergias
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--texto-tenue)' }}>
          <div>Enfermero asignado</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
            {enf ? (
              <>
                <img className="avatar" src={enf.avatar} style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="" />
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
              <p>
                {paciente.nombre} {paciente.apellido}
              </p>
            </div>
            <div>
              <label className="mayuscula tenue">DNI</label>
              <p>{paciente.dni}</p>
            </div>
            <div>
              <label className="mayuscula tenue">Fecha de nacimiento</label>
              <p>{paciente.fechaNac || '—'}</p>
            </div>
            <div>
              <label className="mayuscula tenue">Edad</label>
              <p>{paciente.edad} años</p>
            </div>
            <div>
              <label className="mayuscula tenue">Teléfono</label>
              <p>{paciente.telefono}</p>
            </div>
            <div>
              <label className="mayuscula tenue">Sexo</label>
              <p>{paciente.sexo === 'F' ? 'Femenino' : paciente.sexo === 'M' ? 'Masculino' : 'Otro'}</p>
            </div>
            <div className="full">
              <label className="mayuscula tenue">Dirección</label>
              <p>{paciente.direccion}</p>
            </div>
            <div className="full">
              <label className="mayuscula tenue">Contacto de emergencia</label>
              <p>{paciente.contactoEmerg}</p>
            </div>
          </div>
        </div>
      )}

      {tabActiva === 'medicos' && (
        <div className="card">
          <div className="grid-form">
            <div>
              <label className="mayuscula tenue">Obra social</label>
              <p>{paciente.obraSocial}</p>
            </div>
            <div>
              <label className="mayuscula tenue">Grupo sanguíneo</label>
              <p>
                <span className="badge b-rojo">{paciente.grupo}</span>
              </p>
            </div>
            <div className="full">
              <label className="mayuscula tenue">Alergias</label>
              <p>
                {paciente.alergias?.length
                  ? paciente.alergias.map((x) => (
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
                {paciente.patologias?.length
                  ? paciente.patologias.map((x) => (
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
                {paciente.medicacion?.length ? (
                  <ul style={{ marginLeft: '16px', margin: '4px 0 0 16px' }}>
                    {paciente.medicacion.map((x) => (
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
                      <td>{initialUsuarios.find((u) => u.id === l.enfermeroId)?.nombre || '—'}</td>
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
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px' }}>
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
          <p className="tenue">
            Evolución clínica y notas de enfermería registradas durante el turno actual.
          </p>
          <textarea
            className="input"
            rows={4}
            placeholder="Escribir evolución clínica..."
            style={{ width: '100%', marginTop: '8px' }}
            defaultValue="Paciente ingresó lúcido, orientado en tiempo y espacio. Signos vitales estables."
          />
        </div>
      )}

      <div className="modal-acciones" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          {paciente.estado !== 'alta' && (
            <button type="button" className="btn btn-secundario" onClick={() => onDarAlta(paciente)}>
              Dar de alta
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secundario" onClick={onCerrar}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primario" onClick={() => onEditar(paciente)}>
            <Icono nombre="editar" size={16} /> Editar paciente
          </button>
        </div>
      </div>
    </div>
  );
}
