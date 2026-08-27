// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/PerfilPage.jsx
// Perfil de Usuario, Seguridad y Preferencias.
// Replica 1:1 el HTML, CSS y comportamiento de public/js/pages/perfil.js
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialAreas } from '../data/mockData.js';

export default function PerfilPage() {
  const { user } = useAuth();
  const { toast } = useUI();

  const [nombre, setNombre] = useState(user?.nombre || 'Usuario');
  const [email, setEmail] = useState(user?.email || 'usuario@hospital.gob.ar');
  const [telefono, setTelefono] = useState(user?.telefono || '+54 11 4455-8899');
  const [claveActual, setClaveActual] = useState('');
  const [nuevaClave, setNuevaClave] = useState('');
  const [repetirClave, setRepetirClave] = useState('');

  const area = initialAreas.find((x) => x.id === user?.areaId);

  const handleGuardarPerfil = () => {
    toast({ titulo: 'Perfil actualizado', tipo: 'exito' });
  };

  const handleCambiarClave = () => {
    if (!nuevaClave) {
      toast({ titulo: 'Ingresá una contraseña', tipo: 'error' });
      return;
    }
    if (nuevaClave !== repetirClave) {
      toast({ titulo: 'Las contraseñas no coinciden', tipo: 'error' });
      return;
    }
    setClaveActual('');
    setNuevaClave('');
    setRepetirClave('');
    toast({
      titulo: 'Contraseña actualizada',
      msj: 'La próxima vez ingresá con tu nueva clave.',
      tipo: 'exito',
    });
  };

  return (
    <div className="perfil-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Cuenta · Mi perfil</div>
          <h1>Mi perfil</h1>
        </div>
      </div>

      <div className="grilla-2">
        {/* Información Personal */}
        <div className="card">
          <div className="titulo-card">
            <h3>Información personal</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '20px' }}>
            <img
              className="avatar"
              src={user?.avatar}
              style={{ width: '80px', height: '80px', borderRadius: '50%' }}
              alt=""
            />
            <div>
              <h2 style={{ fontSize: '22px' }}>{nombre}</h2>
              <p className="tenue">
                {user?.rol === 'admin' ? 'Administrador del sistema' : 'Enfermero/a'}
                {area ? ' · ' + area.nombre : ''}
              </p>
              <button
                type="button"
                className="btn btn-fantasma btn-sm"
                style={{ marginTop: '6px' }}
                onClick={() => toast({ titulo: 'Avatar', msj: 'Foto de perfil sincronizada con Gravatar', tipo: 'info' })}
              >
                <Icono nombre="editar" size={14} /> Cambiar foto
              </button>
            </div>
          </div>

          <div className="grid-form">
            <div className="campo">
              <label>Nombre completo</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="campo">
              <label>Usuario</label>
              <input value={user?.usuario || 'usuario'} disabled />
            </div>
            <div className="campo full">
              <label>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="campo">
              <label>Teléfono</label>
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="campo">
              <label>Área</label>
              <input value={area?.nombre || 'Sin asignar'} disabled />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button type="button" className="btn btn-primario" id="guardarP" onClick={handleGuardarPerfil}>
              <Icono nombre="check" size={14} /> Guardar cambios
            </button>
          </div>
        </div>

        {/* Columna Derecha: Seguridad y Preferencias */}
        <div className="col">
          <div className="card">
            <div className="titulo-card">
              <h3>Seguridad</h3>
            </div>
            <div className="grid-form">
              <div className="campo full">
                <label>Contraseña actual</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={claveActual}
                  onChange={(e) => setClaveActual(e.target.value)}
                />
              </div>
              <div className="campo">
                <label>Nueva contraseña</label>
                <input
                  type="password"
                  placeholder="Mín. 8 caracteres"
                  value={nuevaClave}
                  onChange={(e) => setNuevaClave(e.target.value)}
                />
              </div>
              <div className="campo">
                <label>Repetir nueva</label>
                <input
                  type="password"
                  value={repetirClave}
                  onChange={(e) => setRepetirClave(e.target.value)}
                />
              </div>
            </div>
            <div style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="btn btn-secundario"
                id="cambClave"
                onClick={handleCambiarClave}
              >
                Cambiar contraseña
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: '20px' }}>
            <div className="titulo-card">
              <h3>Preferencias</h3>
            </div>
            <label className="check" style={{ display: 'flex', gap: '10px', padding: '10px 0', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Notificaciones en pantalla
            </label>
            <label className="check" style={{ display: 'flex', gap: '10px', padding: '10px 0', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Sonido de alerta al recibir un Código Azul
            </label>
            <label className="check" style={{ display: 'flex', gap: '10px', padding: '10px 0', cursor: 'pointer' }}>
              <input type="checkbox" /> Vibración en dispositivos móviles
            </label>
            <div className="campo" style={{ marginTop: '10px' }}>
              <label>Idioma</label>
              <select defaultValue="Español (Argentina)">
                <option>Español (Argentina)</option>
                <option>Español (España)</option>
                <option>English (US)</option>
                <option>Português (Brasil)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
