import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawDetailsController } from './withdraw-details.controller';

describe('WithdrawDetailsController', () => {
  let controller: WithdrawDetailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WithdrawDetailsController],
    }).compile();

    controller = module.get<WithdrawDetailsController>(WithdrawDetailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
