import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useIncidentes } from '../context/IncidentesContext.jsx';
import { soundService } from '../services/soundService.js';
import IncidenteCard from '../components/IncidenteCard.jsx';
import ModalCancelacion from '../components/ModalCancelacion.jsx';
import ModalResolucion from '../components/ModalResolucion.jsx';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { incidentes, conectado, confirmarAck, cancelar, resolver, registrarEventoClinico } = useIncidentes();
  const [cancelandoId, setCancelandoId] = useState(null);
  const [resolviendoIncidente, setResolviendoIncidente] = useState(null);

  // Si el usuario aterriza aquí con una sesión persistida, desbloqueamos el
  // audio en el primer clic para que la sirena pueda dispararse luego.
  useEffect(() => {
    const handler = () => soundService.prime().catch(() => {});
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, []);

  const onConfirmCancel = async (motivo) => {
    if (cancelandoId === null) return;
    await cancelar(cancelandoId, motivo);
    setCancelandoId(null);
  };

  const onConfirmResolver = async (resultadoClinico, observaciones) => {
    if (!resolviendoIncidente) return;
    await resolver(resolviendoIncidente.id, resultadoClinico, observaciones);
    setResolviendoIncidente(null);
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div>
          <h1>Panel de Guardia — Código Azul</h1>
          <p className="dashboard__user">
            {user?.nombre} {user?.apellido} <span className="rol">· {user?.rol}</span>
          </p>
        </div>
        <div className="dashboard__status">
          <span className={`status-dot ${conectado ? 'ok' : 'off'}`} aria-hidden="true" />
          <span>{conectado ? 'En tiempo real' : 'Reconectando…'}</span>
          <button type="button" className="btn btn--ghost" onClick={logout}>Salir</button>
        </div>
      </header>

      <main className="dashboard__grid" aria-live="polite">
        {incidentes.length === 0 && (
          <div className="dashboard__empty">
            <p>Sin incidentes activos en este momento.</p>
          </div>
        )}
        {incidentes.map((inc) => (
          <IncidenteCard
            key={inc.id}
            incidente={inc}
            onAck={() => confirmarAck(inc.id)}
            onCancel={() => setCancelandoId(inc.id)}
            onResolver={() => setResolviendoIncidente(inc)}
            onEventoClinico={registrarEventoClinico}
          />
        ))}
      </main>

      {cancelandoId !== null && (
        <ModalCancelacion
          onCancel={() => setCancelandoId(null)}
          onConfirm={onConfirmCancel}
        />
      )}

      {resolviendoIncidente !== null && (
        <ModalResolucion
          incidente={resolviendoIncidente}
          onCancel={() => setResolviendoIncidente(null)}
          onConfirm={onConfirmResolver}
        />
      )}
    </div>
  );
}

