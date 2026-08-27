// ─────────────────────────────────────────────────────────────
// client/src/components/reportes/RankingEnfermerosTable.jsx
// Ranking de enfermería por volumen de atención y velocidad de respuesta
// ─────────────────────────────────────────────────────────────

export default function RankingEnfermerosTable({ ranking, segundosADuracion }) {
  return (
    <div className="card">
      <div className="titulo-card">
        <h3>Ranking de enfermeros</h3>
      </div>
      <div className="ranking" id="ranking">
        {ranking.length ? (
          ranking.map((r, i) => (
            <div key={r.u.id} className="fila">
              <div className="pos">{i + 1}</div>
              <img className="avatar" src={r.u.avatar} alt="" />
              <div className="nombre">{r.u.nombre}</div>
              <div className="metric">
                <strong>{r.count}</strong> atenciones · {segundosADuracion(r.prom)} prom.
              </div>
            </div>
          ))
        ) : (
          <p className="tenue">Sin datos para los filtros elegidos.</p>
        )}
      </div>
    </div>
  );
}
