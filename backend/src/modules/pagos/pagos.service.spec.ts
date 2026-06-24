import { Test, TestingModule } from '@nestjs/testing';
import { PagosService } from './pagos.service';
import { PrismaService } from '../../prisma/prisma.service';
import { FacturacionApiService } from '../cuentas-cobrar/facturacion-api.service';
import { NotFoundException } from '@nestjs/common';

describe('PagosService', () => {
  let service: PagosService;
  let prismaService: PrismaService;
  let facturacionApiService: FacturacionApiService;

  const mockPrismaService = {
    cuentas_bancarias: {
      findUnique: jest.fn(),
    },
    pagos_clientes: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    detalles_pago: {
      aggregate: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrismaService)),
  };

  const mockFacturacionApiService = {
    obtenerClientePorId: jest.fn(),
    obtenerFacturas: jest.fn(),
    obtenerFacturasPendientesPorCliente: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: FacturacionApiService,
          useValue: mockFacturacionApiService,
        },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
    prismaService = module.get<PrismaService>(PrismaService);
    facturacionApiService = module.get<FacturacionApiService>(FacturacionApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if bank account does not exist', async () => {
      mockPrismaService.cuentas_bancarias.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.create({
          clienteId: 'cli-001',
          cuentaBancariaId: 'cb-invalid',
          descripcion: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if client does not exist', async () => {
      mockPrismaService.cuentas_bancarias.findUnique.mockResolvedValueOnce({ id: 'cb-001' });
      mockFacturacionApiService.obtenerClientePorId.mockResolvedValueOnce(null);

      await expect(
        service.create({
          clienteId: 'cli-invalid',
          cuentaBancariaId: 'cb-001',
          descripcion: 'test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
