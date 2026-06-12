import { Test, TestingModule } from '@nestjs/testing';
import { CuentasCobrarController } from './cuentas-cobrar.controller';

describe('CuentasCobrarController', () => {
  let controller: CuentasCobrarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CuentasCobrarController],
    }).compile();

    controller = module.get<CuentasCobrarController>(CuentasCobrarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
