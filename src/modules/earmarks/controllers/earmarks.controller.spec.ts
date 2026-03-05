import { Test, TestingModule } from '@nestjs/testing';
import { EarmarksController } from './earmarks.controller';

describe('EarmarksController', () => {
  let controller: EarmarksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EarmarksController],
    }).compile();

    controller = module.get<EarmarksController>(EarmarksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
