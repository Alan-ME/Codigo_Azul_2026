// ─────────────────────────────────────────────────────────────
// codigo-azul-web/src/components/common/Charts.jsx
// Motor de gráficos SVG nativos React (sin dependencias externas).
// Idéntico a public/js/helpers/charts.js: Líneas, Barras, Barras Apiladas, Torta.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

export const paletaBase = ['#0B5FFF', '#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F43F5E', '#14B8A6', '#6366F1', '#84CC16'];

function niceMax(v) {
  if (v <= 0) return 5;
  const pot = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / pot;
  let mul;
  if (norm <= 1) mul = 1;
  else if (norm <= 2) mul = 2;
  else if (norm <= 5) mul = 5;
  else mul = 10;
  return mul * pot;
}

function useDimensions(ref) {
  const [dims, setDims] = useState({ w: 500, h: 240 });
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({
          w: Math.max(280, Math.floor(width || 500)),
          h: Math.max(160, Math.floor(height || 240)),
        });
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return dims;
}

/* ─── Tooltip Flotante ────────────────────────────────────────── */
function Tooltip({ info }) {
  if (!info) return null;
  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 300,
        background: '#0b1220',
        color: '#fff',
        padding: '6px 10px',
        borderRadius: '8px',
        fontSize: '12px',
        boxShadow: '0 10px 24px rgba(0,0,0,.25)',
        transform: 'translate(-50%, calc(-100% - 10px))',
        whiteSpace: 'nowrap',
        left: `${info.x}px`,
        top: `${info.y}px`,
        opacity: 1,
        transition: 'opacity 120ms',
      }}
      dangerouslySetInnerHTML={{ __html: info.html }}
    />
  );
}

/* ─── Leyenda ─────────────────────────────────────────────────── */
function Leyenda({ series }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 16px',
        justifyContent: 'center',
        marginTop: '8px',
        fontSize: '12px',
        color: 'var(--texto-suave)',
      }}
    >
      {series.map((s, i) => {
        const color = s.color || paletaBase[i % paletaBase.length];
        return (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: color }} />
            {s.nombre || s.label}
          </span>
        );
      })}
    </div>
  );
}

/* ─── Gráfico de Líneas ───────────────────────────────────────── */
export function LineChart({ series = [], labelsX = [], sufijo = '', className = '', style }) {
  const containerRef = useRef(null);
  const { w, h } = useDimensions(containerRef);
  const [tooltip, setTooltip] = useState(null);

  const padL = 44;
  const padR = 20;
  const padT = 20;
  const padB = 34;
  const gw = w - padL - padR;
  const gh = h - padT - padB;
  const nCols = labelsX.length;
  const stepX = gw / Math.max(1, nCols - 1);

  let rawMax = 0;
  series.forEach(s => s.valores.forEach(v => { if (v > rawMax) rawMax = v; }));
  const max = niceMax(rawMax);

  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className={`chart-holder ${className}`} ref={containerRef} style={style}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
        {/* Grid horizontal */}
        {gridLines.map(i => {
          const y = padT + (gh * i) / 4;
          const val = Math.round(max - (max * i) / 4);
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--borde)" strokeDasharray="3 4" />
              <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
                {val}
              </text>
            </g>
          );
        })}

        {/* Labels X */}
        {labelsX.map((lx, i) => {
          if (nCols > 12 && i % Math.ceil(nCols / 8) !== 0 && i !== nCols - 1) return null;
          const x = padL + stepX * i;
          return (
            <text key={i} x={x} y={h - padB + 18} textAnchor="middle" fontSize="11" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
              {lx}
            </text>
          );
        })}

        {/* Series */}
        {series.map((s, idx) => {
          const color = s.color || paletaBase[idx % paletaBase.length];
          const pts = s.valores.map((v, i) => [padL + stepX * i, padT + gh - (v / max) * gh]);
          let d = '';
          pts.forEach((p, i) => {
            d += (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1] + ' ';
          });
          const dArea = d + `L${pts[pts.length - 1][0]},${padT + gh} L${pts[0][0]},${padT + gh} Z`;

          return (
            <g key={idx}>
              <path d={dArea} fill={color} fillOpacity="0.08" />
              <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={3.5}
                  fill="#fff"
                  stroke={color}
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={ev =>
                    setTooltip({
                      x: ev.clientX,
                      y: ev.clientY,
                      html: `<strong>${labelsX[i]}</strong> — ${s.nombre}: ${s.valores[i]}${sufijo}`,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </g>
          );
        })}
      </svg>
      <Tooltip info={tooltip} />
      <Leyenda series={series} />
    </div>
  );
}

/* ─── Gráfico de Barras ───────────────────────────────────────── */
export function BarChart({ datos = [], orientacion = 'vertical', sufijo = '', className = '', style }) {
  const containerRef = useRef(null);
  const { w, h } = useDimensions(containerRef);
  const [tooltip, setTooltip] = useState(null);

  if (orientacion === 'horizontal') {
    const padL = 120;
    const padR = 20;
    const padT = 10;
    const padB = 20;
    const gw = w - padL - padR;
    const gh = h - padT - padB;
    const barH = Math.min(30, (gh - datos.length * 8) / Math.max(1, datos.length));
    const max = niceMax(Math.max(...datos.map(d => d.valor), 1));

    return (
      <div className={`chart-holder ${className}`} ref={containerRef} style={style}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
          {datos.map((d, i) => {
            const y = padT + i * (barH + 8);
            const wBar = (d.valor / max) * gw;
            const color = d.color || paletaBase[i % paletaBase.length];
            return (
              <g key={i}>
                <text x={padL - 10} y={y + barH / 2 + 4} textAnchor="end" fontSize="12" fill="var(--texto-suave)" fontFamily="Inter,Arial">
                  {d.label}
                </text>
                <rect x={padL} y={y} width={gw} height={barH} rx={6} fill="var(--superficie-2)" />
                <rect
                  x={padL}
                  y={y}
                  width={wBar}
                  height={barH}
                  rx={6}
                  fill={color}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={ev => setTooltip({ x: ev.clientX, y: ev.clientY, html: `<strong>${d.label}</strong>: ${d.valor}${sufijo}` })}
                  onMouseLeave={() => setTooltip(null)}
                />
                <text x={padL + wBar - 8} y={y + barH / 2 + 4} textAnchor="end" fontSize="11" fill="#fff" fontFamily="Inter,Arial" fontWeight="700">
                  {d.valor}
                </text>
              </g>
            );
          })}
        </svg>
        <Tooltip info={tooltip} />
      </div>
    );
  }

  // Vertical
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const gw = w - padL - padR;
  const gh = h - padT - padB;
  const barW = Math.min(48, (gw - (datos.length - 1) * 12) / Math.max(1, datos.length));
  const max = niceMax(Math.max(...datos.map(d => d.valor), 1));
  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className={`chart-holder ${className}`} ref={containerRef} style={style}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
        {gridLines.map(i => {
          const y = padT + (gh * i) / 4;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--borde)" strokeDasharray="3 4" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
                {Math.round(max - (max * i) / 4)}
              </text>
            </g>
          );
        })}
        {datos.map((d, i) => {
          const x = padL + i * (barW + 12);
          const hBar = (d.valor / max) * gh;
          const y = padT + gh - hBar;
          const color = d.color || paletaBase[i % paletaBase.length];
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={hBar}
                rx={6}
                fill={color}
                style={{ cursor: 'pointer' }}
                onMouseEnter={ev => setTooltip({ x: ev.clientX, y: ev.clientY, html: `<strong>${d.label}</strong>: ${d.valor}${sufijo}` })}
                onMouseLeave={() => setTooltip(null)}
              />
              <text x={x + barW / 2} y={h - padB + 16} textAnchor="middle" fontSize="11" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip info={tooltip} />
    </div>
  );
}

/* ─── Gráfico de Barras Apiladas ──────────────────────────────── */
export function StackedBarChart({ categorias = [], series = [], className = '', style }) {
  const containerRef = useRef(null);
  const { w, h } = useDimensions(containerRef);
  const [tooltip, setTooltip] = useState(null);

  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const gw = w - padL - padR;
  const gh = h - padT - padB;
  const totales = categorias.map((_, i) => series.reduce((acc, s) => acc + (s.valores[i] || 0), 0));
  const max = niceMax(Math.max(...totales, 1));
  const barW = Math.min(48, (gw - (categorias.length - 1) * 12) / Math.max(1, categorias.length));
  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className={`chart-holder ${className}`} ref={containerRef} style={style}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
        {gridLines.map(i => {
          const y = padT + (gh * i) / 4;
          return (
            <g key={i}>
              <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="var(--borde)" strokeDasharray="3 4" />
              <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
                {Math.round(max - (max * i) / 4)}
              </text>
            </g>
          );
        })}
        {categorias.map((cat, i) => {
          const x = padL + i * (barW + 12);
          let acumY = padT + gh;
          return (
            <g key={i}>
              {series.map((s, idx) => {
                const v = s.valores[i] || 0;
                const hBar = (v / max) * gh;
                acumY -= hBar;
                if (v <= 0) return null;
                const color = s.color || paletaBase[idx % paletaBase.length];
                return (
                  <rect
                    key={idx}
                    x={x}
                    y={acumY}
                    width={barW}
                    height={hBar}
                    rx={idx === 0 ? 6 : 0}
                    fill={color}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={ev => setTooltip({ x: ev.clientX, y: ev.clientY, html: `<strong>${cat}</strong> — ${s.nombre}: ${v}` })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                );
              })}
              <text x={x + barW / 2} y={h - padB + 16} textAnchor="middle" fontSize="11" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
                {cat}
              </text>
            </g>
          );
        })}
      </svg>
      <Tooltip info={tooltip} />
      <Leyenda series={series} />
    </div>
  );
}

/* ─── Gráfico de Torta ────────────────────────────────────────── */
export function PieChart({ datos = [], className = '', style }) {
  const containerRef = useRef(null);
  const { w, h } = useDimensions(containerRef);
  const [tooltip, setTooltip] = useState(null);

  const cx = w / 2;
  const cy = h / 2 - 6;
  const r = Math.min(w, h) / 2 - 22;
  const rInterior = r * 0.55;
  const total = datos.reduce((a, d) => a + d.valor, 0) || 1;

  let angulo = -Math.PI / 2;

  const slices = datos.map((d, i) => {
    const frac = d.valor / total;
    const nuevo = angulo + frac * Math.PI * 2;
    const large = frac > 0.5 ? 1 : 0;
    const x1 = cx + Math.cos(angulo) * r;
    const y1 = cy + Math.sin(angulo) * r;
    const x2 = cx + Math.cos(nuevo) * r;
    const y2 = cy + Math.sin(nuevo) * r;
    const xi1 = cx + Math.cos(nuevo) * rInterior;
    const yi1 = cy + Math.sin(nuevo) * rInterior;
    const xi2 = cx + Math.cos(angulo) * rInterior;
    const yi2 = cy + Math.sin(angulo) * rInterior;
    const pathD = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${rInterior} ${rInterior} 0 ${large} 0 ${xi2} ${yi2} Z`;
    const color = d.color || paletaBase[i % paletaBase.length];
    angulo = nuevo;
    return { ...d, pathD, color, frac };
  });

  return (
    <div className={`chart-holder ${className}`} ref={containerRef} style={style}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: 'block' }}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={s.pathD}
            fill={s.color}
            stroke="var(--superficie)"
            strokeWidth={2}
            style={{ cursor: 'pointer', transition: 'transform 160ms ease' }}
            onMouseEnter={ev => {
              const pct = Math.round(s.frac * 100);
              setTooltip({ x: ev.clientX, y: ev.clientY, html: `<strong>${s.label}</strong>: ${s.valor} (${pct}%)` });
            }}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
        {/* Total al centro */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--texto)" fontFamily="Inter,Arial">
          {total}
        </text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="var(--texto-tenue)" fontFamily="Inter,Arial">
          total
        </text>
      </svg>
      <Tooltip info={tooltip} />
      <Leyenda series={datos.map((d, i) => ({ nombre: d.label, color: d.color || paletaBase[i % paletaBase.length] }))} />
    </div>
  );
}

export default {
  LineChart,
  BarChart,
  StackedBarChart,
  PieChart,
  paletaBase,
};
