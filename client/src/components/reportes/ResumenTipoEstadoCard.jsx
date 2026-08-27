// ─────────────────────────────────────────────────────────────
// client/src/components/reportes/ResumenTipoEstadoCard.jsx
// Tabla resumen de volumen y tasa de atención médica por tipo
// ─────────────────────────────────────────────────────────────

export default function ResumenTipoEstadoCard({ lista }) {
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div className="titulo-card">
        <h3>Resumen por tipo × estado</h3>
      </div>
      <div className="tabla-scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Atendidos</th>
              <th>No atendidos</th>
              <th>Total</th>
              <th>% atención</th>
            </tr>
          </thead>
          <tbody>
            {['normal', 'emergencia', 'codigo-azul'].map((t) => {
              const arr = lista.filter((l) => l.tipo === t);
              const at = arr.filter((l) => l.estado === 'atendido').length;
              const na = arr.filter((l) => l.estado === 'no-atendido').length;
              const nom = t === 'codigo-azul' ? 'Código Azul' : t === 'emergencia' ? 'Emergencia' : 'Normal';
              const pct = arr.length ? Math.round((at / arr.length) * 100) : 0;
              return (
                <tr key={t}>
                  <td>
                    <strong>{nom}</strong>
                  </td>
                  <td>{at}</td>
                  <td>{na}</td>
                  <td>{arr.length}</td>
                  <td>
                    <span
                      className={`badge ${
                        pct >= 80 ? 'b-verde' : pct >= 50 ? 'b-ambar' : 'b-rojo'
                      }`}
                    >
                      {pct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
