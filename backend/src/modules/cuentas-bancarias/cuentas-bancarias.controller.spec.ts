import { Test, TestingModule } from '@nestjs/testing';
import { CuentasBancariasController } from './cuentas-bancarias.controller';
import { CuentasBancariasService } from './cuentas-bancarias.service';
import { NotFoundException } from '@nestjs/common';

describe('CuentasBancariasController', () => {
  let controller: CuentasBancariasController;
  let service: CuentasBancariasService;

  const mockCuentasBancariasService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentasBancariasController],
      providers: [
        {
          provide: CuentasBancariasService,
          useValue: mockCuentasBancariasService,
        },
      ],
    }).compile();

    controller = module.get<CuentasBancariasController>(
      CuentasBancariasController,
    );
    service = module.get<CuentasBancariasService>(CuentasBancariasService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return list of cuentas', async () => {
      const mockResult = [
        {
          id: '1',
          codigo: 'CTA-001',
          nombreCuenta: 'Cuenta A',
          entidadBancaria: 'Banco A',
          descripcion: 'Desc A',
          estado: 'activo',
        },
      ];
      mockCuentasBancariasService.findAll.mockResolvedValueOnce(mockResult);

      const result = await controller.findAll();
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should return a cuenta if found', async () => {
      const mockResult = {
        id: '1',
        codigo: 'CTA-001',
        nombreCuenta: 'Cuenta A',
        entidadBancaria: 'Banco A',
        descripcion: 'Desc A',
        estado: 'activo',
      };
      mockCuentasBancariasService.findOne.mockResolvedValueOnce(mockResult);

      const result = await controller.findOne('1');
      expect(result).toBe(mockResult);
    });

    it('should throw NotFoundException if not found', async () => {
      mockCuentasBancariasService.findOne.mockResolvedValueOnce(null);
      await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
