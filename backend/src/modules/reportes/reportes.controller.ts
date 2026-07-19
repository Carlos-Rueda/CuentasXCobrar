import { Controller, Get, Post, Body, Query, Res, Req, HttpStatus, Param } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportesService } from './reportes.service';
import * as fs from 'fs';
import * as path from 'path';

@ApiTags('Reportes')
@ApiBearerAuth()
@Controller('reportes')
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Post('save-csv')
  @ApiOperation({ summary: 'Guardar un archivo CSV en EFS desde el frontend' })
  async guardarCsvEfs(
    @Body() body: { filename: string; content: string },
    @Res() res: Response,
  ) {
    const { filename, content } = body;
    const pdfsDir = path.join(process.cwd(), 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      fs.mkdirSync(pdfsDir, { recursive: true });
    }
    const filePath = path.join(pdfsDir, filename);
    // Guardar con UTF-8 BOM
    fs.writeFileSync(filePath, '\uFEFF' + content, 'utf-8');
    console.log(`[EFS] CSV guardado en: ${filePath}`);
    return res.status(HttpStatus.OK).send({ success: true });
  }

  @Get('efs-files')
  @ApiOperation({ summary: 'Listar todos los archivos PDF y CSV guardados en EFS' })
  async listarArchivosEfs() {
    const pdfsDir = path.join(process.cwd(), 'pdfs');
    if (!fs.existsSync(pdfsDir)) {
      return [];
    }
    const files = fs.readdirSync(pdfsDir);
    return files
      .filter((file) => file.endsWith('.pdf') || file.endsWith('.csv'))
      .map((file) => {
        const filePath = path.join(pdfsDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          createdAt: stats.birthtime,
        };
      });
  }

  @Get('efs-files/:filename')
  @ApiOperation({ summary: 'Ver/Descargar un archivo específico de EFS' })
  async descargarArchivoEfs(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const pdfsDir = path.join(process.cwd(), 'pdfs');
    const filePath = path.join(pdfsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(HttpStatus.NOT_FOUND).send({
        statusCode: 404,
        message: 'Archivo no encontrado en EFS',
      });
    }

    const contentType = filename.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'application/pdf';
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename=${filename}`,
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  @Get('estado-cuenta')
  @ApiOperation({
    summary:
      'Obtener estado de cuenta de un cliente unificando GraphQL y Prisma',
  })
  @ApiQuery({
    name: 'clienteId',
    required: true,
    description: 'ID del cliente',
  })
  @ApiQuery({
    name: 'fechaInicio',
    required: false,
    description: 'Fecha de inicio del rango (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'fechaFin',
    required: false,
    description: 'Fecha de fin del rango (YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuenta consolidado exitosamente.',
  })
  async obtenerEstadoCuenta(
    @Query('clienteId') clienteId: string,
    @Req() req,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    return await this.reportesService.obtenerEstadoCuenta(
      clienteId,
      fechaInicio,
      fechaFin,
      token,
      ip,
    );
  }

  @Get('estado-cuenta/pdf')
  async descargarEstadoCuentaPdf(
    @Query('clienteId') clienteId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
    @Req() req,
    @Res() res: Response,
  ) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    let ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      '127.0.0.1';

    if (ip === '::1') {
      ip = '127.0.0.1';
    }

    const buffer = await this.reportesService.generarEstadoCuentaPdf(
      clienteId,
      fechaInicio,
      fechaFin,
      token,
      ip,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=estado-cuenta-${clienteId}.pdf`,
      'Content-Length': buffer.length,
    });

    res.status(HttpStatus.OK).send(buffer);
  }
}
