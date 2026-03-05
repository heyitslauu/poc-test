import { Test, TestingModule } from '@nestjs/testing';
import { EarmarksService } from './earmarks.service';

describe('EarmarksService', () => {
  let service: EarmarksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EarmarksService],
    }).compile();

    service = module.get<EarmarksService>(EarmarksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
