/* =========================================================
 *  Motor de gráficos SVG (sin librerías).
 *  Soporta: líneas, barras, barras apiladas, torta.
 *  Todo bajo App.charts.
 * ========================================================= */

(function () {
  const App = window.App = window.App || {};

  const paletaBase = ['#0B5FFF', '#0EA5E9', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#F43F5E', '#14B8A6', '#6366F1', '#84CC16'];

  // Convierte un div contenedor a SVG con las dimensiones actuales.
  function preparar(host) {
    host.innerHTML = '';
    const rect = host.getBoundingClientRect();
    const w = Math.max(280, Math.floor(rect.width || host.clientWidth || 500));
    const h = Math.max(180, Math.floor(rect.height || host.clientHeight || 240));
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';
    host.appendChild(svg);
    return { svg, w, h };
  }

  function el(tag, attrs, contenido) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    if (contenido != null) e.textContent = contenido;
    return e;
  }

  // Tooltip flotante compartido
  let tip;
  function tooltip(host, txt, x, y) {
    if (!tip) {
      tip = document.createElement('div');
      tip.style.cssText = `
        position: fixed; pointer-events:none; z-index: 300;
        background: #0b1220; color: #fff; padding: 6px 10px;
        border-radius: 8px; font-size: 12px; box-shadow: 0 10px 24px rgba(0,0,0,.25);
        transform: translate(-50%, calc(-100% - 10px)); white-space: nowrap;
        opacity: 0; transition: opacity 120ms;`;
      document.body.appendChild(tip);
    }
    if (!txt) {
      tip.style.opacity = '0';
      return;
    }
    tip.innerHTML = txt;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.style.opacity = '1';
  }

  /* ---------- Gráfico de líneas ---------- */
  // series: [{ nombre, color, valores:[n,n,...] }]
  // labelsX: [str, str, ...]
  function lineas(host, { series, labelsX, sufijo = '' }) {
    const { svg, w, h } = preparar(host);
    const padL = 44, padR = 20, padT = 20, padB = 34;
    const gw = w - padL - padR;
    const gh = h - padT - padB;
    const nCols = labelsX.length;
    const stepX = gw / Math.max(1, nCols - 1);

    let max = 0;
    series.forEach(s => s.valores.forEach(v => { if (v > max) max = v; }));
    max = niceMax(max);

    // Grid horizontal
    const lineas = 4;
    for (let i = 0; i <= lineas; i++) {
      const y = padT + (gh * i / lineas);
      svg.appendChild(el('line', { x1: padL, x2: w - padR, y1: y, y2: y, stroke: 'var(--borde)', 'stroke-dasharray':'3 4' }));
      const val = Math.round(max - (max * i / lineas));
      svg.appendChild(el('text', { x: padL - 8, y: y + 4, 'text-anchor':'end', 'font-size':'11', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, val));
    }

    // Labels X
    labelsX.forEach((lx, i) => {
      // omitir algunos si son muchos
      if (nCols > 12 && i % Math.ceil(nCols / 8) !== 0 && i !== nCols - 1) return;
      const x = padL + stepX * i;
      svg.appendChild(el('text', { x, y: h - padB + 18, 'text-anchor':'middle', 'font-size':'11', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, lx));
    });

    // Series
    series.forEach((s, idx) => {
      const color = s.color || paletaBase[idx % paletaBase.length];
      // path
      let d = '';
      const pts = s.valores.map((v, i) => {
        const x = padL + stepX * i;
        const y = padT + gh - (v / max) * gh;
        return [x, y];
      });
      pts.forEach((p, i) => d += (i === 0 ? 'M' : 'L') + p[0] + ',' + p[1] + ' ');
      // área suave
      const dArea = d + `L${pts[pts.length-1][0]},${padT + gh} L${pts[0][0]},${padT + gh} Z`;
      svg.appendChild(el('path', { d: dArea, fill: color, 'fill-opacity':'0.08' }));
      svg.appendChild(el('path', { d, fill: 'none', stroke: color, 'stroke-width': '2.4', 'stroke-linecap':'round', 'stroke-linejoin':'round' }));
      // puntos
      pts.forEach((p, i) => {
        const c = el('circle', { cx: p[0], cy: p[1], r: 3.5, fill: '#fff', stroke: color, 'stroke-width': '2' });
        c.style.cursor = 'pointer';
        c.addEventListener('mouseenter', (ev) => tooltip(host, `<strong>${labelsX[i]}</strong> — ${s.nombre}: ${s.valores[i]}${sufijo}`, ev.clientX, ev.clientY));
        c.addEventListener('mouseleave', () => tooltip(host, ''));
        svg.appendChild(c);
      });
    });

    leyenda(host, series);
  }

  /* ---------- Gráfico de barras (verticales u horizontales) ---------- */
  // datos: [{ label, valor, color }]
  function barras(host, { datos, orientacion = 'vertical', sufijo = '' }) {
    const { svg, w, h } = preparar(host);
    if (orientacion === 'horizontal') {
      const padL = 120, padR = 20, padT = 10, padB = 20;
      const gw = w - padL - padR;
      const gh = h - padT - padB;
      const barH = Math.min(30, (gh - datos.length * 8) / datos.length);
      const max = niceMax(Math.max(...datos.map(d => d.valor)));
      datos.forEach((d, i) => {
        const y = padT + i * (barH + 8);
        // label
        svg.appendChild(el('text', { x: padL - 10, y: y + barH / 2 + 4, 'text-anchor':'end', 'font-size':'12', fill:'var(--texto-suave)', 'font-family':'Inter,Arial' }, d.label));
        // fondo
        svg.appendChild(el('rect', { x: padL, y, width: gw, height: barH, rx: 6, fill:'var(--superficie-2)' }));
        // barra
        const wBar = (d.valor / max) * gw;
        const r = el('rect', { x: padL, y, width: wBar, height: barH, rx: 6, fill: d.color || paletaBase[i % paletaBase.length] });
        r.addEventListener('mouseenter', (ev) => tooltip(host, `<strong>${d.label}</strong>: ${d.valor}${sufijo}`, ev.clientX, ev.clientY));
        r.addEventListener('mouseleave', () => tooltip(host, ''));
        svg.appendChild(r);
        // valor
        svg.appendChild(el('text', { x: padL + wBar - 8, y: y + barH / 2 + 4, 'text-anchor':'end', 'font-size':'11', fill:'#fff', 'font-family':'Inter,Arial', 'font-weight':'700' }, d.valor));
      });
    } else {
      const padL = 40, padR = 20, padT = 20, padB = 30;
      const gw = w - padL - padR;
      const gh = h - padT - padB;
      const barW = Math.min(48, (gw - (datos.length - 1) * 12) / datos.length);
      const max = niceMax(Math.max(...datos.map(d => d.valor)));
      // Grid
      for (let i = 0; i <= 4; i++) {
        const y = padT + gh * i / 4;
        svg.appendChild(el('line', { x1: padL, x2: w - padR, y1: y, y2: y, stroke: 'var(--borde)', 'stroke-dasharray':'3 4' }));
        svg.appendChild(el('text', { x: padL - 6, y: y + 4, 'text-anchor':'end', 'font-size':'10', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, Math.round(max - max * i / 4)));
      }
      datos.forEach((d, i) => {
        const x = padL + i * (barW + 12);
        const hBar = (d.valor / max) * gh;
        const y = padT + gh - hBar;
        const r = el('rect', { x, y, width: barW, height: hBar, rx: 6, fill: d.color || paletaBase[i % paletaBase.length] });
        r.addEventListener('mouseenter', (ev) => tooltip(host, `<strong>${d.label}</strong>: ${d.valor}${sufijo}`, ev.clientX, ev.clientY));
        r.addEventListener('mouseleave', () => tooltip(host, ''));
        svg.appendChild(r);
        svg.appendChild(el('text', { x: x + barW / 2, y: h - padB + 16, 'text-anchor':'middle', 'font-size':'11', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, d.label));
      });
    }
  }

  /* ---------- Barras apiladas ---------- */
  // categorias: [str]  (eje X)
  // series: [{ nombre, color, valores: [n por categoria] }]
  function barrasApiladas(host, { categorias, series }) {
    const { svg, w, h } = preparar(host);
    const padL = 40, padR = 20, padT = 20, padB = 30;
    const gw = w - padL - padR;
    const gh = h - padT - padB;
    const totales = categorias.map((_, i) => series.reduce((acc, s) => acc + (s.valores[i] || 0), 0));
    const max = niceMax(Math.max(...totales));
    const barW = Math.min(48, (gw - (categorias.length - 1) * 12) / categorias.length);
    for (let i = 0; i <= 4; i++) {
      const y = padT + gh * i / 4;
      svg.appendChild(el('line', { x1: padL, x2: w - padR, y1: y, y2: y, stroke: 'var(--borde)', 'stroke-dasharray':'3 4' }));
      svg.appendChild(el('text', { x: padL - 6, y: y + 4, 'text-anchor':'end', 'font-size':'10', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, Math.round(max - max * i / 4)));
    }
    categorias.forEach((cat, i) => {
      const x = padL + i * (barW + 12);
      let acumY = padT + gh;
      series.forEach((s, idx) => {
        const v = s.valores[i] || 0;
        const hBar = (v / max) * gh;
        acumY -= hBar;
        if (v > 0) {
          const color = s.color || paletaBase[idx % paletaBase.length];
          const r = el('rect', { x, y: acumY, width: barW, height: hBar, fill: color });
          if (idx === 0) r.setAttribute('rx', 6);
          r.addEventListener('mouseenter', (ev) => tooltip(host, `<strong>${cat}</strong> — ${s.nombre}: ${v}`, ev.clientX, ev.clientY));
          r.addEventListener('mouseleave', () => tooltip(host, ''));
          svg.appendChild(r);
        }
      });
      svg.appendChild(el('text', { x: x + barW / 2, y: h - padB + 16, 'text-anchor':'middle', 'font-size':'11', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, cat));
    });
    leyenda(host, series);
  }

  /* ---------- Gráfico de torta ---------- */
  // datos: [{ label, valor, color }]
  function torta(host, { datos }) {
    const { svg, w, h } = preparar(host);
    const cx = w / 2, cy = h / 2 - 6;
    const r = Math.min(w, h) / 2 - 22;
    const rInterior = r * 0.55;
    const total = datos.reduce((a, d) => a + d.valor, 0);
    let angulo = -Math.PI / 2;
    datos.forEach((d, i) => {
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
      const color = d.color || paletaBase[i % paletaBase.length];
      const path = el('path', {
        d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${rInterior} ${rInterior} 0 ${large} 0 ${xi2} ${yi2} Z`,
        fill: color,
        stroke: 'var(--superficie)',
        'stroke-width': 2,
      });
      path.style.cursor = 'pointer';
      path.style.transition = 'transform 160ms ease';
      path.addEventListener('mouseenter', (ev) => {
        const pct = Math.round(frac * 100);
        tooltip(host, `<strong>${d.label}</strong>: ${d.valor} (${pct}%)`, ev.clientX, ev.clientY);
        path.style.transform = 'scale(1.02)';
        path.style.transformOrigin = `${cx}px ${cy}px`;
      });
      path.addEventListener('mouseleave', () => {
        tooltip(host, '');
        path.style.transform = 'none';
      });
      svg.appendChild(path);
      angulo = nuevo;
    });
    // Texto en el centro
    svg.appendChild(el('text', { x: cx, y: cy - 4, 'text-anchor':'middle', 'font-size':'26', 'font-weight':'700', fill:'var(--texto)', 'font-family':'Inter,Arial' }, total));
    svg.appendChild(el('text', { x: cx, y: cy + 16, 'text-anchor':'middle', 'font-size':'11', fill:'var(--texto-tenue)', 'font-family':'Inter,Arial' }, 'total'));
    leyenda(host, datos.map((d, i) => ({ nombre: d.label, color: d.color || paletaBase[i % paletaBase.length] })));
  }

  /* ---------- Leyenda (debajo del gráfico) ---------- */
  function leyenda(host, series) {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:center;margin-top:8px;font-size:12px;color:var(--texto-suave)';
    series.forEach((s, i) => {
      const item = document.createElement('span');
      const color = s.color || paletaBase[i % paletaBase.length];
      item.style.cssText = 'display:inline-flex;align-items:center;gap:6px';
      item.innerHTML = `<span style="width:10px;height:10px;border-radius:2px;background:${color}"></span>${s.nombre}`;
      div.appendChild(item);
    });
    host.appendChild(div);
  }

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

  App.charts = { lineas, barras, barrasApiladas, torta, paletaBase };
})();
