import { Injectable, NotFoundException } from '@nestjs/common';
import { PagoEntity } from './pago.entity';
import { CreatePagoDto } from './dto/create-pago.dto';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PagosService {
  private pagos: PagoEntity[] = [
    {
      id: '1718210344000',
      clienteId: 'C1',
      cuentaBancariaId: 'CB001',
      montoTotal: 150.0,
      fecha: new Date().toISOString(),
      detalles: [
        { facturaId: 'F001', montoAbonado: 50.0 },
        { facturaId: 'F002', montoAbonado: 100.0 },
      ],
    },
  ];

  private facturas = [
    { id: 'F001', clienteId: 'C1', total: 100, pendiente: 100 },
    { id: 'F002', clienteId: 'C1', total: 250, pendiente: 250 },
  ];

  registrarCobro(pago: CreatePagoDto) {
    const nuevoPago: PagoEntity = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      ...pago,
    };

    const facturasAfectadas: any[] = [];

    for (const detalle of nuevoPago.detalles) {
      const factura = this.facturas.find((f) => f.id === detalle.facturaId);
      if (!factura) {
        throw new NotFoundException(
          `Factura con ID ${detalle.facturaId} no encontrada`,
        );
      }

      factura.pendiente -= detalle.montoAbonado;
      facturasAfectadas.push({ ...factura });
    }

    this.pagos.push(nuevoPago);

    return {
      mensaje: 'Cobro registrado exitosamente y facturas actualizadas',
      pago: nuevoPago,
      facturasAfectadas,
    };
  }

  obtenerFacturas() {
    return this.facturas;
  }

  obtenerEstadoCuenta(clienteId: string) {
    return this.facturas.filter((factura) => factura.clienteId === clienteId);
  }
  obtenerClientesConDeuda() {
    const resumen: Record<string, number> = {};

    this.facturas.forEach((factura) => {
      if (factura.pendiente > 0) {
        if (!resumen[factura.clienteId]) {
          resumen[factura.clienteId] = 0;
        }

        resumen[factura.clienteId] += factura.pendiente;
      }
    });

    return Object.keys(resumen).map((clienteId) => ({
      clienteId,
      saldoPendiente: resumen[clienteId],
    }));
  }
  generarReciboPdf(id: string): Promise<Buffer> {
    const pago = this.pagos.find((p) => p.id === id);
    if (!pago) {
      throw new NotFoundException(`Pago con ID ${id} no encontrado`);
    }

    return new Promise((resolve, reject) => {
      try {
        // En algunos entornos de TS, al importar con namespace * as PDFDocument,
        // la clase constructible puede requerir acceder a la propiedad default o tratarse directamente.
        const DocConstructor = (PDFDocument.default || PDFDocument) as any;
        const doc = new DocConstructor({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: any) => reject(err));

        // Diseño del PDF
        doc.fontSize(20).text('COMPROBANTE DE COBRO', { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`ID de Pago: ${pago.id}`);
        doc.text(`Fecha: ${pago.fecha}`);
        doc.text(`ID Cliente: ${pago.clienteId}`);
        doc.text(`ID Cuenta Bancaria: ${pago.cuentaBancariaId}`);
        doc.text(`Monto Total: $${pago.montoTotal.toFixed(2)}`);
        doc.moveDown();

        doc.fontSize(14).text('Detalles del Pago', { underline: true });
        doc.moveDown(0.5);

        pago.detalles.forEach((det, idx) => {
          doc
            .fontSize(12)
            .text(
              `${idx + 1}. Factura: ${det.facturaId} - Monto Abonado: $${det.montoAbonado.toFixed(2)}`,
            );
        });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  obtenerReporte(fechaInicio?: string, fechaFin?: string): PagoEntity[] {
    if (!fechaInicio && !fechaFin) {
      return this.pagos;
    }

    return this.pagos.filter((pago) => {
      const pagoDate = new Date(pago.fecha);

      if (fechaInicio && fechaFin) {
        const inicioDate = new Date(fechaInicio);
        const finDate = new Date(fechaFin);
        return pagoDate >= inicioDate && pagoDate <= finDate;
      }

      if (fechaInicio) {
        const inicioDate = new Date(fechaInicio);
        return pagoDate >= inicioDate;
      }

      if (fechaFin) {
        const finDate = new Date(fechaFin);
        return pagoDate <= finDate;
      }

      return true;
    });
  }
}
