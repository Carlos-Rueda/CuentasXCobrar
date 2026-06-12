import { Test, TestingModule } from '@nestjs/testing';
import { CuentasCobrarService } from './cuentas-cobrar.service';

describe('CuentasCobrarService', () => {
  let service: CuentasCobrarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CuentasCobrarService],
    }).compile();

    service = module.get<CuentasCobrarService>(CuentasCobrarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
