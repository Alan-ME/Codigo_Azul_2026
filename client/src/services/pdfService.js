// ─────────────────────────────────────────────────────────────
// client/src/services/pdfService.js
// Servicio de generación y exportación oficial de reportes PDF.
// Utiliza carga dinámica (dynamic import) de jsPDF para optimizar el bundle.
// ─────────────────────────────────────────────────────────────

const MARGEN_MM = 12;
const ALTO_FILA_MM = 6;
const AZUL_INSTITUCIONAL = [11, 95, 255];
const GRIS_TEXTO = [30, 41, 59];
const GRIS_SUAVE = [100, 116, 139];
const GRIS_BORDE = [226, 232, 240];
const GRIS_CABECERA = [241, 245, 249];
const GRIS_ZEBRA = [249, 250, 251];
const GRIS_PIE = [148, 163, 184];

function truncar(doc, texto, anchoMm) {
  const s = String(texto ?? '');
  if (doc.getTextWidth(s) <= anchoMm) return s;
  let t = s;
  while (t.length > 1 && doc.getTextWidth(t + '…') > anchoMm) t = t.slice(0, -1);
  return t + '…';
}

function anchoTabla(columnas) {
  return columnas.reduce((s, c) => s + c.w, 0);
}

function dibujarCabeceraTabla(doc, columnas, x, y) {
  doc.setFillColor(...GRIS_CABECERA);
  doc.setDrawColor(...GRIS_BORDE);
  doc.rect(x, y, anchoTabla(columnas), 7, 'FD');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  let cx = x;
  for (const col of columnas) {
    const align = col.align || 'left';
    const tx = align === 'right' ? cx + col.w - 2 : cx + 2;
    doc.text(col.label, tx, y + 5, { align });
    cx += col.w;
  }
  return y + 7;
}

function dibujarEncabezado(doc, titulo, filtros, anchoPag, y) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...AZUL_INSTITUCIONAL);
  doc.text(titulo, MARGEN_MM, y + 2);
  doc.setDrawColor(...AZUL_INSTITUCIONAL);
  doc.setLineWidth(0.6);
  doc.line(MARGEN_MM, y + 5, anchoPag - MARGEN_MM, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRIS_SUAVE);
  doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`, MARGEN_MM, y + 10);
  if (filtros) doc.text(`Filtros: ${filtros}`, MARGEN_MM, y + 14);
  return y + (filtros ? 20 : 16);
}

function dibujarKpis(doc, kpis, anchoPag, y) {
  if (!kpis || !kpis.length) return y;
  const anchoTotal = anchoPag - MARGEN_MM * 2;
  const gap = 4;
  const anchoKpi = (anchoTotal - gap * (kpis.length - 1)) / kpis.length;
  kpis.forEach((k, i) => {
    const kx = MARGEN_MM + i * (anchoKpi + gap);
    doc.setDrawColor(...GRIS_BORDE);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(kx, y, anchoKpi, 16, 2, 2, 'FD');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_SUAVE);
    doc.text(String(k.t).toUpperCase(), kx + 3, y + 5);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(String(k.v), kx + 3, y + 12);
    doc.setFont('helvetica', 'normal');
  });
  return y + 22;
}

function dibujarFilas(doc, columnas, filas, altoPag, y) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTO);
  const ancho = anchoTabla(columnas);

  for (let i = 0; i < filas.length; i++) {
    if (y + ALTO_FILA_MM > altoPag - MARGEN_MM - 6) {
      doc.addPage();
      y = MARGEN_MM;
      y = dibujarCabeceraTabla(doc, columnas, MARGEN_MM, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...GRIS_TEXTO);
    }

    if (i % 2 === 1) {
      doc.setFillColor(...GRIS_ZEBRA);
      doc.rect(MARGEN_MM, y, ancho, ALTO_FILA_MM, 'F');
    }

    let cx = MARGEN_MM;
    for (const col of columnas) {
      const valor = truncar(doc, filas[i][col.key], col.w - 4);
      const align = col.align || 'left';
      const tx = align === 'right' ? cx + col.w - 2 : cx + 2;
      doc.text(valor, tx, y + 4, { align });
      cx += col.w;
    }
    doc.setDrawColor(...GRIS_BORDE);
    doc.setLineWidth(0.1);
    doc.line(MARGEN_MM, y + ALTO_FILA_MM, MARGEN_MM + ancho, y + ALTO_FILA_MM);
    y += ALTO_FILA_MM;
  }
  return y;
}

function dibujarPies(doc, anchoPag, altoPag) {
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_PIE);
    doc.text('Sistema Código Azul · Uso interno hospitalario', anchoPag / 2, altoPag - 6, { align: 'center' });
    doc.text(`Página ${p} de ${total}`, anchoPag - MARGEN_MM, altoPag - 6, { align: 'right' });
  }
}

/**
 * Genera y dispara la descarga de un PDF oficial institucional con carga diferida.
 */
export async function descargarTablaPDF({ titulo, nombreArchivo = 'reporte.pdf', filtros, kpis, columnas, filas }) {
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const anchoPag = doc.internal.pageSize.getWidth();
    const altoPag = doc.internal.pageSize.getHeight();

    let y = MARGEN_MM;
    y = dibujarEncabezado(doc, titulo, filtros, anchoPag, y);
    y = dibujarKpis(doc, kpis, anchoPag, y);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 65, 85);
    doc.text(`${filas.length} registro${filas.length === 1 ? '' : 's'}`, MARGEN_MM, y);
    y += 4;

    y = dibujarCabeceraTabla(doc, columnas, MARGEN_MM, y);
    y = dibujarFilas(doc, columnas, filas, altoPag, y);
    dibujarPies(doc, anchoPag, altoPag);

    doc.save(nombreArchivo);
    return true;
  } catch (error) {
    console.error('[PDF] Error al generar documento:', error);
    return false;
  }
}

export default {
  descargarTablaPDF,
};
