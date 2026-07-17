import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PagoExternoDto } from './dto/pago-externo.dto';
import { TransferenciaDto } from './dto/transferencia.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';
@Injectable()
export class MovimientosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  /**
   * Registra un pago externo manual (egreso) validando la cuenta de origen.
   * @param dto Datos del pago externo
   */
  async registrarPagoExterno(dto: PagoExternoDto, token: string, ip: string) {
    // 1. Validar que la cuenta bancaria de origen exista en la base de datos
    const cuentaExiste = await this.prisma.cuentas_bancarias.findUnique({
      where: { id: dto.cuenta_origen_id },
    });

    if (!cuentaExiste) {
      throw new NotFoundException(
        `La cuenta bancaria de origen con ID ${dto.cuenta_origen_id} no existe`,
      );
    }

    // 2. Insertar el registro en la tabla movimientos
    const nuevoMovimiento = await this.prisma.movimientos.create({
      data: {
        tipo: 'egreso',
        cuenta_origen_id: dto.cuenta_origen_id,
        monto: dto.monto,
        descripcion: dto.descripcion,
        estado: 'completado',
      },
    });
    await this.auditoriaService.registrar({
      token,
      idFuncion: 23, // Usa el ID correspondiente a CXC_PAGOSEXTERNOS
      accion: 'CREAR',
      descripcion: 'Registro de pago externo',
      observacion: `Pago externo registrado por $${Number(dto.monto).toFixed(2)} desde la cuenta ${cuentaExiste.codigo}`,
      ip,
    });

    return nuevoMovimiento;
  }

  /**
   * Registra una transferencia interna entre cuentas validando ambas cuentas.
   * @param dto Datos de la transferencia
   */
  async registrarTransferencia(
    dto: TransferenciaDto,
    token: string,
    ip: string,
  ) {
    // 1. Validar que las cuentas de origen y destino sean distintas
    if (dto.cuenta_origen_id === dto.cuenta_destino_id) {
      throw new BadRequestException(
        'La cuenta de origen y la cuenta de destino no pueden ser la misma',
      );
    }

    // 2. Validar que la cuenta de origen exista
    const origenExiste = await this.prisma.cuentas_bancarias.findUnique({
      where: { id: dto.cuenta_origen_id },
    });
    if (!origenExiste) {
      throw new NotFoundException(
        `La cuenta bancaria de origen con ID ${dto.cuenta_origen_id} no existe`,
      );
    }

    // 3. Validar que la cuenta de destino exista
    const destinoExiste = await this.prisma.cuentas_bancarias.findUnique({
      where: { id: dto.cuenta_destino_id },
    });
    if (!destinoExiste) {
      throw new NotFoundException(
        `La cuenta bancaria de destino con ID ${dto.cuenta_destino_id} no existe`,
      );
    }

    // 4. Registrar la transferencia en la base de datos
    const nuevaTransferencia = await this.prisma.movimientos.create({
      data: {
        tipo: 'transferencia',
        cuenta_origen_id: dto.cuenta_origen_id,
        cuenta_destino_id: dto.cuenta_destino_id,
        monto: dto.monto,
        descripcion: dto.descripcion,
        estado: 'completado',
      },
    });
    await this.auditoriaService.registrar({
      token,
      idFuncion: 24, 
      accion: 'CREAR',
      descripcion: 'Registro de transferencia interna',
      observacion: `Transferencia de $${Number(dto.monto).toFixed(2)} desde la cuenta ${origenExiste.codigo} hacia la cuenta ${destinoExiste.codigo}`,
      ip,
    });
    return nuevaTransferencia;
  }

  /**
   * Obtiene el resumen de KPIs consolidado: total de ingresos, total de egresos y saldo.
   */
  async obtenerResumenKpis() {
    const movimientos = await this.prisma.movimientos.findMany();

    let total_ingresos = 0;
    let total_egresos = 0;

    for (const mov of movimientos) {
      const monto = Number(mov.monto);
      if (mov.tipo === 'ingreso') {
        total_ingresos += monto;
      } else if (mov.tipo === 'egreso') {
        total_egresos += monto;
      }
      // Nota: Las transferencias internas mueven saldo de una cuenta a otra,
      // por lo que no afectan el ingreso/egreso global neto a nivel consolidado.
    }

    const saldo_consolidado = total_ingresos - total_egresos;

    return {
      total_ingresos,
      total_egresos,
      saldo_consolidado,
    };
  }

  async obtenerPagosExternos() {
    return await this.prisma.movimientos.findMany({
      where: { tipo: 'egreso' },
      include: {
        cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async obtenerTransferencias() {
    return await this.prisma.movimientos.findMany({
      where: { tipo: 'transferencia' },
      include: {
        cuentas_bancarias_movimientos_cuenta_origen_idTocuentas_bancarias: true,
        cuentas_bancarias_movimientos_cuenta_destino_idTocuentas_bancarias: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
