import { Test, TestingModule } from '@nestjs/testing';
import { ModificationDetailsController } from './modification-details.controller';

describe('ModificationDetailsController', () => {
  let controller: ModificationDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModificationDetailsController],
    }).compile();

    controller = module.get<ModificationDetailsController>(ModificationDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
