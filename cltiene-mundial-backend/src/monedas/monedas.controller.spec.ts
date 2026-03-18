import { Test, TestingModule } from '@nestjs/testing';
import { MonedasController } from './monedas.controller';

describe('MonedasController', () => {
  let controller: MonedasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonedasController],
    }).compile();

    controller = module.get<MonedasController>(MonedasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
