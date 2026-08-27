import CronometroLatencia from './CronometroLatencia.jsx';

const CLASE_POR_ESTADO = {
  ACTIVADO: 'card--rojo',
  NOTIFICADO: 'card--rojo',
  EN_ATENCION: 'card--naranja',
  RESUELTO: 'card--verde',
  CANCELADO: 'card--verde',
};

export default function IncidenteCard({ incidente, onAck, onCancel }) {
  const clase = CLASE_POR_ESTADO[incidente.estado] || 'card--rojo';
  const { ubicacion, activadoPor, reanimador } = incidente;
  const puedeAck = incidente.estado === 'ACTIVADO' || incidente.estado === 'NOTIFICADO';
  const puedeCancelar = puedeAck || incidente.estado === 'EN_ATENCION';

  const sala = ubicacion?.sectorSala ?? ubicacion?.sector_sala ?? '—';
  const cama = ubicacion?.cama ?? '—';
  const edificio = ubicacion?.edificio ?? '—';
  const piso = ubicacion?.piso ?? '—';

  return (
    <article className={`card ${clase}`}>
      <header className="card__head">
        <span className="card__estado">{incidente.estado.replace('_', ' ')}</span>
        <CronometroLatencia desde={incidente.createdAt} />
      </header>
      <div className="card__body">
        <h2 className="card__ubicacion">
          {edificio} · Piso {piso}
        </h2>
        <p><strong>Sala:</strong> {sala} · <strong>Cama:</strong> {cama}</p>
        <p><strong>Activado por:</strong> {activadoPor?.nombre ?? '—'}</p>
        {reanimador && (
          <p><strong>Reanimador:</strong> {reanimador.nombre}</p>
        )}
      </div>
      <footer className="card__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onAck}
          disabled={!puedeAck}
        >
          Confirmar Asistencia
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={onCancel}
          disabled={!puedeCancelar}
        >
          Cancelar Alarma
        </button>
      </footer>
    </article>
  );
}
