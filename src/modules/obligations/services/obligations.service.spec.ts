import { Test, TestingModule } from '@nestjs/testing';
import { ObligationsService } from './obligations.service';

describe('ObligationsService', () => {
  let service: ObligationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObligationsService],
    }).compile();

    service = module.get<ObligationsService>(ObligationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
