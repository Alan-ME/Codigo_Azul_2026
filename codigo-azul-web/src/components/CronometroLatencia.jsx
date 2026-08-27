import { useEffect, useState } from 'react';

function segundosDesde(iso) {
  const inicio = new Date(iso).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.max(0, Math.floor((Date.now() - inicio) / 1000));
}

function formatear(segundos) {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CronometroLatencia({ desde, estado = 'ACTIVADO' }) {
  const [seg, setSeg] = useState(() => segundosDesde(desde));

  useEffect(() => {
    setSeg(segundosDesde(desde));
    const id = setInterval(() => setSeg(segundosDesde(desde)), 1000);
    return () => clearInterval(id);
  }, [desde]);

  // Si no ha sido atendido (ACTIVADO / NOTIFICADO), evaluar umbrales clínicos AHA
  const sinAck = estado === 'ACTIVADO' || estado === 'NOTIFICADO';
  let claseAlarma = '';
  let badgeAha = null;

  if (sinAck) {
    if (seg >= 180) {
      claseAlarma = 'cronometro--critico';
      badgeAha = (
        <span className="badge-aha badge-aha--critico" title="Estándar AHA: Respuesta recomendada < 3 minutos">
          🚨 &gt;3 min sin ACK (Límite AHA excedido)
        </span>
      );
    } else if (seg >= 120) {
      claseAlarma = 'cronometro--advertencia';
      badgeAha = (
        <span className="badge-aha badge-aha--advertencia" title="Atención: Se aproxima a la ventana límite de 3 minutos">
          ⚠️ &gt;2 min sin ACK
        </span>
      );
    }
  }

  return (
    <div className="cronometro-contenedor">
      <time className={`cronometro ${claseAlarma}`} aria-label="Tiempo de respuesta">
        {formatear(seg)}
      </time>
      {badgeAha}
    </div>
  );
}

