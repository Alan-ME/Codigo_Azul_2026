import { useState, useEffect, useMemo } from 'react';
import { incidentesService } from '../services/incidentesService.js';
import { hapticaService } from '../services/hapticaService.js';

export default function SelectorUbicacionModal({ isOpen, onClose, onSelect, ubicacionActual }) {
  const [ubicaciones, setUbicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [edificioSel, setEdificioSel] = useState('');
  const [pisoSel, setPisoSel] = useState('');
  const [salaSel, setSalaSel] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    let cancel = false;
    setCargando(true);
    setError('');

    incidentesService.listarUbicaciones()
      .then((data) => {
        if (cancel) return;
        const lista = Array.isArray(data) ? data : (data?.ubicaciones || []);
        setUbicaciones(lista);
        // Preseleccionar si ya hay una cama elegida
        if (ubicacionActual) {
          setEdificioSel(ubicacionActual.edificio || '');
          setPisoSel(ubicacionActual.piso !== undefined ? String(ubicacionActual.piso) : '');
          setSalaSel(ubicacionActual.sector_sala || ubicacionActual.sectorSala || '');
        } else if (lista.length > 0) {
          setEdificioSel(lista[0].edificio);
          setPisoSel(String(lista[0].piso));
          setSalaSel(lista[0].sector_sala || lista[0].sectorSala);
        }
      })
      .catch((err) => {
        if (cancel) return;
        setError(err.message || 'Error al cargar ubicaciones hospitalarias.');
      })
      .finally(() => {
        if (!cancel) setCargando(false);
      });

    return () => { cancel = true; };
  }, [isOpen, ubicacionActual]);

  // Agrupamiento dinámico
  const edificios = useMemo(() => {
    return Array.from(new Set(ubicaciones.map((u) => u.edificio).filter(Boolean)));
  }, [ubicaciones]);

  const pisos = useMemo(() => {
    if (!edificioSel) return [];
    return Array.from(
      new Set(
        ubicaciones
          .filter((u) => u.edificio === edificioSel)
          .map((u) => String(u.piso))
      )
    );
  }, [ubicaciones, edificioSel]);

  const salas = useMemo(() => {
    if (!edificioSel || pisoSel === '') return [];
    return Array.from(
      new Set(
        ubicaciones
          .filter((u) => u.edificio === edificioSel && String(u.piso) === String(pisoSel))
          .map((u) => u.sector_sala || u.sectorSala)
          .filter(Boolean)
      )
    );
  }, [ubicaciones, edificioSel, pisoSel]);

  const camas = useMemo(() => {
    if (!edificioSel || pisoSel === '' || !salaSel) return [];
    return ubicaciones.filter(
      (u) =>
        u.edificio === edificioSel &&
        String(u.piso) === String(pisoSel) &&
        (u.sector_sala === salaSel || u.sectorSala === salaSel)
    );
  }, [ubicaciones, edificioSel, pisoSel, salaSel]);

  if (!isOpen) return null;

  const handleSeleccionarCama = (cama) => {
    hapticaService.confirmacion();
    try {
      localStorage.setItem('codigo_azul_cama_seleccionada', JSON.stringify(cama));
    } catch {}
    onSelect(cama);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal modal--selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">📍 Seleccionar Ubicación de Disparo</h2>
            <p className="modal-subtitle">Elegí la cama o sala donde se activa el Código Azul</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {cargando ? (
          <div className="modal-loading">Cargando salas y camas del hospital…</div>
        ) : error ? (
          <div className="modal-error">{error}</div>
        ) : (
          <div className="selector-body">
            {/* Paso 1: Edificio */}
            <div className="selector-col">
              <label className="selector-label">1. Edificio</label>
              <div className="selector-pills">
                {edificios.map((ed) => (
                  <button
                    key={ed}
                    type="button"
                    className={`selector-pill ${edificioSel === ed ? 'selector-pill--active' : ''}`}
                    onClick={() => {
                      setEdificioSel(ed);
                      const primerosPisos = ubicaciones.filter((u) => u.edificio === ed);
                      if (primerosPisos.length > 0) {
                        setPisoSel(String(primerosPisos[0].piso));
                        setSalaSel(primerosPisos[0].sector_sala || primerosPisos[0].sectorSala);
                      }
                    }}
                  >
                    🏢 {ed}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 2: Piso */}
            <div className="selector-col">
              <label className="selector-label">2. Piso / Nivel</label>
              <div className="selector-pills">
                {pisos.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`selector-pill ${pisoSel === p ? 'selector-pill--active' : ''}`}
                    onClick={() => {
                      setPisoSel(p);
                      const primerasSalas = ubicaciones.filter(
                        (u) => u.edificio === edificioSel && String(u.piso) === p
                      );
                      if (primerasSalas.length > 0) {
                        setSalaSel(primerasSalas[0].sector_sala || primerasSalas[0].sectorSala);
                      }
                    }}
                  >
                    Piso {p === '0' ? 'PB' : p}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 3: Sala / Sector */}
            <div className="selector-col">
              <label className="selector-label">3. Sector / Sala</label>
              <div className="selector-pills">
                {salas.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`selector-pill ${salaSel === s ? 'selector-pill--active' : ''}`}
                    onClick={() => setSalaSel(s)}
                  >
                    🏥 {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Paso 4: Camas */}
            <div className="selector-col selector-col--camas">
              <label className="selector-label">4. Cama / Unidad destino</label>
              <div className="camas-grid">
                {camas.map((c) => {
                  const tieneCarro = c.tiene_carro_paro ?? c.tieneCarroParo;
                  const isSelected = (ubicacionActual?.id === c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      className={`cama-card ${isSelected ? 'cama-card--selected' : ''}`}
                      onClick={() => handleSeleccionarCama(c)}
                    >
                      <div className="cama-nombre">🛏️ {c.cama}</div>
                      <div className={`carro-mini-badge ${tieneCarro ? 'carro-mini--si' : 'carro-mini--no'}`}>
                        {tieneCarro ? '🟢 Carro / DEA en sala' : '⚠️ Sin Carro fijo'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
