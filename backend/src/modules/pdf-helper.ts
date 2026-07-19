import * as PDFDocument from 'pdfkit';

export class PdfHelper {
  static UTN_RED = '#C0392B';
  static TEXT_DARK = '#2D3748';
  static TEXT_MUTED = '#718096';
  static LINE_GRAY = '#E2E8F0';
  static BG_LIGHT = '#F7FAFC';

  /**
   * Inicializa el documento con configuraciones estándar.
   */
  static createDocument(): any {
    const DocConstructor = (PDFDocument.default || PDFDocument) as any;
    return new DocConstructor({
      margin: 50,
      bufferPages: true, // Habilita la numeración dinámica de páginas al final
    });
  }

  /**
   * Dibuja el encabezado decorativo en la página actual.
   */
  static drawHeader(doc: any, docTitle: string) {
    // Barra superior decorativa
    doc.rect(0, 0, 612, 15).fill(this.UTN_RED);

    // Título institucional
    doc.fillColor(this.UTN_RED);
    doc.font('Helvetica-Bold').fontSize(14).text('UNIVERSIDAD TÉCNICA DEL NORTE', 50, 30);
    
    // Subtítulo del sistema
    doc.fillColor(this.TEXT_MUTED);
    doc.font('Helvetica').fontSize(9).text('Sistema de Cuentas por Cobrar', 50, 48);

    // Título del documento (Derecha)
    doc.fillColor(this.TEXT_DARK);
    doc.font('Helvetica-Bold').fontSize(11).text(docTitle.toUpperCase(), 350, 35, { align: 'right', width: 212 });

    // Línea divisoria
    doc.moveTo(50, 65).lineTo(562, 65).strokeColor(this.LINE_GRAY).lineWidth(1).stroke();
    
    // Dejar espacio después del header
    doc.y = 80;
  }

  /**
   * Dibuja los metadatos agrupados en dos columnas.
   */
  static drawMetadata(doc: any, leftItems: Array<{ label: string; value: string }>, rightItems: Array<{ label: string; value: string }>) {
    const startY = doc.y;
    
    // Columna Izquierda
    doc.font('Helvetica-Bold').fontSize(10).fillColor(this.TEXT_DARK);
    let leftY = startY;
    leftItems.forEach(item => {
      doc.text(item.label + ':', 50, leftY);
      doc.font('Helvetica').text(item.value, 150, leftY);
      doc.font('Helvetica-Bold');
      leftY += 16;
    });

    // Columna Derecha
    let rightY = startY;
    rightItems.forEach(item => {
      doc.text(item.label + ':', 320, rightY);
      doc.font('Helvetica').text(item.value, 420, rightY);
      doc.font('Helvetica-Bold');
      rightY += 16;
    });

    doc.y = Math.max(leftY, rightY) + 15;
    doc.moveTo(50, doc.y).lineTo(562, doc.y).strokeColor(this.LINE_GRAY).lineWidth(1).stroke();
    doc.y += 15;
  }

  /**
   * Dibuja la cabecera de una tabla con fondo rojo UTN.
   */
  static drawTableHeader(doc: any, columns: Array<{ label: string; width: number; align?: string }>) {
    const tableY = doc.y;
    
    // Fondo de la cabecera
    doc.rect(50, tableY, 512, 20).fill(this.UTN_RED);
    
    // Texto de las columnas
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(9);
    let currentX = 55;
    
    columns.forEach(col => {
      doc.text(col.label, currentX, tableY + 5, {
        width: col.width,
        align: col.align || 'left'
      });
      currentX += col.width + 10; // 10 de padding
    });

    doc.y = tableY + 25;
  }

  /**
   * Dibuja una fila de la tabla con estilos limpios.
   */
  static drawTableRow(doc: any, values: string[], columns: Array<{ width: number; align?: string }>, isEven: boolean = false) {
    const rowY = doc.y;
    
    // Fondo alternado opcional (Zebra striping)
    if (isEven) {
      doc.rect(50, rowY - 2, 512, 18).fill(this.BG_LIGHT);
    }
    
    doc.fillColor(this.TEXT_DARK).font('Helvetica').fontSize(9);
    let currentX = 55;
    
    values.forEach((val, idx) => {
      const col = columns[idx];
      doc.text(val, currentX, rowY, {
        width: col.width,
        align: col?.align || 'left'
      });
      currentX += col.width + 10;
    });

    // Línea divisoria de fila
    doc.moveTo(50, rowY + 14).lineTo(562, rowY + 14).strokeColor(this.LINE_GRAY).lineWidth(0.5).stroke();
    doc.y = rowY + 18;
  }

  /**
   * Finaliza el documento aplicando la numeración y los pies de página a todas las páginas.
   */
  static finalize(doc: any) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      
      // Desactivar temporalmente el margen inferior para evitar que el pie de página cree páginas adicionales
      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      
      // Dibuja el encabezado de adorno superior en todas las páginas (si aplica)
      if (i > range.start) {
        doc.rect(0, 0, 612, 15).fill(this.UTN_RED);
      }

      // Pie de página
      doc.moveTo(50, 740).lineTo(562, 740).strokeColor(this.LINE_GRAY).lineWidth(1).stroke();
      doc.fillColor(this.TEXT_MUTED).font('Helvetica').fontSize(8);
      doc.text('© Universidad Técnica del Norte — Reporte Oficial de Tesorería', 50, 748);
      doc.text(`Página ${i + 1} de ${range.count}`, 450, 748, { align: 'right', width: 112 });

      // Restaurar el margen original
      doc.page.margins.bottom = oldBottomMargin;
    }
    doc.end();
  }
}
