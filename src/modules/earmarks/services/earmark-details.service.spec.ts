import { Test, TestingModule } from '@nestjs/testing';
import { EarmarkDetailsService } from './earmark-details.service';

describe('EarmarkDetailsService', () => {
  let service: EarmarkDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EarmarkDetailsService],
    }).compile();

    service = module.get<EarmarkDetailsService>(EarmarkDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
