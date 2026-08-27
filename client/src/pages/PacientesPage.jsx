// ─────────────────────────────────────────────────────────────
// client/src/pages/PacientesPage.jsx
// Módulo de Gestión Clínica y Ficha del Paciente.
// Modularizado con FichaMedicaModal y NuevoPacienteModal.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import {
  initialAreas,
  initialPacientes,
  initialUsuarios,
  avatar,
  getStored,
  setStored,
} from '../data/mockData.js';

import FichaMedicaModal from '../components/pacientes/FichaMedicaModal.jsx';
import NuevoPacienteModal from '../components/pacientes/NuevoPacienteModal.jsx';

export default function PacientesPage() {
  const { toast, abrirModal, cerrarModal, confirmar, formatearFechaHora, segundosADuracion } = useUI();

  const [pacientes, setPacientes] = useState(() => getStored('pacientes', initialPacientes));
  const [busqueda, setBusqueda] = useState('');
  const [filArea, setFilArea] = useState('todas');
  const [filEstado, setFilEstado] = useState('todos');

  const areaNombre = (id) => initialAreas.find((a) => a.id === id)?.nombre || '—';
  const enfermeroNombre = (id) => initialUsuarios.find((u) => u.id === id)?.nombre || 'Sin asignar';

  const guardarListaPacientes = (nuevaLista) => {
    setPacientes(nuevaLista);
    setStored('pacientes', nuevaLista);
  };

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

  // Modal Alta / Edición de Paciente
  const abrirModalPaciente = (pacienteEditar = null) => {
    const edicion = !!pacienteEditar;

    abrirModal({
      titulo: edicion ? 'Editar Paciente' : 'Nuevo Ingreso de Paciente',
      cuerpo: (
        <NuevoPacienteModal
          pacienteEditar={pacienteEditar}
          onCancelar={cerrarModal}
          onGuardar={(f) => {
            const alergiasArr = f.alergias.split(',').map((s) => s.trim()).filter(Boolean);
            const patologiasArr = f.patologias.split(',').map((s) => s.trim()).filter(Boolean);
            const medicacionArr = f.medicacion.split(',').map((s) => s.trim()).filter(Boolean);

            if (edicion) {
              const actualizados = pacientes.map((p) =>
                p.id === pacienteEditar.id
                  ? {
                      ...p,
                      ...f,
                      alergias: alergiasArr,
                      patologias: patologiasArr,
                      medicacion: medicacionArr,
                    }
                  : p
              );
              guardarListaPacientes(actualizados);
              toast({ titulo: 'Paciente actualizado', msj: `${f.nombre} ${f.apellido} fue editado.`, tipo: 'exito' });
            } else {
              const nuevo = {
                id: 'p' + (pacientes.length + 1),
                ...f,
                alergias: alergiasArr,
                patologias: patologiasArr,
                medicacion: medicacionArr,
                avatar: avatar(`${f.nombre} ${f.apellido}`),
              };
              guardarListaPacientes([nuevo, ...pacientes]);
              toast({ titulo: 'Paciente ingresado', msj: `${nuevo.nombre} ${nuevo.apellido} fue registrado.`, tipo: 'exito' });
            }
            cerrarModal();
          }}
        />
      ),
    });
  };

  // Modal Ficha Médica Detallada
  const abrirFichaPaciente = (p) => {
    abrirModal({
      titulo: `Ficha Médica — ${p.nombre} ${p.apellido}`,
      cuerpo: (
        <FichaMedicaModal
          paciente={p}
          formatearFechaHora={formatearFechaHora}
          segundosADuracion={segundosADuracion}
          onCerrar={cerrarModal}
          onEditar={(pac) => {
            cerrarModal();
            abrirModalPaciente(pac);
          }}
          onDarAlta={async (pac) => {
            const ok = await confirmar(`¿Confirmar el alta hospitalaria para ${pac.nombre} ${pac.apellido}?`);
            if (ok) {
              const actualizados = pacientes.map((item) => (item.id === pac.id ? { ...item, estado: 'alta' } : item));
              guardarListaPacientes(actualizados);
              toast({ titulo: 'Alta médica confirmada', msj: `${pac.nombre} ${pac.apellido} pasó a estado Alta.`, tipo: 'info' });
              cerrarModal();
            }
          }}
        />
      ),
    });
  };

  return (
    <div className="pagina">
      {/* Cabecera */}
      <div className="cabecera-pagina">
        <div>
          <h1>Gestión de Pacientes</h1>
          <p className="tenue">Padrón de internación, triage, antecedentes médicos y asignación de camas.</p>
        </div>
        <button type="button" className="btn btn-primario" onClick={() => abrirModalPaciente()}>
          <Icono nombre="mas" size={18} /> Nuevo paciente
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-barra">
        <div className="input-icono">
          <Icono nombre="buscar" size={16} />
          <input
            className="input"
            placeholder="Buscar por nombre, apellido o DNI..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <select className="select" value={filArea} onChange={(e) => setFilArea(e.target.value)}>
          <option value="todas">Todas las áreas</option>
          {initialAreas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </select>

        <select className="select" value={filEstado} onChange={(e) => setFilEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="internado">Internados</option>
          <option value="observacion">En Observación</option>
          <option value="alta">De Alta</option>
        </select>
      </div>

      {/* Tabla de Pacientes */}
      <div className="tabla-wrap">
        <div className="tabla-scroll">
          <table className="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>DNI</th>
                <th>Edad / Sexo</th>
                <th>Área</th>
                <th>Ubicación</th>
                <th>Enfermero Asignado</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.length ? (
                pacientesFiltrados.map((p) => (
                  <tr key={p.id} onClick={() => abrirFichaPaciente(p)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="celda-avatar">
                        <img className="avatar" src={p.avatar} alt="" />
                        <div>
                          <strong>
                            {p.nombre} {p.apellido}
                          </strong>
                          {p.alergias?.length > 0 && (
                            <span className="badge b-rojo" style={{ marginLeft: '6px' }}>
                              Alergias
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{p.dni}</td>
                    <td>
                      {p.edad} años ({p.sexo})
                    </td>
                    <td>
                      <span className="badge b-azul">{areaNombre(p.areaId)}</span>
                    </td>
                    <td>
                      Hab {p.habitacion} · Cama {p.cama}
                    </td>
                    <td>{enfermeroNombre(p.enfermeroId)}</td>
                    <td>{badgeEstado(p.estado)}</td>
                    <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icono"
                        title="Ver Ficha"
                        onClick={() => abrirFichaPaciente(p)}
                      >
                        <Icono nombre="ojo" size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icono"
                        title="Editar"
                        onClick={() => abrirModalPaciente(p)}
                      >
                        <Icono nombre="editar" size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px' }}>
                    No se encontraron pacientes con los filtros seleccionados.
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
