// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/SelectorUbicacionPicker.jsx
// Selector jerárquico en 4 pasos: Edificio -> Piso -> Sala -> Cama
// ─────────────────────────────────────────────────────────────

import Icono from '../../common/Icono.jsx';

export default function SelectorUbicacionPicker({
  pasoSelector,
  setPasoSelector,
  edificioSel,
  setEdificioSel,
  pisoSel,
  setPisoSel,
  salaSel,
  setSalaSel,
  camaSel,
  setCamaSel,
  catalogoUbicaciones,
  pisosDisponibles,
  salasDisponibles,
  camasDisponibles,
  onFinalizar,
  onCancelar,
}) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        background: '#0b1329',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>
            PASO {pasoSelector} DE 4
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0', color: '#fff' }}>
            {pasoSelector === 1 && 'Seleccionar Edificio'}
            {pasoSelector === 2 && `Pisos en ${edificioSel?.nombre}`}
            {pasoSelector === 3 && `Salas en ${pisoSel?.nombre}`}
            {pasoSelector === 4 && `Cama en ${salaSel?.nombre}`}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
          }}
        >
          <Icono nombre="cerrar" size={20} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', gap: '8px', overflowY: 'auto' }}>
        {/* PASO 1: EDIFICIOS */}
        {pasoSelector === 1 &&
          catalogoUbicaciones.map((ed) => (
            <button
              key={ed.id}
              type="button"
              onClick={() => {
                setEdificioSel(ed);
                setPisoSel(ed.pisos[0]);
                setSalaSel(ed.pisos[0]?.salas[0]);
                setCamaSel(ed.pisos[0]?.salas[0]?.camas[0] || 'Cama 01');
                setPasoSelector(2);
              }}
              style={{
                background: edificioSel?.id === ed.id ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: edificioSel?.id === ed.id ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{ed.nombre}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ed.pisos.length} Niveles disponibles</div>
              </div>
              <Icono nombre="chevronDerecha" size={18} color="#94a3b8" />
            </button>
          ))}

        {/* PASO 2: PISOS */}
        {pasoSelector === 2 &&
          pisosDisponibles.map((pi) => (
            <button
              key={pi.id}
              type="button"
              onClick={() => {
                setPisoSel(pi);
                setSalaSel(pi.salas[0]);
                setCamaSel(pi.salas[0]?.camas[0] || 'Cama 01');
                setPasoSelector(3);
              }}
              style={{
                background: pisoSel?.id === pi.id ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: pisoSel?.id === pi.id ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{pi.nombre}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pi.salas.length} Salas / Sectores</div>
              </div>
              <Icono nombre="chevronDerecha" size={18} color="#94a3b8" />
            </button>
          ))}

        {/* PASO 3: SALAS */}
        {pasoSelector === 3 &&
          salasDisponibles.map((sa) => (
            <button
              key={sa.id}
              type="button"
              onClick={() => {
                setSalaSel(sa);
                setCamaSel(sa.camas[0] || 'Cama 01');
                setPasoSelector(4);
              }}
              style={{
                background: salaSel?.id === sa.id ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                border: salaSel?.id === sa.id ? '1.5px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '14px',
                color: '#fff',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{sa.nombre}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{sa.camas.length} Camas activas</div>
              </div>
              <Icono nombre="chevronDerecha" size={18} color="#94a3b8" />
            </button>
          ))}

        {/* PASO 4: CAMAS */}
        {pasoSelector === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {camasDisponibles.map((ca) => (
              <button
                key={ca}
                type="button"
                onClick={() => {
                  setCamaSel(ca);
                  onFinalizar(ca);
                }}
                style={{
                  background: camaSel === ca ? '#0b5fff' : 'rgba(255, 255, 255, 0.06)',
                  border: camaSel === ca ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '12px',
                  padding: '18px 10px',
                  color: '#fff',
                  textAlign: 'center',
                  cursor: 'pointer',
                  fontWeight: 800,
                  fontSize: '15px',
                }}
              >
                🛏️ {ca}
              </button>
            ))}
          </div>
        )}
      </div>

      {pasoSelector > 1 && (
        <button
          type="button"
          onClick={() => setPasoSelector((p) => Math.max(1, p - 1))}
          style={{
            marginTop: '12px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '12px',
            color: '#cbd5e1',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ← Volver al paso anterior
        </button>
      )}
    </div>
  );
}
