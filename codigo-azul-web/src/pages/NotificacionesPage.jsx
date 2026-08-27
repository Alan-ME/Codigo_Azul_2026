// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/pages/NotificacionesPage.jsx
// Centro y Auditoría de Notificaciones del Sistema.
// Replica 1:1 los chips, tarjetas y estados de public/js/pages/notificaciones.js
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useUI } from '../context/UIContext.jsx';
import Icono from '../components/common/Icono.jsx';
import { initialNotificaciones } from '../data/mockData.js';

export default function NotificacionesPage() {
  const { toast, haceCuanto, formatearFechaHora } = useUI();
  const [notificaciones, setNotificaciones] = useState(initialNotificaciones);
  const [filtro, setFiltro] = useState('todas');

  const chips = ['todas', 'codigo-azul', 'emergencia', 'normal', 'sistema', 'aviso'];

  const noLeidas = useMemo(() => notificaciones.filter((n) => !n.leida).length, [notificaciones]);

  const filtradas = useMemo(() => {
    return notificaciones.filter((n) => (filtro === 'todas' ? true : n.tipo === filtro));
  }, [notificaciones, filtro]);

  const handleMarcarTodas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
    toast({ titulo: 'Notificaciones marcadas como leídas', tipo: 'exito' });
  };

  const handleToggleLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: !n.leida } : n))
    );
  };

  return (
    <div className="notificaciones-page aparecer">
      <div className="cabecera-pagina">
        <div>
          <div className="rastro">Cuenta · Notificaciones</div>
          <h1>Notificaciones</h1>
          <p className="tenue" style={{ marginTop: '4px' }}>
            {notificaciones.length} notificaciones · {noLeidas} sin leer.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="button" className="btn btn-secundario" id="marcarTodas" onClick={handleMarcarTodas}>
            Marcar todas como leídas
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }} id="chipsN">
        {chips.map((f) => (
          <button
            key={f}
            type="button"
            className={`chip ${filtro === f ? 'activo' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card" id="listaN" style={{ padding: 0, overflow: 'hidden' }}>
        {filtradas.length === 0 ? (
          <div className="empty">
            <h3>Sin notificaciones en esta categoría</h3>
          </div>
        ) : (
          filtradas.map((n) => {
            const iconoMap = {
              'codigo-azul': 'alerta',
              emergencia: 'alerta',
              normal: 'campana',
              sistema: 'configuracion',
              aviso: 'alerta',
            };
            const colorMap = {
              'codigo-azul': '#0047FF',
              emergencia: '#DC2626',
              normal: '#F59E0B',
              sistema: '#0B5FFF',
              aviso: '#F59E0B',
            };

            return (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 18px',
                  borderBottom: '1px solid var(--borde)',
                  background: n.leida ? 'transparent' : 'rgba(11, 95, 255, 0.03)',
                  cursor: 'pointer',
                }}
                onClick={() => handleToggleLeida(n.id)}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'grid',
                    placeItems: 'center',
                    background: colorMap[n.tipo] || '#0B5FFF',
                    color: '#fff',
                  }}
                >
                  <Icono nombre={iconoMap[n.tipo] || 'campana'} size={20} color="#ffffff" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.leida ? 400 : 600 }}>{n.texto}</div>
                  <div className="tenue" style={{ fontSize: '12px' }}>
                    {haceCuanto(n.hora)} · {formatearFechaHora(n.hora)}
                  </div>
                </div>
                {!n.leida && <span className="badge b-azul">Nueva</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
