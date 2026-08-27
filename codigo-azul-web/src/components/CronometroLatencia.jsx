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

export default function CronometroLatencia({ desde }) {
  const [seg, setSeg] = useState(() => segundosDesde(desde));

  useEffect(() => {
    setSeg(segundosDesde(desde));
    const id = setInterval(() => setSeg(segundosDesde(desde)), 1000);
    return () => clearInterval(id);
  }, [desde]);

  return <time className="cronometro" aria-label="Tiempo de respuesta">{formatear(seg)}</time>;
}
