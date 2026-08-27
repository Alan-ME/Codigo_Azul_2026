import { useState } from 'react';

const OPCIONES_ROSC = [
  { valor: 'ROSC_EXITOSO', label: '🫀 ROSC Exitoso (Retorno de Circulación Espontánea)' },
  { valor: 'DESFIBRILACION_EFECTIVA', label: '⚡ Desfibrilación Efectiva / Ritmo Reversible' },
  { valor: 'TRASLADO_UTI', label: '🏥 Traslado a Unidad de Terapia Intensiva (UTI)' },
  { valor: 'FALLECIDO_DOA', label: '🛑 Fallecido / Reanimación No Exitosa (DOA)' },
  { valor: 'FALSA_ALARMA', label: '⚠️ Falsa Alarma / Cancelación Operativa' },
];

export default function ModalResolucion({ onConfirm, onCancel, incidente }) {
  const [resultadoClinico, setResultadoClinico] = useState('ROSC_EXITOSO');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!resultadoClinico) {
      setError('Seleccioná el resultado clínico del Código Azul.');
      return;
    }

    setEnviando(true);
    setError('');
    try {
      await onConfirm(resultadoClinico, observaciones.trim());
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Error al resolver el incidente.');
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-res-title">
      <form className="modal modal--resolucion" onSubmit={handleSubmit}>
        <header className="modal__header">
          <h2 id="modal-res-title">Cierre Clínico del Incidente #{incidente?.id}</h2>
          <p className="modal__sub">
            Auditoría médico-legal y resultado de reanimación según estándares internacionales (AHA / PERKI).
          </p>
        </header>

        {error && <div className="modal__error" role="alert">{error}</div>}

        <div className="modal__field">
          <label htmlFor="resultado-select">
            <strong>Resultado Clínico (Métrica ROSC) *</strong>
          </label>
          <select
            id="resultado-select"
            className="modal__select"
            value={resultadoClinico}
            onChange={(e) => setResultadoClinico(e.target.value)}
            disabled={enviando}
          >
            {OPCIONES_ROSC.map((op) => (
              <option key={op.valor} value={op.valor}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        <div className="modal__field">
          <label htmlFor="obs-clinicas">
            <strong>Observaciones Clínicas / Medicación administrada</strong>
            <span className="modal__hint"> (Opcional - registrado en auditoría inmutable)</span>
          </label>
          <textarea
            id="obs-clinicas"
            placeholder="Ej: Se realizaron 2 ciclos de RCP, descarga de 200J bifásica y 1mg Adrenalina. Paciente estabilizado."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            disabled={enviando}
            rows={3}
          />
        </div>

        <footer className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={enviando}
          >
            Volver
          </button>
          <button
            type="submit"
            className="btn btn--success"
            disabled={enviando}
          >
            {enviando ? 'Guardando Cierre…' : 'Finalizar y Sellar Incidente'}
          </button>
        </footer>
      </form>
    </div>
  );
}
