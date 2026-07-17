import { Test, TestingModule } from '@nestjs/testing';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CuentasBancariasService', () => {
  let service: CuentasBancariasService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    cuentas_bancarias: {
      count: jest.fn().mockResolvedValue(0),
      createMany: jest.fn().mockResolvedValue({ count: 3 }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CuentasBancariasService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CuentasBancariasService>(CuentasBancariasService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should seed data if count is 0', async () => {
      mockPrismaService.cuentas_bancarias.count.mockResolvedValueOnce(0);
      await service.onModuleInit();
      expect(mockPrismaService.cuentas_bancarias.createMany).toHaveBeenCalled();
    });

    it('should not seed data if count > 0', async () => {
      mockPrismaService.cuentas_bancarias.count.mockResolvedValueOnce(5);
      mockPrismaService.cuentas_bancarias.createMany.mockClear();
      await service.onModuleInit();
      expect(
        mockPrismaService.cuentas_bancarias.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return a list of mapped entities', async () => {
      const mockDbCuentas = [
        {
          id: '1',
          codigo: 'CTA-001',
          nombre_cuenta: 'Cuenta A',
          entidad_bancaria: 'Banco A',
          titular: 'Empresa Integrador S.A.',
          tipo_cuenta: 'Corriente',
          nro_cuenta: '2100987654',
          ruc: '1790011223001',
          descripcion: 'Desc A',
          estado: 'activo',
        },
      ];
      mockPrismaService.cuentas_bancarias.findMany.mockResolvedValueOnce(
        mockDbCuentas,
      );

      const result = await service.findAll();
      expect(result).toEqual([
        {
          id: '1',
          codigo: 'CTA-001',
          nombreCuenta: 'Cuenta A',
          entidadBancaria: 'Banco A',
          titular: 'Empresa Integrador S.A.',
          tipoCuenta: 'Corriente',
          nroCuenta: '2100987654',
          ruc: '1790011223001',
        },
      ]);
    });
  });
});
