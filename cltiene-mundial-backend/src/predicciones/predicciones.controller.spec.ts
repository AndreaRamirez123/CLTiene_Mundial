import { Test, TestingModule } from '@nestjs/testing';
import { PrediccionesController } from './predicciones.controller';

describe('PrediccionesController', () => {
  let controller: PrediccionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrediccionesController],
    }).compile();

    controller = module.get<PrediccionesController>(PrediccionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
