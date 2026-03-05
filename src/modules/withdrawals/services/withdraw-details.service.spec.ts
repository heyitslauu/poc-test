import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawDetailsService } from './withdraw-details.service';

describe('WithdrawDetailsService', () => {
  let service: WithdrawDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WithdrawDetailsService],
    }).compile();

    service = module.get<WithdrawDetailsService>(WithdrawDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
