import { Test, TestingModule } from '@nestjs/testing';
import { ModificationsService } from './modifications.service';

describe('ModificationsService', () => {
  let service: ModificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModificationsService],
    }).compile();

    service = module.get<ModificationsService>(ModificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
