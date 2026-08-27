// ─────────────────────────────────────────────────────────────
// client/src/components/pacientes/NuevoPacienteModal.jsx
// Formulario modal para admisión y edición de pacientes
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { initialAreas, initialUsuarios } from '../../data/mockData.js';

export default function NuevoPacienteModal({ pacienteEditar, onGuardar, onCancelar }) {
  const enfermeros = initialUsuarios.filter((u) => u.rol === 'enfermero' && u.estado === 'activo');

  const [f, setF] = useState({
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
  });

  const update = (key, val) => setF((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onGuardar(f);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid-form">
        <div className="campo">
          <label>
            Nombre<span className="obligatorio">*</span>
          </label>
          <input required value={f.nombre} onChange={(e) => update('nombre', e.target.value)} />
        </div>
        <div className="campo">
          <label>
            Apellido<span className="obligatorio">*</span>
          </label>
          <input required value={f.apellido} onChange={(e) => update('apellido', e.target.value)} />
        </div>
        <div className="campo">
          <label>DNI</label>
          <input placeholder="00.000.000" value={f.dni} onChange={(e) => update('dni', e.target.value)} />
        </div>
        <div className="campo">
          <label>Fecha de nacimiento</label>
          <input type="date" value={f.fechaNac} onChange={(e) => update('fechaNac', e.target.value)} />
        </div>
        <div className="campo">
          <label>Sexo</label>
          <select value={f.sexo} onChange={(e) => update('sexo', e.target.value)}>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="X">Otro</option>
          </select>
        </div>
        <div className="campo">
          <label>Teléfono</label>
          <input value={f.telefono} onChange={(e) => update('telefono', e.target.value)} />
        </div>
        <div className="campo full">
          <label>Dirección</label>
          <input value={f.direccion} onChange={(e) => update('direccion', e.target.value)} />
        </div>
        <div className="campo full">
          <label>Contacto de emergencia</label>
          <input value={f.contactoEmerg} onChange={(e) => update('contactoEmerg', e.target.value)} />
        </div>

        <div className="campo">
          <label>Obra social</label>
          <input value={f.obraSocial} onChange={(e) => update('obraSocial', e.target.value)} />
        </div>
        <div className="campo">
          <label>Grupo sanguíneo</label>
          <select value={f.grupo} onChange={(e) => update('grupo', e.target.value)}>
            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="campo full">
          <label>Alergias (separadas por coma)</label>
          <input value={f.alergias} onChange={(e) => update('alergias', e.target.value)} />
        </div>
        <div className="campo full">
          <label>Patologías previas (separadas por coma)</label>
          <input value={f.patologias} onChange={(e) => update('patologias', e.target.value)} />
        </div>
        <div className="campo full">
          <label>Medicación actual (separada por coma)</label>
          <input value={f.medicacion} onChange={(e) => update('medicacion', e.target.value)} />
        </div>

        <div className="campo">
          <label>Área</label>
          <select value={f.areaId} onChange={(e) => update('areaId', e.target.value)}>
            {initialAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label>Estado</label>
          <select value={f.estado} onChange={(e) => update('estado', e.target.value)}>
            <option value="internado">Internado</option>
            <option value="observacion">Observación</option>
            <option value="alta">Alta</option>
          </select>
        </div>
        <div className="campo">
          <label>Habitación</label>
          <input value={f.habitacion} onChange={(e) => update('habitacion', e.target.value)} />
        </div>
        <div className="campo">
          <label>Cama</label>
          <input value={f.cama} onChange={(e) => update('cama', e.target.value)} />
        </div>
        <div className="campo full">
          <label>Enfermero asignado</label>
          <select value={f.enfermeroId} onChange={(e) => update('enfermeroId', e.target.value)}>
            <option value="">Sin asignar</option>
            {enfermeros.map((enf) => (
              <option key={enf.id} value={enf.id}>
                {enf.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="modal-acciones" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button type="button" className="btn btn-secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primario">
          {pacienteEditar ? 'Guardar Cambios' : 'Ingresar Paciente'}
        </button>
      </div>
    </form>
  );
}
