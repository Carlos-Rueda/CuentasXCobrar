import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MovimientosService } from './movimientos.service';
import { PagoExternoDto } from './dto/pago-externo.dto';
import { TransferenciaDto } from './dto/transferencia.dto';
import { JwtAuthGuard } from '../cuentas-cobrar/jwt-auth.guard';

@ApiTags('Movimientos')
@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly movimientosService: MovimientosService) {}

  @Get('resumen')
  @ApiOperation({ summary: 'Obtener resumen consolidado de KPIs (ingresos, egresos, saldo)' })
  @ApiResponse({
    status: 200,
    description: 'Resumen obtenido correctamente.',
  })
  async obtenerResumenKpis() {
    return await this.movimientosService.obtenerResumenKpis();
  }

  @Post('pago-externo')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un pago externo manual (agua, luz)' })
  @ApiResponse({
    status: 201,
    description: 'El pago externo ha sido registrado correctamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de entrada no válidos.',
  })
  @ApiResponse({
    status: 404,
    description: 'La cuenta bancaria de origen no existe.',
  })
  async registrarPagoExterno(@Body() dto: PagoExternoDto) {
    const movimiento = await this.movimientosService.registrarPagoExterno(dto);
    return {
      success: true,
      message: 'Pago externo registrado exitosamente',
      data: movimiento,
    };
  }

  @Post('transferencia')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una transferencia interna entre cuentas' })
  @ApiResponse({
    status: 201,
    description: 'La transferencia se ha registrado con éxito.',
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta o cuentas idénticas.',
  })
  @ApiResponse({
    status: 404,
    description: 'Alguna de las cuentas no existe.',
  })
  async registrarTransferencia(@Body() dto: TransferenciaDto) {
    const movimiento = await this.movimientosService.registrarTransferencia(dto);
    return {
      success: true,
      message: 'Transferencia interna registrada exitosamente',
      data: movimiento,
    };
  }

  @Get('pagos-externos')
  @ApiOperation({ summary: 'Obtener todos los pagos externos registrados' })
  async obtenerPagosExternos() {
    return await this.movimientosService.obtenerPagosExternos();
  }

  @Get('transferencias')
  @ApiOperation({ summary: 'Obtener todas las transferencias internas registradas' })
  async obtenerTransferencias() {
    return await this.movimientosService.obtenerTransferencias();
  }
}

