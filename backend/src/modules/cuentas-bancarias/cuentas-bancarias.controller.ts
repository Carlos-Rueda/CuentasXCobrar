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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';
import { AuditoriaInterceptor } from '../interceptors/auditoria.interceptor';
import { JwtAuthGuard } from '../cuentas-cobrar/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Cuentas Bancarias')
@UseInterceptors(AuditoriaInterceptor)
@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(
    private readonly cuentasBancariasService: CuentasBancariasService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las cuentas bancarias' })
  @ApiResponse({
    status: 200,
    description: 'Lista de cuentas bancarias obtenida con éxito.',
    type: [CuentaBancariaEntity],
  })
  async findAll(): Promise<CuentaBancariaEntity[]> {
    return await this.cuentasBancariasService.findAll();
  }

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

  @Get(':id/saldo')
  @ApiTags('API de Salida')
  @ApiOperation({ summary: 'Obtener el saldo disponible de una cuenta bancaria' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria para consultar saldo' })
  @ApiResponse({
    status: 200,
    description: 'Saldo disponible calculado con éxito.',
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  async getSaldo(@Param('id') id: string) {
    return await this.cuentasBancariasService.calcularSaldo(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('CXC_ADMIN')
  @ApiOperation({ summary: 'Crear una nueva cuenta bancaria' })
  @ApiResponse({
    status: 201,
    description: 'Cuenta bancaria creada con éxito.',
    type: CuentaBancariaEntity,
  })
  async create(
    @Body() cuenta: CreateCuentaBancariaDto,
  ): Promise<CuentaBancariaEntity | null> {
    return await this.cuentasBancariasService.create(cuenta);
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
  ): Promise<CuentaBancariaEntity> {
    const cuenta = await this.cuentasBancariasService.update(
      id,
      cuentaActualizada,
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
  @ApiOperation({ summary: 'Eliminar una cuenta bancaria' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a eliminar' })
  @ApiResponse({
    status: 204,
    description: 'Cuenta bancaria eliminada con éxito.',
  })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  async remove(@Param('id') id: string): Promise<void> {
    await this.cuentasBancariasService.remove(id);
  }
}
