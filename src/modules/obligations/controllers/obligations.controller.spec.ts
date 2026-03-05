import { Test, TestingModule } from '@nestjs/testing';
import { ObligationsController } from './obligations.controller';

describe('ObligationsController', () => {
  let controller: ObligationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObligationsController],
    }).compile();

    controller = module.get<ObligationsController>(ObligationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
