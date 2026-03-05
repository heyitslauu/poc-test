import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { SubAroService } from './sub-aro.service';
import { CreateSubAroDto } from '../dto/create-sub-aro.dto';
import { UpdateSubAroDto } from '../dto/update-sub-aro.dto';
import { SubAroPaginationQueryDto } from '../dto/sub-aro-pagination.dto';
import { SubAroResponseDto } from '../dto/sub-aro-response.dto';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import * as schema from '../../../database/schemas';
import { subAros, SubAroStatus } from '../../../database/schemas/sub-aro.schema';
import { AllotmentStatus } from '../../../database/schemas/allotments.schema';

type MockDb = {
  select: jest.Mock;
  from: jest.Mock;
  where: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  orderBy: jest.Mock;
  insert: jest.Mock;
  values: jest.Mock;
  returning: jest.Mock;
  update: jest.Mock;
  set: jest.Mock;
  leftJoin: jest.Mock;
};

describe('SubAroService', () => {
  let service: SubAroService;
  let mockDb: MockDb;

  beforeEach(async () => {
    const returningMock = jest.fn();
    const limitMock = jest.fn().mockReturnValue({ offset: jest.fn() });
    const whereMock = jest.fn().mockReturnValue({ limit: limitMock, returning: returningMock });
    const setMock = jest.fn().mockReturnValue({ where: whereMock });
    const fromMock = jest.fn().mockReturnValue({
      where: whereMock,
      leftJoin: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      limit: limitMock,
      offset: jest.fn(),
    });
    const selectMock = jest.fn().mockReturnValue({ from: fromMock });
    const updateMock = jest.fn().mockReturnValue({ set: setMock });
    const insertMock = jest.fn().mockReturnValue({ values: jest.fn().mockReturnValue({ returning: returningMock }) });

    mockDb = {
      select: selectMock,
      from: fromMock,
      where: whereMock,
      limit: limitMock,
      offset: jest.fn(),
      orderBy: jest.fn().mockReturnThis(),
      insert: insertMock,
      values: jest.fn().mockReturnValue({ returning: returningMock }),
      returning: returningMock,
      update: updateMock,
      set: setMock,
      leftJoin: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SubAroService, { provide: DATABASE_CONNECTION, useValue: mockDb }],
    }).compile();

    service = module.get<SubAroService>(SubAroService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a sub-aro successfully', async () => {
      const userId = 'user1';
      const createDto: CreateSubAroDto = {
        allotment_id: 'allotment1',
        office_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        sub_aro_code: 'CODE1',
        date: '2023-01-01',
        particulars: 'Test particulars',
      };
      const mockAllotment = [{ id: 'allotment1', status: AllotmentStatus.APPROVED }];
      const mockExistingCode = [];
      const mockInserted = [
        {
          id: '1',
          allotment_id: createDto.allotment_id,
          sub_aro_code: createDto.sub_aro_code,
          date: new Date(createDto.date),
          particulars: createDto.particulars,
          status: SubAroStatus.DRAFT,
          user_id: userId,
        },
      ];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockAllotment));
      mockDb.limit.mockReturnValueOnce(Promise.resolve(mockExistingCode));
      mockDb.returning.mockResolvedValueOnce(mockInserted);
      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockInserted));

      const result = await service.create(userId, createDto);

      expect(result.id).toBe('1');
      expect(result.allotment_id).toBe(createDto.allotment_id);
      expect(result.sub_aro_code).toBe(createDto.sub_aro_code);
      expect(result.date).toEqual(new Date(createDto.date));
      expect(result.particulars).toBe(createDto.particulars);
      expect(result.status).toBe(SubAroStatus.DRAFT);
      expect(result.user_id).toBe(userId);
      expect(mockDb.select).toHaveBeenCalledWith();
      expect(mockDb.from).toHaveBeenCalledWith(schema.allotments);
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalledWith(subAros);
      expect(mockDb.values).toHaveBeenCalledWith({
        user_id: userId,
        allotment_id: createDto.allotment_id,
        sub_aro_code: createDto.sub_aro_code,
        date: new Date(createDto.date),
        particulars: createDto.particulars,
        status: SubAroStatus.DRAFT,
      });
    });

    it('should throw NotFoundException if allotment not found or not approved', async () => {
      const userId = 'user1';
      const createDto: CreateSubAroDto = {
        allotment_id: 'allotment1',
        office_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        sub_aro_code: 'CODE1',
        date: '2023-01-01',
        particulars: 'Test particulars',
      };
      const mockAllotment = [];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockAllotment));

      await expect(service.create(userId, createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if sub_aro_code already exists', async () => {
      const userId = 'user1';
      const createDto: CreateSubAroDto = {
        allotment_id: 'allotment1',
        office_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        sub_aro_code: 'CODE1',
        date: '2023-01-01',
        particulars: 'Test particulars',
      };
      const mockAllotment = [{ id: 'allotment1', status: AllotmentStatus.APPROVED }];
      const mockExistingCode = [{ id: 'existing' }];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockAllotment));
      mockDb.limit.mockReturnValueOnce(Promise.resolve(mockExistingCode));

      await expect(service.create(userId, createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw Error if insert fails', async () => {
      const userId = 'user1';
      const createDto: CreateSubAroDto = {
        allotment_id: 'allotment1',
        office_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        sub_aro_code: 'CODE1',
        date: '2023-01-01',
        particulars: 'Test particulars',
      };
      const mockAllotment = [{ id: 'allotment1', status: AllotmentStatus.APPROVED }];
      const mockExistingCode = [];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockAllotment));
      mockDb.limit.mockReturnValueOnce(Promise.resolve(mockExistingCode));
      mockDb.returning.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(service.create(userId, createDto)).rejects.toThrow('Failed to create sub-aro: Insert failed');
    });
  });

  describe('findAll', () => {
    it('should return paginated sub-aros without filters', async () => {
      const query: SubAroPaginationQueryDto = { page: 1, limit: 10 };
      const mockData = [{ id: '1', sub_aro_code: 'CODE1' }];
      const mockCount = [{ value: 1 }];

      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockReturnValueOnce(mockDb);
      mockDb.limit.mockReturnValueOnce(mockDb);
      mockDb.offset.mockReturnValueOnce(Promise.resolve(mockData));
      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockCount));

      const result = await service.findAll(query);

      expect(result.data[0].id).toBe('1');
      expect(result.data[0].sub_aro_code).toBe('CODE1');
      expect(result.totalItems).toBe(1);
    });

    it('should apply search filter', async () => {
      const query: SubAroPaginationQueryDto = { page: 1, limit: 10, search: 'CODE' };
      const mockData = [{ id: '1', sub_aro_code: 'CODE1' }];
      const mockCount = [{ value: 1 }];

      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockReturnValueOnce(mockDb);
      mockDb.limit.mockReturnValueOnce(mockDb);
      mockDb.offset.mockReturnValueOnce(Promise.resolve(mockData));
      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockCount));

      const result = await service.findAll(query);

      expect(result.data[0].id).toBe('1');
      expect(result.data[0].sub_aro_code).toBe('CODE1');
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return sub-aro if found', async () => {
      const id = '1';
      const mockData = [{ id: '1', sub_aro_code: 'CODE1' }];

      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockData));

      const result = await service.findOne(id);

      expect(result.id).toBe('1');
      expect(result.sub_aro_code).toBe('CODE1');
    });

    it('should throw NotFoundException if not found', async () => {
      const id = '1';
      const mockData = [];

      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockData));

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update sub-aro successfully', async () => {
      const id = '1';
      const updateDto: UpdateSubAroDto = { sub_aro_code: 'NEWCODE' };
      const mockExisting = [{ id: '1', status: SubAroStatus.DRAFT }];
      const mockUpdated = [{ id: '1', sub_aro_code: 'NEWCODE' }];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));
      mockDb.returning.mockResolvedValueOnce(mockUpdated);
      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockUpdated));

      const result = await service.update(id, updateDto);

      expect(result.id).toBe('1');
      expect(result.sub_aro_code).toBe('NEWCODE');
    });

    it('should throw NotFoundException if sub-aro not found', async () => {
      const id = '1';
      const updateDto: UpdateSubAroDto = { sub_aro_code: 'NEWCODE' };
      const mockExisting = [];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));

      await expect(service.update(id, updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw UnprocessableEntityException if status not allowed', async () => {
      const id = '1';
      const updateDto: UpdateSubAroDto = { sub_aro_code: 'NEWCODE' };
      const mockExisting = [{ id: '1', status: SubAroStatus.APPROVED }];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));

      await expect(service.update(id, updateDto)).rejects.toThrow(UnprocessableEntityException);
    });
  });

  describe('updateStatus', () => {
    it('should update sub-aro status successfully', async () => {
      const id = '1';
      const status = SubAroStatus.FOR_TRIAGE;
      const mockExisting = [{ id: '1', status: SubAroStatus.DRAFT }];
      const mockUpdated = [{ id: '1', status: SubAroStatus.FOR_TRIAGE }];
      const mockFindOneResult = { id: '1', status: SubAroStatus.FOR_TRIAGE } as SubAroResponseDto;

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));
      mockDb.returning.mockResolvedValueOnce(mockUpdated);
      mockDb.leftJoin.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(Promise.resolve(mockUpdated));

      const result = await service.updateStatus(id, status);

      expect(result).toEqual(mockFindOneResult);
    });

    it('should throw NotFoundException if sub-aro not found', async () => {
      const id = '1';
      const status = SubAroStatus.FOR_TRIAGE;
      const mockExisting = [];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));

      await expect(service.updateStatus(id, status)).rejects.toThrow(NotFoundException);
      await expect(service.updateStatus(id, status)).rejects.toThrow('Sub-aro with ID 1 not found');
    });

    it('should throw NotFoundException if update fails', async () => {
      const id = '1';
      const status = SubAroStatus.FOR_TRIAGE;
      const mockExisting = [{ id: '1', status: SubAroStatus.DRAFT }];
      const mockUpdated = [];

      mockDb.where.mockReturnValueOnce(Promise.resolve(mockExisting));
      mockDb.returning.mockResolvedValueOnce(mockUpdated);

      await expect(service.updateStatus(id, status)).rejects.toThrow(NotFoundException);
      await expect(service.updateStatus(id, status)).rejects.toThrow('Unable to update sub-aro status with ID 1');
    });
  });
});
