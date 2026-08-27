// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/AyudaPage.jsx
// Manual, Protocolos de Emergencia y Soporte del Sistema.
// Replica 1:1 las secciones y estilos de public/js/pages/ayuda.js
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import Icono from '../components/common/Icono.jsx';

const SECCIONES = {
  protocolo: {
    titulo: 'Protocolo Código Azul',
    contenido: (
      <>
        <p className="tenue" style={{ marginBottom: '16px' }}>
          Este protocolo detalla el flujo estandarizado desde la detección de un evento crítico hasta el cierre del llamado en el sistema.
        </p>
        <div className="protocolo-paso">
          <div className="num">1</div>
          <div>
            <h4>El paciente activa el botón de alarma</h4>
            <p>El botón puede estar en la cama, en el baño, en una pulsera o accionarse por comando de voz según el área.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">2</div>
          <div>
            <h4>El sistema recibe la señal y clasifica el llamado</h4>
            <p>Se determina el tipo (Normal / Emergencia / Código Azul) y se muestra al enfermero asignado.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">3</div>
          <div>
            <h4>Notificación en tablero y app móvil</h4>
            <p>La tarjeta del llamado aparece en el tablero, se dispara un sonido y se envía notificación push a la app.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">4</div>
          <div>
            <h4>El enfermero toma el llamado</h4>
            <p>Presiona "Tomar" para marcarse como responsable de la atención.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">5</div>
          <div>
            <h4>Atención presencial del paciente</h4>
            <p>El personal se dirige a la cama y realiza el procedimiento. Si es Código Azul se activa el equipo de reanimación.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">6</div>
          <div>
            <h4>Cierre del llamado</h4>
            <p>Al finalizar, se registra "Atendido" con nota opcional. El tiempo de respuesta queda registrado.</p>
          </div>
        </div>
        <div className="protocolo-paso">
          <div className="num">7</div>
          <div>
            <h4>Análisis y estadísticas</h4>
            <p>La información alimenta el módulo de reportes para monitorear la calidad de atención por área y por enfermero.</p>
          </div>
        </div>
      </>
    ),
  },
  uso: {
    titulo: 'Cómo usar el sistema',
    contenido: (
      <>
        <h3 style={{ marginBottom: '8px' }}>Navegación principal</h3>
        <p className="tenue" style={{ marginBottom: '14px' }}>
          Usá el menú lateral para moverte entre secciones. Todo el sistema se opera con teclado y mouse.
        </p>
        <ul style={{ paddingLeft: '20px', lineHeight: 1.9 }}>
          <li>
            <strong>Dashboard</strong>: vista general con KPIs y gráficos.
          </li>
          <li>
            <strong>Tablero en vivo</strong>: llamados abiertos en tiempo real.
          </li>
          <li>
            <strong>Pacientes</strong>: ficha completa y ABM de pacientes.
          </li>
          <li>
            <strong>Historial</strong>: consulta con filtros y exportación.
          </li>
          <li>
            <strong>Reportes</strong>: estadísticas visuales para gestión.
          </li>
        </ul>
      </>
    ),
  },
  equipo: {
    titulo: 'Créditos del equipo',
    contenido: (
      <>
        <div className="grilla-2">
          <div className="card">
            <h4>Frontend</h4>
            <p className="tenue">
              Diseño de interfaces, tablero en tiempo real, reportes estadísticos y experiencia mobile.
            </p>
          </div>
          <div className="card">
            <h4>Backend</h4>
            <p className="tenue">
              API REST, autenticación, base de datos PostgreSQL, integración con dispositivos físicos y WebSockets.
            </p>
          </div>
        </div>
        <p className="tenue" style={{ marginTop: '14px' }}>
          Trabajo integrador — ONETP 2026 · Programación.
        </p>
      </>
    ),
  },
  contacto: {
    titulo: 'Soporte y contacto',
    contenido: (
      <>
        <p className="tenue" style={{ marginBottom: '16px' }}>
          Si necesitás ayuda con el sistema, contactate con nosotros por cualquiera de estos medios:
        </p>
        <div className="grilla-2">
          <div className="card">
            <h4>
              <Icono nombre="email" size={16} /> Email
            </h4>
            <p>soporte.codigoazul@hospital.gob.ar</p>
          </div>
          <div className="card">
            <h4>
              <Icono nombre="telefono" size={16} /> Interno
            </h4>
            <p>2010 — Área de Sistemas</p>
          </div>
        </div>
        <p className="tenue" style={{ marginTop: '14px' }}>
          Horario de atención: lunes a viernes de 08:00 a 20:00.
        </p>
      </>
    ),
  },
};

export default function AyudaPage() {
  const [seccionActiva, setSeccionActiva] = useState('protocolo');

  return (
    <div className="ayuda-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Otros · Ayuda</div>
          <h1>Manual y ayuda</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            Todo lo que necesitás saber para usar el sistema Código Azul.
          </p>
        </div>
        <div className="badge b-azul">Versión 1.0.0</div>
      </div>

      <div className="ayuda-grilla">
        <nav className="ayuda-nav">
          {Object.entries(SECCIONES).map(([k, s]) => (
            <a
              key={k}
              href={`#${k}`}
              className={k === seccionActiva ? 'activo' : ''}
              onClick={(e) => {
                e.preventDefault();
                setSeccionActiva(k);
              }}
            >
              {s.titulo}
            </a>
          ))}
        </nav>

        <div className="card" id="contAyuda">
          <h2 style={{ marginBottom: '12px' }}>{SECCIONES[seccionActiva].titulo}</h2>
          {SECCIONES[seccionActiva].contenido}
        </div>
      </div>
    </div>
  );
}
