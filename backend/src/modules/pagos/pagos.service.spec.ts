import { Test, TestingModule } from '@nestjs/testing';
import { PagosService } from './pagos.service';
import { FacturasService } from '../facturas/facturas.service';

describe('PagosService', () => {
  let service: PagosService;

  const mockFacturasService = {
    findOneFactura: jest.fn(),
    findAllFacturas: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagosService,
        {
          provide: FacturasService,
          useValue: mockFacturasService,
        },
      ],
    }).compile();

    service = module.get<PagosService>(PagosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
