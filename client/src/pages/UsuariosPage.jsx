// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/UsuariosPage.jsx
// Administración de Usuarios y Personal del Hospital (Solo Admin).
// Replica 1:1 el HTML, CSS y modales de public/js/pages/usuarios.js
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialUsuarios, initialAreas, avatar } from '../data/mockData.js';

export default function UsuariosPage() {
  const { toast, abrirModal, cerrarModal, confirmar } = useUI();
  const [usuarios, setUsuarios] = useState(initialUsuarios);

  const areaNombre = (id) => initialAreas.find((a) => a.id === id)?.nombre || '—';

  const badgeRol = (rol) => {
    return rol === 'admin' ? (
      <span className="badge b-azul-fuerte">Administrador</span>
    ) : (
      <span className="badge b-azul">Enfermero/a</span>
    );
  };

  const handleToggleEstado = (id, nuevoActivo) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const nuevoEstado = nuevoActivo ? 'activo' : 'inactivo';
          toast({ titulo: `Cuenta ${nuevoEstado}`, msj: u.nombre, tipo: 'info' });
          return { ...u, estado: nuevoEstado };
        }
        return u;
      })
    );
  };

  const handleEliminarUsuario = async (u) => {
    const ok = await confirmar({
      titulo: 'Eliminar usuario',
      mensaje: `¿Confirmás eliminar la cuenta de <strong>${u.nombre}</strong>?`,
      peligroso: true,
      textoOk: 'Eliminar',
    });
    if (ok) {
      setUsuarios((prev) => prev.filter((x) => x.id !== u.id));
      toast({ titulo: 'Usuario eliminado', tipo: 'exito' });
    }
  };

  const abrirModalUsuario = (u = null) => {
    const edicion = !!u;
    let formState = {
      nombre: u?.nombre || '',
      usuario: u?.usuario || '',
      email: u?.email || '',
      rol: u?.rol || 'admin',
      areaId: u?.areaId || '',
      telefono: u?.telefono || '',
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
              Nombre completo<span className="obligatorio">*</span>
            </label>
            <input
              required
              value={f.nombre}
              onChange={(e) => update('nombre', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>
              Usuario<span className="obligatorio">*</span>
            </label>
            <input
              required
              value={f.usuario}
              onChange={(e) => update('usuario', e.target.value)}
            />
          </div>
          <div className="campo">
            <label>Email</label>
            <input
              type="email"
              value={f.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </div>
          {!edicion && (
            <>
              <div className="campo">
                <label>
                  Contraseña<span className="obligatorio">*</span>
                </label>
                <input type="password" placeholder="Mínimo 8 caracteres" />
              </div>
              <div className="campo">
                <label>Repetir contraseña</label>
                <input type="password" />
              </div>
            </>
          )}
          <div className="campo full">
            <label>Rol</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label
                className="check"
                style={{
                  border: '1px solid var(--borde)',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--superficie-2)',
                  display: 'flex',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="rol"
                  value="admin"
                  checked={f.rol === 'admin'}
                  onChange={() => update('rol', 'admin')}
                />
                <div>
                  <strong>Administrador</strong>
                  <br />
                  <small className="tenue">Acceso completo al sistema.</small>
                </div>
              </label>
              <label
                className="check"
                style={{
                  border: '1px solid var(--borde)',
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'var(--superficie-2)',
                  display: 'flex',
                  gap: '10px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="rol"
                  value="enfermero"
                  checked={f.rol === 'enfermero'}
                  onChange={() => update('rol', 'enfermero')}
                />
                <div>
                  <strong>Enfermero/a</strong>
                  <br />
                  <small className="tenue">Ve tablero, sus pacientes y perfil.</small>
                </div>
              </label>
            </div>
          </div>
          <div className="campo">
            <label>Área asignada</label>
            <select
              value={f.areaId}
              onChange={(e) => update('areaId', e.target.value)}
            >
              <option value="">Sin asignar</option>
              {initialAreas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label>Teléfono</label>
            <input
              value={f.telefono}
              onChange={(e) => update('telefono', e.target.value)}
            />
          </div>
        </div>
      );
    };

    abrirModal({
      titulo: (edicion ? 'Editar ' : 'Nuevo ') + 'usuario',
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
              const { nombre, usuario } = formState;
              if (!nombre.trim() || !usuario.trim()) {
                toast({ titulo: 'Faltan campos', tipo: 'error' });
                return;
              }
              const datos = {
                nombre: nombre.trim(),
                usuario: usuario.trim(),
                email: formState.email,
                rol: formState.rol,
                areaId: formState.areaId || null,
                telefono: formState.telefono,
              };
              if (edicion) {
                setUsuarios((prev) =>
                  prev.map((item) =>
                    item.id === u.id
                      ? { ...item, ...datos, avatar: avatar(datos.nombre) }
                      : item
                  )
                );
                toast({ titulo: 'Usuario actualizado', tipo: 'exito' });
              } else {
                const nuevo = {
                  id: 'u_' + Date.now(),
                  estado: 'activo',
                  ultimoAcceso: '—',
                  avatar: avatar(nombre),
                  ...datos,
                };
                setUsuarios((prev) => [nuevo, ...prev]);
                toast({ titulo: 'Usuario creado', tipo: 'exito' });
              }
              cerrarModal();
            }}
          >
            {edicion ? 'Guardar' : 'Crear usuario'}
          </button>
        </>
      ),
    });
  };

  const activosCount = usuarios.filter((u) => u.estado === 'activo').length;

  return (
    <div className="usuarios-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Gestión · Usuarios</div>
          <h1>Usuarios del sistema</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Administrá cuentas, roles y áreas de trabajo del personal.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primario"
          id="btnNuevo"
          onClick={() => abrirModalUsuario()}
        >
          <Icono nombre="mas" size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="tabla-wrap">
        <div className="barra-tabla">
          <span className="tenue" style={{ fontSize: '13px' }}>
            {usuarios.length} usuarios · {activosCount} activos
          </span>
        </div>
        <div className="tabla-scroll">
          <table className="tabla" id="tabU">
            <thead>
              <tr>
                <th style={{ width: '48px' }}></th>
                <th>Nombre</th>
                <th>Usuario</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Área</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <img className="avatar" src={u.avatar} alt="" />
                  </td>
                  <td>
                    <strong>{u.nombre}</strong>
                  </td>
                  <td>{u.usuario}</td>
                  <td>{u.email}</td>
                  <td>{badgeRol(u.rol)}</td>
                  <td>{areaNombre(u.areaId)}</td>
                  <td>
                    <label className="check" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="checkbox"
                        checked={u.estado === 'activo'}
                        onChange={(e) => handleToggleEstado(u.id, e.target.checked)}
                      />
                      <span>{u.estado === 'activo' ? 'Activo' : 'Inactivo'}</span>
                    </label>
                  </td>
                  <td>{u.ultimoAcceso}</td>
                  <td className="acciones" style={{ justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      title="Editar"
                      onClick={() => abrirModalUsuario(u)}
                    >
                      <Icono nombre="editar" size={16} />
                    </button>
                    <button
                      type="button"
                      className="peligro"
                      title="Eliminar"
                      onClick={() => handleEliminarUsuario(u)}
                    >
                      <Icono nombre="basura" size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
