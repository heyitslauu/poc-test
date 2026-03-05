import { Test, TestingModule } from '@nestjs/testing';
import { ModificationDetailsService } from './modification-details.service';

describe('ModificationDetailsService', () => {
  let service: ModificationDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ModificationDetailsService],
    }).compile();

    service = module.get<ModificationDetailsService>(ModificationDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
