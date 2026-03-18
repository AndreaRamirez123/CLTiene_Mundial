import { Test, TestingModule } from '@nestjs/testing';
import { PrediccionesService } from './predicciones.service';

describe('PrediccionesService', () => {
  let service: PrediccionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrediccionesService],
    }).compile();

    service = module.get<PrediccionesService>(PrediccionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
