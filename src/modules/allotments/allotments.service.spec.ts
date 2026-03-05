import { Test, TestingModule } from '@nestjs/testing';
import { AllotmentsService } from './allotments.service';
import { DATABASE_CONNECTION } from '../../config/database.config';
import {
  AllotmentStatus,
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
  NewAllotmentDraft,
} from '../../database/schemas';
import { CreateAllotmentDto } from './dto/create-allotment.dto';
import { NotFoundException } from '@nestjs/common';

describe('AllotmentsService', () => {
  let service: AllotmentsService;
  let dbMock: {
    insert: jest.Mock;
    update: jest.Mock;
    values: jest.Mock;
    set: jest.Mock;
    where: jest.Mock;
    returning: jest.Mock;
    select: jest.Mock;
    transaction: jest.Mock;
    delete: jest.Mock;
    leftJoin: jest.Mock;
  };

  beforeEach(async () => {
    const returningMock = jest.fn();
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
    const setMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: returningMock }) });
    const whereMock = jest.fn().mockReturnValue({ limit: jest.fn().mockReturnValue({ offset: jest.fn() }) });

    dbMock = {
      insert: jest.fn().mockReturnValue({ values: valuesMock }),
      update: jest.fn().mockReturnValue({ set: setMock }),
      values: valuesMock,
      set: setMock,
      where: whereMock,
      returning: returningMock,
      select: jest.fn(),
      delete: jest.fn().mockReturnValue({ where: jest.fn() }),
      transaction: jest.fn((cb: (tx: typeof dbMock) => Promise<unknown>) => cb(dbMock)),
      leftJoin: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AllotmentsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<AllotmentsService>(AllotmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an allotment successfully', async () => {
      const createDto: CreateAllotmentDto = {
        allotment_code: 'ALLOTMENT-00001',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        remarks: 'Test remarks',
        date: new Date('2025-01-01'),
      };
      const userId = '00000000-0000-0000-0000-000000000000';

      const expectedAllotment = {
        id: 'mock-uuid',
        user_id: userId,
        fund_cluster: createDto.fund_cluster,
        particulars: createDto.particulars,
        appropriation_type: createDto.appropriation_type,
        bfars_budget_type: createDto.bfars_budget_type,
        allotment_type: createDto.allotment_type,
        total_allotment: createDto.total_allotment,
        remarks: createDto.remarks,
        tracking_reference: 'EX-2025-01-ABC12345',
        date: new Date(createDto.date),
        status: AllotmentStatus.DRAFT,
        created_at: new Date(),
        updated_at: new Date(),
      };

      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      dbMock.returning.mockResolvedValue([expectedAllotment]);

      const result = await service.create(userId, createDto);

      expect(dbMock.insert).toHaveBeenCalled();

      const valuesArgs = (dbMock.values.mock.calls as [NewAllotmentDraft][])[0][0];
      expect(valuesArgs).toEqual(
        expect.objectContaining({
          user_id: userId,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: expectedAllotment.id,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated data', async () => {
      const mockAllotments = [
        {
          id: 'mock-uuid-1',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Allotment 1',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 100000,
          remarks: 'Test remarks',
          date: new Date('2025-01-01'),
          user_id: '00000000-0000-0000-0000-000000000000',
          tracking_reference: 'EX-2025-01-ABC12345',
          status: AllotmentStatus.DRAFT,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const countMock = [{ value: 1 }];

      const offsetMock = jest.fn().mockResolvedValue(mockAllotments);
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });

      dbMock.select = jest.fn().mockImplementation((arg: { value: unknown } | undefined) => {
        if (arg && arg.value) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(countMock),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        };
      });

      const result = await service.findAll(1, 10);

      expect(dbMock.select).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('totalItems');
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should return data when searching with decimal amount', async () => {
      const mockAllotment = {
        id: 'mock-uuid-dec',
        total_allotment: 150000,
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment Decimal',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        remarks: 'Test remarks decimal',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        tracking_reference: 'EX-2025-01-DEC12345',
        status: AllotmentStatus.DRAFT,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const countMock = [{ value: 1 }];
      const offsetMock = jest.fn().mockResolvedValue([mockAllotment]);
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });

      dbMock.select = jest.fn().mockImplementation((arg: { value: unknown } | undefined) => {
        if (arg && arg.value) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(countMock),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        };
      });

      const result = await service.findAll(1, 10, '1500.00');

      expect(dbMock.select).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('mock-uuid-dec');
    });

    it('should apply filters correctly', async () => {
      const mockAllotment = {
        id: 'mock-uuid-filtered',
        total_allotment: 100000,
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Filtered Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        remarks: 'Filtered remarks',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        tracking_reference: 'EX-2025-01-FILT1234',
        status: AllotmentStatus.APPROVED,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const countMock = [{ value: 1 }];
      const offsetMock = jest.fn().mockResolvedValue([mockAllotment]);
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });

      dbMock.select = jest.fn().mockImplementation((arg: { value: unknown } | undefined) => {
        if (arg && arg.value) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(countMock),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        };
      });

      const filters = { status: AllotmentStatus.APPROVED };
      const result = await service.findAll(1, 10, undefined, filters);

      expect(dbMock.select).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(AllotmentStatus.APPROVED);
    });
  });

  describe('findAllDrafts', () => {
    it('should return paginated data', async () => {
      const mockDrafts = [
        {
          id: 'mock-uuid-1',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Draft 1',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 100000,
          remarks: 'Test remarks',
          date: new Date('2025-01-01'),
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const countMock = [{ value: 1 }];

      const offsetMock = jest.fn().mockResolvedValue(mockDrafts);
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });

      dbMock.select = jest.fn().mockImplementation((arg: { value: unknown } | undefined) => {
        if (arg && arg.value) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(countMock),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        };
      });

      const result = await service.findAllDrafts(1, 10);

      expect(dbMock.select).toHaveBeenCalledTimes(2);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('totalItems');
      expect(result.data).toHaveLength(1);
      expect(result.totalItems).toBe(1);
    });

    it('should return data when searching with decimal amount', async () => {
      const mockDraft = {
        id: 'mock-uuid-dec',
        total_allotment: 150000,
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Draft Decimal',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        remarks: 'Test remarks decimal',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const countMock = [{ value: 1 }];
      const offsetMock = jest.fn().mockResolvedValue([mockDraft]);
      const limitMock = jest.fn().mockReturnValue({ offset: offsetMock });

      dbMock.select = jest.fn().mockImplementation((arg: { value: unknown } | undefined) => {
        if (arg && arg.value) {
          return {
            from: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(countMock),
            }),
          };
        }
        return {
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: limitMock,
            }),
          }),
        };
      });

      const result = await service.findAllDrafts(1, 10, '1500.00');

      expect(dbMock.select).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('mock-uuid-dec');
    });
  });

  describe('findOneDraft', () => {
    it('should return a single allotment draft', async () => {
      const mockDraft = {
        id: 'mock-uuid',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Draft',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        remarks: 'Test remarks',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
      };

      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockDraft]),
        }),
      });

      const result = await service.findOneDraft('mock-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid');
    });

    it('should throw NotFoundException if allotment draft not found', async () => {
      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findOneDraft('non-existent-id')).rejects.toThrow(
        'Allotment draft with ID non-existent-id not found',
      );
    });
  });

  describe('findOne', () => {
    it('should return a single allotment', async () => {
      const mockAllotment = {
        id: 'mock-uuid',
        tracking_reference: 'EX-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        remarks: 'Test remarks',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        status: AllotmentStatus.DRAFT,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockDetails = [
        {
          id: 'detail-uuid',
          user_id: '00000000-0000-0000-0000-000000000000',
          allotment_id: 'mock-uuid',
          office_id: 'office-uuid',
          office: { id: 'office-uuid', code: '01-001', name: 'Test Office', is_active: true },
          pap_id: 'pap-uuid',
          pap: { id: 'pap-uuid', code: '123', name: 'Test PAP', is_active: true },
          rca_id: 'rca-uuid',
          rca: { id: 'rca-uuid', code: '1-01-01', name: 'Test RCA', is_active: true, allows_sub_object: false },
          rca_sub_object_id: null,
          rca_sub_object: null,
          amount: 50000,
        },
      ];

      // Mock first select for allotment
      dbMock.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockAllotment]),
        }),
      });

      // Mock second select for details
      dbMock.select.mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockDetails),
        }),
      });

      const result = await service.findOne('mock-uuid');

      expect(result).toBeDefined();
      expect(result.id).toBe('mock-uuid');
      expect(result.uacs).toEqual(mockDetails);
    });

    it('should throw NotFoundException if allotment not found', async () => {
      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow('Allotment with ID non-existent-id not found');
    });
  });

  describe('update', () => {
    it('should update an allotment draft successfully', async () => {
      const updateDto = {
        total_allotment: 200000,
        remarks: 'Updated remarks',
      };

      const existingAllotment = {
        id: 'mock-draft-id',
        user_id: '00000000-0000-0000-0000-000000000000',
        total_allotment: 100000,
        remarks: 'Original remarks',
        status: AllotmentStatus.FOR_PROCESSING,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const expectedAllotment = {
        ...existingAllotment,
        total_allotment: updateDto.total_allotment,
        remarks: updateDto.remarks,
        updated_at: new Date(),
      };

      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingAllotment]),
        }),
      });

      dbMock.returning.mockResolvedValue([expectedAllotment]);

      const result = await service.update('mock-draft-id', updateDto);

      expect(dbMock.update).toHaveBeenCalled();

      const setArgs = (dbMock.set.mock.calls as [Partial<NewAllotmentDraft>][])[0][0];
      expect(setArgs).toEqual(
        expect.objectContaining({
          total_allotment: updateDto.total_allotment,
          remarks: updateDto.remarks,
        }),
      );

      expect(result).toEqual(
        expect.objectContaining({
          id: expectedAllotment.id,
          total_allotment: 2000,
        }),
      );
    });

    it('should throw NotFoundException if allotment not found', async () => {
      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.update('non-existent-id', {})).rejects.toThrow(
        'Allotment with ID non-existent-id not found',
      );
    });
  });

  describe('updateStatus', () => {
    it('should update allotment status successfully', async () => {
      const existingAllotment = {
        id: 'mock-uuid',
        tracking_reference: 'EX-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        remarks: 'Test remarks',
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        status: AllotmentStatus.DRAFT,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedAllotment = {
        ...existingAllotment,
        status: AllotmentStatus.APPROVED,
        updated_at: new Date(),
      };

      dbMock.select = jest.fn().mockReturnValueOnce({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingAllotment]),
        }),
      });

      dbMock.returning.mockResolvedValue([updatedAllotment]);

      const result = await service.updateStatus('mock-uuid', AllotmentStatus.APPROVED);

      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: 'mock-uuid',
          status: AllotmentStatus.APPROVED,
        }),
      );
    });

    it('should throw NotFoundException if allotment not found', async () => {
      dbMock.select = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.updateStatus('non-existent-id', AllotmentStatus.APPROVED)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateStatus('non-existent-id', AllotmentStatus.APPROVED)).rejects.toThrow(
        'Allotment with ID non-existent-id not found',
      );
    });
  });
});
