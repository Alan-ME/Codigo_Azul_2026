// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/ConfiguracionPage.jsx
// Configuración de Orígenes y Tipos de Llamado (Solo Admin).
// Replica 1:1 el HTML, CSS y modales de public/js/pages/configuracion.js
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialOrigenesLlamado, initialTiposLlamado } from '../data/mockData.js';

export default function ConfiguracionPage() {
  const { toast, abrirModal, cerrarModal, confirmar } = useUI();

  const [origenes, setOrigenes] = useState(initialOrigenesLlamado);
  const [tipos, setTipos] = useState(initialTiposLlamado);

  // Modal Origen
  const modalOrigen = (o = null) => {
    const edicion = !!o;
    let formState = {
      nombre: o?.nombre || '',
      icono: o?.icono || 'cama',
      descripcion: o?.descripcion || '',
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
            <label>Nombre</label>
            <input value={f.nombre} onChange={(e) => update('nombre', e.target.value)} />
          </div>
          <div className="campo">
            <label>Icono</label>
            <select value={f.icono} onChange={(e) => update('icono', e.target.value)}>
              {['cama', 'bath', 'watch', 'radio', 'mic', 'campana', 'alerta'].map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div className="campo full">
            <label>Descripción</label>
            <textarea
              value={f.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
            />
          </div>
        </div>
      );
    };

    abrirModal({
      titulo: edicion ? 'Editar origen' : 'Nuevo origen',
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
              const { nombre, icono, descripcion } = formState;
              if (!nombre.trim()) {
                toast({ titulo: 'Falta el nombre', tipo: 'error' });
                return;
              }
              const datos = { nombre: nombre.trim(), icono, descripcion };
              if (edicion) {
                setOrigenes((prev) =>
                  prev.map((item) => (item.id === o.id ? { ...item, ...datos } : item))
                );
              } else {
                setOrigenes((prev) => [...prev, { id: 'o_' + Date.now(), ...datos }]);
              }
              cerrarModal();
              toast({ titulo: 'Cambios guardados', tipo: 'exito' });
            }}
          >
            Guardar
          </button>
        </>
      ),
    });
  };

  const handleEliminarOrigen = async (o) => {
    const ok = await confirmar({
      titulo: 'Eliminar origen',
      mensaje: `¿Eliminar el origen <strong>${o.nombre}</strong>?`,
      peligroso: true,
      textoOk: 'Eliminar',
    });
    if (!ok) return;
    setOrigenes((prev) => prev.filter((x) => x.id !== o.id));
    toast({ titulo: 'Origen eliminado', tipo: 'exito' });
  };

  // Modal Tipo
  const modalTipo = (t = null) => {
    const edicion = !!t;
    let formState = {
      nombre: t?.nombre || '',
      color: t?.color || '#0B5FFF',
      sonido: t?.sonido || 'campanilla.mp3',
      tiempoMax: t?.tiempoMax || '10 min',
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
          <div className="campo">
            <label>Nombre</label>
            <input value={f.nombre} onChange={(e) => update('nombre', e.target.value)} />
          </div>
          <div className="campo">
            <label>Color</label>
            <input type="color" value={f.color} onChange={(e) => update('color', e.target.value)} />
          </div>
          <div className="campo">
            <label>Sonido de alerta</label>
            <select value={f.sonido} onChange={(e) => update('sonido', e.target.value)}>
              <option value="campanilla.mp3">campanilla.mp3</option>
              <option value="sirena-corta.mp3">sirena-corta.mp3</option>
              <option value="alarma-codazul.mp3">alarma-codazul.mp3</option>
            </select>
          </div>
          <div className="campo">
            <label>Tiempo máximo de respuesta</label>
            <input value={f.tiempoMax} onChange={(e) => update('tiempoMax', e.target.value)} />
          </div>
        </div>
      );
    };

    abrirModal({
      titulo: edicion ? 'Editar tipo' : 'Nuevo tipo',
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
              const { nombre, color, sonido, tiempoMax } = formState;
              if (!nombre.trim()) {
                toast({ titulo: 'Falta el nombre', tipo: 'error' });
                return;
              }
              const datos = { nombre: nombre.trim(), color, sonido, tiempoMax };
              if (edicion) {
                setTipos((prev) =>
                  prev.map((item) => (item.id === t.id ? { ...item, ...datos } : item))
                );
              } else {
                setTipos((prev) => [...prev, { id: 't_' + Date.now(), ...datos }]);
              }
              cerrarModal();
              toast({ titulo: 'Cambios guardados', tipo: 'exito' });
            }}
          >
            Guardar
          </button>
        </>
      ),
    });
  };

  return (
    <div className="configuracion-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Gestión · Configuración</div>
          <h1>Formas de llamado</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Definí desde dónde puede originarse un llamado y qué tipos existen.
          </p>
        </div>
      </div>

      <div className="grilla-2">
        {/* Orígenes de Llamado */}
        <div className="card">
          <div className="titulo-card">
            <h3>Orígenes de llamado</h3>
            <div className="acciones">
              <button
                type="button"
                className="btn btn-secundario btn-sm"
                onClick={() => modalOrigen()}
              >
                <Icono nombre="mas" size={14} /> Nuevo
              </button>
            </div>
          </div>

          <div id="listaOrigenes">
            {origenes.map((o) => (
              <div key={o.id} className="config-orig-item">
                <div className="icono">
                  <Icono nombre={o.icono} size={18} />
                </div>
                <div className="info">
                  <h4>{o.nombre}</h4>
                  <p>{o.descripcion}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-fantasma btn-sm"
                  title="Editar"
                  onClick={() => modalOrigen(o)}
                >
                  <Icono nombre="editar" size={14} />
                </button>
                <button
                  type="button"
                  className="btn btn-fantasma btn-sm peligro"
                  title="Eliminar"
                  onClick={() => handleEliminarOrigen(o)}
                >
                  <Icono nombre="basura" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tipos de Llamado */}
        <div className="card">
          <div className="titulo-card">
            <h3>Tipos de llamado</h3>
            <div className="acciones">
              <button
                type="button"
                className="btn btn-secundario btn-sm"
                onClick={() => modalTipo()}
              >
                <Icono nombre="mas" size={14} /> Nuevo
              </button>
            </div>
          </div>

          <div id="listaTipos">
            {tipos.map((t) => (
              <div key={t.id} className="config-orig-item">
                <div
                  className="icono"
                  style={{ background: t.color, color: '#fff', borderColor: 'transparent' }}
                >
                  <Icono nombre="alerta" size={18} color="#ffffff" />
                </div>
                <div className="info">
                  <h4>{t.nombre}</h4>
                  <p>
                    Sonido: {t.sonido} · Tiempo máx: {t.tiempoMax}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-fantasma btn-sm"
                  title="Editar"
                  onClick={() => modalTipo(t)}
                >
                  <Icono nombre="editar" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
