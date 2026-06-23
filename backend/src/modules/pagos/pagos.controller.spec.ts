import { Test, TestingModule } from '@nestjs/testing';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';

describe('PagosController', () => {
  let controller: PagosController;

  const mockPagosService = {
    registrarCobro: jest.fn(),
    obtenerFacturas: jest.fn(),
    obtenerEstadoCuenta: jest.fn(),
    obtenerClientesConDeuda: jest.fn(),
    generarReciboPdf: jest.fn(),
    obtenerReporte: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PagosController],
      providers: [
        {
          provide: PagosService,
          useValue: mockPagosService,
        },
      ],
    }).compile();

    controller = module.get<PagosController>(PagosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
