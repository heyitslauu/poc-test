import { Test, TestingModule } from '@nestjs/testing';
import { ObligationDetailsController } from './obligation-details.controller';

describe('ObligationDetailsController', () => {
  let controller: ObligationDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ObligationDetailsController],
    }).compile();

    controller = module.get<ObligationDetailsController>(ObligationDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
