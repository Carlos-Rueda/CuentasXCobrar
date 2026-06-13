import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { CuentaBancariaEntity } from './cuenta-bancaria.entity';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@ApiTags('Cuentas Bancarias')
@Controller('cuentas-bancarias')
export class CuentasBancariasController {
  constructor(private readonly cuentasBancariasService: CuentasBancariasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las cuentas bancarias' })
  @ApiResponse({ status: 200, description: 'Lista de cuentas bancarias obtenida con éxito.', type: [CuentaBancariaEntity] })
  findAll(): CuentaBancariaEntity[] {
    return this.cuentasBancariasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar una cuenta bancaria por ID' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a buscar' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria encontrada.', type: CuentaBancariaEntity })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  findOne(@Param('id') id: string): CuentaBancariaEntity {
    return this.cuentasBancariasService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear una nueva cuenta bancaria' })
  @ApiResponse({ status: 201, description: 'Cuenta bancaria creada con éxito.', type: CuentaBancariaEntity })
  create(@Body() cuenta: CreateCuentaBancariaDto): CuentaBancariaEntity {
    return this.cuentasBancariasService.create(cuenta);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una cuenta bancaria existente' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a actualizar' })
  @ApiResponse({ status: 200, description: 'Cuenta bancaria actualizada con éxito.', type: CuentaBancariaEntity })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  update(
    @Param('id') id: string,
    @Body() cuentaActualizada: UpdateCuentaBancariaDto,
  ): CuentaBancariaEntity {
    return this.cuentasBancariasService.update(id, cuentaActualizada);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una cuenta bancaria' })
  @ApiParam({ name: 'id', description: 'ID de la cuenta bancaria a eliminar' })
  @ApiResponse({ status: 204, description: 'Cuenta bancaria eliminada con éxito.' })
  @ApiResponse({ status: 404, description: 'Cuenta bancaria no encontrada.' })
  remove(@Param('id') id: string): void {
    this.cuentasBancariasService.remove(id);
  }
}

