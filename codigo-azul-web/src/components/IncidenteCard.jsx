import { useState } from 'react';
import CronometroLatencia from './CronometroLatencia.jsx';

const CLASE_POR_ESTADO = {
  ACTIVADO: 'card--rojo',
  NOTIFICADO: 'card--rojo',
  EN_ATENCION: 'card--naranja',
  RESUELTO: 'card--verde',
  CANCELADO: 'card--verde',
};

export default function IncidenteCard({ incidente, onAck, onCancel, onResolver, onEventoClinico }) {
  const [logueandoEvento, setLogueandoEvento] = useState(false);
  const [ultimoEvento, setUltimoEvento] = useState(null);

  const clase = CLASE_POR_ESTADO[incidente.estado] || 'card--rojo';
  const { ubicacion, activadoPor, reanimador } = incidente;
  const puedeAck = incidente.estado === 'ACTIVADO' || incidente.estado === 'NOTIFICADO';
  const puedeResolver = incidente.estado === 'EN_ATENCION';
  const puedeCancelar = puedeAck || puedeResolver;

  const sala = ubicacion?.sectorSala ?? ubicacion?.sector_sala ?? '—';
  const cama = ubicacion?.cama ?? '—';
  const edificio = ubicacion?.edificio ?? '—';
  const piso = ubicacion?.piso ?? '—';
  const tieneCarroParo = ubicacion?.tieneCarroParo ?? ubicacion?.tiene_carro_paro ?? false;

  const registrarHito = async (tipoEvento, detalle = '') => {
    if (!onEventoClinico || logueandoEvento) return;
    setLogueandoEvento(true);
    try {
      await onEventoClinico(incidente.id, tipoEvento, detalle);
      setUltimoEvento(tipoEvento);
      setTimeout(() => setUltimoEvento(null), 3000);
    } finally {
      setLogueandoEvento(false);
    }
  };

  return (
    <article className={`card ${clase}`}>
      <header className="card__head">
        <span className="card__estado">{incidente.estado.replace('_', ' ')}</span>
        <CronometroLatencia desde={incidente.createdAt} estado={incidente.estado} />
      </header>

      <div className="card__body">
        <h2 className="card__ubicacion">
          {edificio} · Piso {piso}
        </h2>
        <p><strong>Sala:</strong> {sala} · <strong>Cama:</strong> {cama}</p>

        {/* Indicador de Carro de Paro / AED */}
        <div className="card__equipamiento">
          {tieneCarroParo ? (
            <span className="badge-carro badge-carro--disponible">
              🟢 Carro de Paro / AED presente en sala
            </span>
          ) : (
            <span className="badge-carro badge-carro--requerido">
              ⚠️ Sala SIN Carro de Paro — <strong>Reanimador debe transportar DEA móvil</strong>
            </span>
          )}
        </div>

        <p><strong>Activado por:</strong> {activadoPor?.nombre ?? '—'}</p>
        {reanimador && (
          <p><strong>Reanimador a cargo:</strong> {reanimador.nombre}</p>
        )}
        {incidente.resultadoClinicoDescripcion && (
          <p className="card__resultado">
            <strong>Resultado:</strong> {incidente.resultadoClinicoDescripcion}
          </p>
        )}

        {/* Panel de Hitos de Reanimación Rápida durante la atención */}
        {puedeResolver && (
          <div className="card__hitos">
            <span className="hitos-titulo">⚡ Registro Rápido de Hitos Clínicos (AHA):</span>
            <div className="hitos-botones">
              <button
                type="button"
                className="btn-hito"
                disabled={logueandoEvento}
                onClick={() => registrarHito('DESCARGA_AED', 'Descarga de desfibrilador aplicada')}
                title="Registrar descarga AED"
              >
                ⚡ 1ra Descarga AED
              </button>
              <button
                type="button"
                className="btn-hito"
                disabled={logueandoEvento}
                onClick={() => registrarHito('INICIO_RCP', 'Compresiones torácicas iniciadas')}
                title="Registrar inicio RCP"
              >
                🫀 Inicio RCP
              </button>
              <button
                type="button"
                className="btn-hito"
                disabled={logueandoEvento}
                onClick={() => registrarHito('DROGA_ADRENALINA', '1mg Adrenalina IV')}
                title="Registrar Adrenalina"
              >
                💉 Adrenalina
              </button>
            </div>
            {ultimoEvento && (
              <span className="hitos-confirmacion">✓ Hito registrado en auditoría inmutable</span>
            )}
          </div>
        )}
      </div>

      <footer className="card__actions">
        {puedeAck && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={onAck}
          >
            Confirmar Asistencia (ACK)
          </button>
        )}

        {puedeResolver && (
          <button
            type="button"
            className="btn btn--success"
            onClick={onResolver}
          >
            ✓ Cierre Clínico (ROSC / Resolver)
          </button>
        )}

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

