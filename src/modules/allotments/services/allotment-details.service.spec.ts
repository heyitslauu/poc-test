import { Test, TestingModule } from '@nestjs/testing';
import { AllotmentDetailsService } from './allotment-details.service';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import { NotFoundException } from '@nestjs/common';
import { CreateAllotmentDetailDto } from '../dto/create-allotment-detail.dto';
import { AllotmentDetailsPaginationQueryDto } from '../dto/allotment-details-pagination.dto';

describe('AllotmentDetailsService', () => {
  let service: AllotmentDetailsService;

  type MockDb = {
    insert: jest.Mock;
    values: jest.Mock;
    returning: jest.Mock;
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
    offset: jest.Mock;
    delete: jest.Mock;
    update: jest.Mock;
    set: jest.Mock;
  };

  let dbMock: MockDb;

  beforeEach(async () => {
    dbMock = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllotmentDetailsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<AllotmentDetailsService>(AllotmentDetailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new allotment detail', async () => {
      const userId = 'user-uuid';
      const createDto = {
        allotment_id: 'allotment-uuid',
        office_id: 'office-uuid',
        pap_id: 'pap-uuid',
        rca_id: 'rca-uuid',
        amount: 500,
      };
      const createdDetail = {
        id: 'detail-uuid',
        user_id: userId,
        ...createDto,
        created_at: new Date(),
        updated_at: new Date(),
      };

      dbMock.returning.mockResolvedValue([createdDetail]);

      const result = await service.create(userId, createDto as CreateAllotmentDetailDto);

      expect(dbMock.insert).toHaveBeenCalled();
      expect(dbMock.values).toHaveBeenCalledWith(
        expect.objectContaining({
          ...createDto,
          user_id: userId,
        }),
      );
      expect(dbMock.returning).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: createdDetail.id,
          amount: createdDetail.amount,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update an allotment detail', async () => {
      const id = 'detail-uuid';
      const updateDto = { amount: 1000 };
      const updatedDetail = {
        id,
        user_id: 'user-uuid',
        allotment_id: 'allotment-uuid',
        office_id: 'office-uuid',
        pap_id: 'pap-uuid',
        rca_id: 'rca-uuid',
        amount: 1000,
      };

      dbMock.returning.mockResolvedValue([updatedDetail]);

      const result = await service.update(id, updateDto);

      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.set).toHaveBeenCalledWith(updateDto);
      expect(dbMock.where).toHaveBeenCalled();
      expect(dbMock.returning).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ amount: 1000 }));
    });

    it('should throw NotFoundException if detail to update is not found', async () => {
      const id = 'non-existent-uuid';
      const updateDto = { amount: 1000 };
      dbMock.returning.mockResolvedValue([]);

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return paginated allotment details', async () => {
      const allotmentId = 'allotment-uuid';
      const paginationQuery: AllotmentDetailsPaginationQueryDto = {
        page: 1,
        limit: 10,
      };
      const details = [
        { id: 'detail-1', allotment_id: 'allotment-uuid', amount: 100 },
        { id: 'detail-2', allotment_id: 'allotment-uuid', amount: 200 },
      ];
      const totalItems = 2;

      dbMock.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(details),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: totalItems }]),
          }),
        });

      const result = await service.findAll(allotmentId, paginationQuery);

      expect(result.totalItems).toBe(totalItems);
      expect(result.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'detail-1' }),
          expect.objectContaining({ id: 'detail-2' }),
        ]),
      );
    });
  });

  describe('delete', () => {
    it('should delete an allotment detail', async () => {
      const id = 'detail-uuid';
      dbMock.returning.mockResolvedValue([{ id }]);

      await service.delete(id);

      expect(dbMock.delete).toHaveBeenCalled();
      expect(dbMock.where).toHaveBeenCalled();
      expect(dbMock.returning).toHaveBeenCalled();
    });

    it('should throw NotFoundException if detail to delete is not found', async () => {
      const id = 'non-existent-uuid';
      dbMock.returning.mockResolvedValue([]);

      await expect(service.delete(id)).rejects.toThrow(NotFoundException);
    });
  });
});
