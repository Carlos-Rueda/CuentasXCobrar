import { Test, TestingModule } from '@nestjs/testing';
import { FacturasController } from './facturas.controller';
import { FacturasService } from './facturas.service';

describe('FacturasController', () => {
  let controller: FacturasController;

  const mockFacturasService = {
    findAllClientes: jest.fn(),
    findOneCliente: jest.fn(),
    findAllFacturas: jest.fn(),
    findOneFactura: jest.fn(),
    findFacturasPendientesByCliente: jest.fn(),
    crearFactura: jest.fn(),
    generarFacturaPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacturasController],
      providers: [
        {
          provide: FacturasService,
          useValue: mockFacturasService,
        },
      ],
    }).compile();

    controller = module.get<FacturasController>(FacturasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
