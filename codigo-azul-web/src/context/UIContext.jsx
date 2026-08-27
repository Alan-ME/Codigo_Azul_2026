// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/context/UIContext.jsx
// Contexto global de UI: Toasts, Modales, Confirmaciones, Tema y Formateadores.
// Mantiene 100% el diseño, clases y comportamiento de App.ui.
// ─────────────────────────────────────────────────────────────

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Icono from '../components/common/Icono.jsx';

const UIContext = createContext(null);

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

export const uiFormatters = {
  formatearHora(iso) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  },
  formatearFecha(iso) {
    if (!iso) return '--/--/----';
    const d = new Date(iso);
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  },
  formatearFechaHora(iso) {
    if (!iso) return '--';
    return uiFormatters.formatearFecha(iso) + ' ' + uiFormatters.formatearHora(iso);
  },
  haceCuanto(iso) {
    if (!iso) return '';
    const seg = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
    if (seg < 60) return 'hace ' + seg + 's';
    if (seg < 3600) return 'hace ' + Math.floor(seg / 60) + ' min';
    if (seg < 86400) return 'hace ' + Math.floor(seg / 3600) + ' h';
    return uiFormatters.formatearFecha(iso);
  },
  segundosADuracion(seg) {
    const s = Math.max(0, Math.floor(seg || 0));
    const m = Math.floor(s / 60);
    const resto = s % 60;
    return `${pad(m)}:${pad(resto)}`;
  },
  avatarFallback(texto = 'CA', bg = '#0B5FFF') {
    const iniciales = (texto || 'CA').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" rx="50" fill="${encodeURIComponent(bg)}"/><text x="50" y="62" font-family="Arial,sans-serif" font-size="38" font-weight="bold" fill="%23ffffff" text-anchor="middle">${iniciales}</text></svg>`;
  },
};

export function UIProvider({ children }) {
  const [tema, setTema] = useState(() => localStorage.getItem('codigo_azul_tema') || 'claro');
  const [toasts, setToasts] = useState([]);
  const [modalActual, setModalActual] = useState(null);

  // Sincronizar tema con documentElement
  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem('codigo_azul_tema', tema);
  }, [tema]);

  const toggleTema = useCallback(() => {
    setTema(prev => (prev === 'oscuro' ? 'claro' : 'oscuro'));
  }, []);

  // Toasts
  const toast = useCallback(({ titulo, msj, tipo = 'info', duracion = 3500 } = {}) => {
    const id = Date.now() + Math.random();
    const nuevoToast = { id, titulo, msj, tipo, saliendo: false };
    setToasts(prev => [...prev, nuevoToast]);

    setTimeout(() => {
      setToasts(prev => prev.map(t => (t.id === id ? { ...t, saliendo: true } : t)));
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 250);
    }, duracion);
  }, []);

  // Modales genéricos
  const abrirModal = useCallback(({ titulo, cuerpo, pie, ancho, angosto, onClose }) => {
    setModalActual({ titulo, cuerpo, pie, ancho, angosto, onClose });
  }, []);

  const cerrarModal = useCallback(() => {
    if (modalActual?.onClose) modalActual.onClose();
    setModalActual(null);
  }, [modalActual]);

  // Diálogo de Confirmación
  const confirmar = useCallback(({ titulo, mensaje, textoOk = 'Confirmar', textoCancel = 'Cancelar', peligroso = false } = {}) => {
    return new Promise(resolve => {
      setModalActual({
        titulo,
        angosto: true,
        cuerpo: <p>{mensaje}</p>,
        pie: (
          <>
            <button
              type="button"
              className="btn btn-fantasma"
              onClick={() => {
                setModalActual(null);
                resolve(false);
              }}
            >
              {textoCancel}
            </button>
            <button
              type="button"
              className={`btn ${peligroso ? 'btn-peligro' : 'btn-primario'}`}
              onClick={() => {
                setModalActual(null);
                resolve(true);
              }}
            >
              {textoOk}
            </button>
          </>
        ),
        onClose: () => resolve(false),
      });
    });
  }, []);

  // Manejo de ESC para cerrar modal
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape' && modalActual) cerrarModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalActual, cerrarModal]);

  const value = useMemo(
    () => ({
      tema,
      toggleTema,
      toast,
      abrirModal,
      cerrarModal,
      confirmar,
      ...uiFormatters,
    }),
    [tema, toggleTema, toast, abrirModal, cerrarModal, confirmar],
  );

  const iconoMap = { exito: 'check', error: 'cruz', aviso: 'alerta', info: 'campana' };

  return (
    <UIContext.Provider value={value}>
      {children}

      {/* Contenedor Flotante de Toasts */}
      {toasts.length > 0 && (
        <div className="toast-cont">
          {toasts.map(t => (
            <div key={t.id} className={`toast ${t.tipo} ${t.saliendo ? 'saliendo' : ''}`}>
              <div className="icono">
                <Icono nombre={iconoMap[t.tipo] || 'check'} size={22} />
              </div>
              <div>
                <div className="titulo">{t.titulo}</div>
                {t.msj && <div className="msj">{t.msj}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Backdrop y Modal Activo */}
      {modalActual && (
        <div
          className="backdrop-modal"
          onClick={e => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div
            className={`modal ${modalActual.ancho ? 'ancho' : modalActual.angosto ? 'angosto' : ''}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="cabecera-modal">
              <h3>{modalActual.titulo || ''}</h3>
              <button type="button" className="cerrar" aria-label="Cerrar" onClick={cerrarModal}>
                <Icono nombre="cruz" size={20} />
              </button>
            </div>
            <div className="cuerpo-modal">{modalActual.cuerpo}</div>
            {modalActual.pie && <div className="pie-modal">{modalActual.pie}</div>}
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI debe utilizarse dentro de un <UIProvider>');
  return ctx;
}
