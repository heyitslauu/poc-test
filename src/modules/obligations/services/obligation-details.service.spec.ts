import { Test, TestingModule } from '@nestjs/testing';
import { ObligationDetailsService } from './obligation-details.service';

describe('ObligationDetailsService', () => {
  let service: ObligationDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ObligationDetailsService],
    }).compile();

    service = module.get<ObligationDetailsService>(ObligationDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
