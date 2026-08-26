import { useState } from 'react';

export default function ModalCancelacion({ onConfirm, onCancel }) {
  const [motivo, setMotivo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('El motivo es obligatorio.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await onConfirm(motivo.trim());
    } catch (err) {
      setError(err?.response?.data?.message || 'No se pudo cancelar la alerta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <form className="modal" onSubmit={onSubmit}>
        <h2>Cancelar alerta</h2>
        <p>Indicá el motivo de cancelación (registro médico-legal obligatorio).</p>
        <textarea
          rows={4}
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          placeholder="Motivo…"
          autoFocus
          required
        />
        {error && <p className="modal__error" role="alert">{error}</p>}
        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onCancel}
            disabled={enviando}
          >
            Volver
          </button>
          <button type="submit" className="btn btn--danger" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Confirmar cancelación'}
          </button>
        </div>
      </form>
    </div>
  );
}
