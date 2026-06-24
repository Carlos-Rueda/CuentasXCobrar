import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CuentasCobrarService } from './modules/cuentas-cobrar/cuentas-cobrar.service';
import { FacturasService } from './modules/facturas/facturas.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const mockCxcService = {
      generarEstadoCuenta: jest.fn(),
      validarDeudaCliente: jest.fn(),
    };
    const mockFacturacionService = {
      findAllClientes: jest.fn().mockResolvedValue([]),
      findAllFacturas: jest.fn().mockResolvedValue([]),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: CuentasCobrarService, useValue: mockCxcService },
        { provide: FacturasService, useValue: mockFacturacionService },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should be defined', () => {
      expect(appController).toBeDefined();
    });
  });
});
