// ─────────────────────────────────────────────────────────────
// client/src/components/mobile/screens/SelectorUbicacionPicker.jsx
// Selector jerárquico en 4 pasos con diseño pulido y alta jerarquía visual:
// Edificio -> Piso -> Sala -> Cama
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
        padding: '20px 16px',
        background: '#0a0f1d',
        overflowY: 'auto',
      }}
    >
      {/* 1. Barra de Progreso en 4 Píldoras */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '18px' }}>
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            style={{
              height: '4px',
              borderRadius: '999px',
              background: step <= pasoSelector ? '#0b5fff' : 'rgba(255, 255, 255, 0.12)',
              transition: 'background 0.3s ease',
            }}
          />
        ))}
      </div>

      {/* 2. Cabecera con Paso y Título */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>
            Paso {pasoSelector} de 4
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '4px 0 0', color: '#ffffff', letterSpacing: '-0.02em' }}>
            {pasoSelector === 1 && 'Seleccionar edificio'}
            {pasoSelector === 2 && 'Seleccionar piso'}
            {pasoSelector === 3 && 'Seleccionar sector / sala'}
            {pasoSelector === 4 && 'Seleccionar cama'}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'grid',
            placeItems: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          <Icono nombre="cruz" size={16} />
        </button>
      </div>

      {/* 3. Contenedor de Tarjetas Compactas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* PASO 1: EDIFICIOS */}
        {pasoSelector === 1 &&
          catalogoUbicaciones.map((ed) => {
            const isSelected = edificioSel?.id === ed.id;
            return (
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
                  background: isSelected ? 'rgba(11, 95, 255, 0.12)' : '#0f172a',
                  border: isSelected ? '1.5px solid #0b5fff' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 20px rgba(11, 95, 255, 0.18)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icono nombre="hospital" size={22} color={isSelected ? '#38bdf8' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{ed.nombre}</div>
                  <div style={{ fontSize: '13px', color: isSelected ? '#38bdf8' : '#94a3b8', marginTop: '2px' }}>
                    {ed.pisos.length} {ed.pisos.length === 1 ? 'nivel disponible' : 'niveles disponibles'}
                  </div>
                </div>
                {isSelected ? (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0b5fff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 8px rgba(11, 95, 255, 0.4)',
                    }}
                  >
                    <Icono nombre="check" size={15} color="#ffffff" />
                  </div>
                ) : (
                  <Icono nombre="chevronDerecha" size={18} color="#64748b" />
                )}
              </button>
            );
          })}

        {/* PASO 2: PISOS */}
        {pasoSelector === 2 &&
          pisosDisponibles.map((pi) => {
            const isSelected = pisoSel?.id === pi.id;
            return (
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
                  background: isSelected ? 'rgba(11, 95, 255, 0.12)' : '#0f172a',
                  border: isSelected ? '1.5px solid #0b5fff' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 20px rgba(11, 95, 255, 0.18)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icono nombre="areas" size={22} color={isSelected ? '#38bdf8' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{pi.nombre}</div>
                  <div style={{ fontSize: '13px', color: isSelected ? '#38bdf8' : '#94a3b8', marginTop: '2px' }}>
                    {pi.salas.length} {pi.salas.length === 1 ? 'sector' : 'sectores / salas'}
                  </div>
                </div>
                {isSelected ? (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0b5fff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 8px rgba(11, 95, 255, 0.4)',
                    }}
                  >
                    <Icono nombre="check" size={15} color="#ffffff" />
                  </div>
                ) : (
                  <Icono nombre="chevronDerecha" size={18} color="#64748b" />
                )}
              </button>
            );
          })}

        {/* PASO 3: SALAS */}
        {pasoSelector === 3 &&
          salasDisponibles.map((sa) => {
            const isSelected = salaSel?.id === sa.id;
            return (
              <button
                key={sa.id}
                type="button"
                onClick={() => {
                  setSalaSel(sa);
                  setCamaSel(sa.camas[0] || 'Cama 01');
                  setPasoSelector(4);
                }}
                style={{
                  background: isSelected ? 'rgba(11, 95, 255, 0.12)' : '#0f172a',
                  border: isSelected ? '1.5px solid #0b5fff' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  color: '#ffffff',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 20px rgba(11, 95, 255, 0.18)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    background: isSelected ? 'rgba(11, 95, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icono nombre="cama" size={22} color={isSelected ? '#38bdf8' : '#64748b'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#ffffff' }}>{sa.nombre}</div>
                  <div style={{ fontSize: '13px', color: isSelected ? '#38bdf8' : '#94a3b8', marginTop: '2px' }}>
                    {sa.camas.length} {sa.camas.length === 1 ? 'cama activa' : 'camas activas'}
                  </div>
                </div>
                {isSelected ? (
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: '#0b5fff',
                      display: 'grid',
                      placeItems: 'center',
                      boxShadow: '0 2px 8px rgba(11, 95, 255, 0.4)',
                    }}
                  >
                    <Icono nombre="check" size={15} color="#ffffff" />
                  </div>
                ) : (
                  <Icono nombre="chevronDerecha" size={18} color="#64748b" />
                )}
              </button>
            );
          })}

        {/* PASO 4: CAMAS */}
        {pasoSelector === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {camasDisponibles.map((ca) => {
              const isSelected = camaSel === ca;
              return (
                <button
                  key={ca}
                  type="button"
                  onClick={() => {
                    setCamaSel(ca);
                    onFinalizar(ca);
                  }}
                  style={{
                    background: isSelected ? '#0b5fff' : '#0f172a',
                    border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '18px 12px',
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '15px',
                    boxShadow: isSelected ? '0 6px 20px rgba(11, 95, 255, 0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icono nombre="cama" size={26} color={isSelected ? '#ffffff' : '#64748b'} />
                  <span>{ca}</span>
                  {isSelected && (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icono nombre="check" size={12} color="#0b5fff" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Botón de Regreso */}
      {pasoSelector > 1 && (
        <button
          type="button"
          onClick={() => setPasoSelector((p) => Math.max(1, p - 1))}
          style={{
            marginTop: '16px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '13px',
            color: '#cbd5e1',
            fontSize: '13.5px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Icono nombre="chevronIzquierda" size={16} color="#cbd5e1" />
          <span>Volver al paso anterior</span>
        </button>
      )}
    </div>
  );
}
