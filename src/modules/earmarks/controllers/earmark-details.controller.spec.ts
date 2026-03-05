import { Test, TestingModule } from '@nestjs/testing';
import { EarmarkDetailsController } from './earmark-details.controller';

describe('EarmarkDetailsController', () => {
  let controller: EarmarkDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarmarkDetailsController],
    }).compile();

    controller = module.get<EarmarkDetailsController>(EarmarkDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
