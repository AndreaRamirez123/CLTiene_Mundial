import { Test, TestingModule } from '@nestjs/testing';
import { MonedasService } from './monedas.service';

describe('MonedasService', () => {
  let service: MonedasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonedasService],
    }).compile();

    service = module.get<MonedasService>(MonedasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
