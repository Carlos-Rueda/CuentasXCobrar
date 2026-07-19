import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  UseInterceptors,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AllowExternal } from '../auth/decorators/allow-external.decorator';

@ApiTags('API de Salida')
@ApiBearerAuth()
@AllowExternal()
@UseInterceptors(AuditoriaInterceptor)
@Controller('cuentas-bancarias')
export class CuentasBancariasSalidaController {
  constructor(
    private readonly cuentasBancariasService: CuentasBancariasService,
  ) {}

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener todas las cuentas bancarias' })
  @ApiQuery({
    name: 'all',
    required: false,
    description:
      'Obtener todas las cuentas (incluyendo inactivas) con "true" o "all". Si no se envía, solo se obtienen las activas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuentas bancarias obtenida con éxito.',
  })
  async findAll(@Query('all') all?: string): Promise<any[]> {
    return await this.cuentasBancariasService.findAll(all);
  }

  @Get(':id/saldo')
  @ApiOperation({
    summary: 'Obtener el saldo disponible de una cuenta bancaria',
  })
  @ApiParam({
    name: 'id',
    description: 'ID de la cuenta bancaria para consultar saldo',
  })
  @ApiResponse({
    status: 200,
    description: 'Saldo disponible calculado con éxito.',
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  async getSaldo(@Param('id') id: string) {
    return await this.cuentasBancariasService.calcularSaldo(id);
  }
}

@ApiTags('Cuentas Bancarias')
@UseInterceptors(AuditoriaInterceptor)
@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(
    private readonly cuentasBancariasService: CuentasBancariasService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Buscar una cuenta bancaria por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a buscar' })
  @ApiResponse({
    status: 200,
    description: 'Cuenta bancaria encontrada.',
    type: CuentaBancariaEntity,
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  async findOne(@Param('id') id: string): Promise<CuentaBancariaEntity> {
    const cuenta = await this.cuentasBancariasService.findOne(id);
    if (!cuenta) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }
    return cuenta;
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CXC_ADMIN')
  async create(
    @Body() cuenta: CreateCuentaBancariaDto,
    @Req() req: any,
  ): Promise<CuentaBancariaEntity | null> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    return await this.cuentasBancariasService.create(cuenta, token, ip);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CXC_ADMIN')
  @ApiOperation({ summary: 'Actualizar una cuenta bancaria existente' })
  @ApiParam({
    name: 'id',
    description: 'ID de la cuenta bancaria a actualizar',
  })
  @ApiResponse({
    status: 200,
    description: 'Cuenta bancaria actualizada con éxito.',
    type: CuentaBancariaEntity,
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  async update(
    @Param('id') id: string,
    @Body() cuentaActualizada: UpdateCuentaBancariaDto,
    @Req() req: any,
  ): Promise<CuentaBancariaEntity> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    const cuenta = await this.cuentasBancariasService.update(
      id,
      cuentaActualizada,
      token,
      ip,
    );

    if (!cuenta) {
      throw new NotFoundException(`Cuenta bancaria con ID ${id} no encontrada`);
    }

    return cuenta;
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CXC_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Inactivar una cuenta bancaria' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a inactivar' })
  @ApiResponse({
    status: 204,
    description: 'Cuenta bancaria inactivada con éxito.',
  })
  @ApiResponse({
    status: 404,
    description: 'Cuenta bancaria no encontrada.',
  })
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    await this.cuentasBancariasService.remove(id, token, ip);
  }
}
