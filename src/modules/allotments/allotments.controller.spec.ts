import { Test, TestingModule } from '@nestjs/testing';
import { AllotmentsController } from './allotments.controller';
import { AllotmentsService } from './allotments.service';
import { CreateAllotmentDto } from './dto/create-allotment.dto';
import { UpdateAllotmentStatusDto } from './dto/update-allotment-status.dto';
import {
  AllotmentStatus,
  FundCluster,
  AppropriationType,
  BfarsBudgetType,
  AllotmentType,
} from '../../database/schemas';
import { SuccessResponseDto } from '../../common/types/api-response.types';
import { AllotmentResponseDto } from './dto/allotment-response.dto';
import { AllotmentDraftResponseDto } from './dto/allotment-draft-response.dto';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';

jest.mock('../../common/decorators/api-response.decorator', () => ({
  ApiCustomResponse: () => jest.fn(),
  ApiPaginatedResponse: () => jest.fn(),
}));

jest.mock('../../common/utils/api-response.util', () => ({
  ApiResponse: {
    success: jest.fn((data: unknown, message: string, statusCode: number = 200) => ({
      statusCode,
      message,
      data,
      meta: {},
    })),
    paginatedSuccess: jest.fn((data: unknown[], pagination: unknown, message: string) => ({
      statusCode: 200,
      message,
      data,
      meta: { pagination },
    })),
    createPaginationMeta: jest.fn((page: number, totalPages: number, limit: number, totalItems: number) => ({
      currentPage: page,
      totalPages,
      limit,
      totalItems,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })),
  },
}));

describe('AllotmentsController', () => {
  let controller: AllotmentsController;
  let service: AllotmentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllotmentsController],
      providers: [
        {
          provide: AllotmentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findAllDrafts: jest.fn(),
            findOne: jest.fn(),
            findOneDraft: jest.fn(),
            submitDraft: jest.fn(),
            updateStatus: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AllotmentsController>(AllotmentsController);
    service = module.get<AllotmentsService>(AllotmentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an allotment and return success response', async () => {
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

      const expectedAllotment: AllotmentResponseDto = {
        id: 'mock-uuid',
        allotment_code: createDto.allotment_code,
        tracking_reference: 'EX-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: createDto.particulars,
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: createDto.total_allotment,
        date: new Date('2025-01-01'),
        status: AllotmentStatus.FOR_PROCESSING,
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
        remarks: 'Test remarks',
      };

      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(expectedAllotment);

      const result = await controller.create('mock-user-uuid', createDto);

      expect(createSpy).toHaveBeenCalledWith('mock-user-uuid', createDto);

      const successResult = result as SuccessResponseDto<AllotmentResponseDto>;
      expect(successResult.data).toEqual(expectedAllotment);
      expect(successResult.message).toBe('Allotment created and submitted successfully');
    });
  });

  describe('findAll', () => {
    it('should return paginated list of allotments', async () => {
      const mockAllotments: AllotmentResponseDto[] = [
        {
          id: 'mock-uuid-1',
          allotment_code: 'AC-2025-01-ABC12345',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Allotment 1',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 100000,
          tracking_reference: 'EX-2025-01-ABC12345',
          date: new Date('2025-01-01'),
          status: AllotmentStatus.DRAFT,
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date(),
          updated_at: new Date(),
          remarks: 'Test remarks 1',
        },
        {
          id: 'mock-uuid-2',
          allotment_code: 'AC-2025-01-XYZ67890',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Allotment 2',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 200000,
          tracking_reference: 'EX-2025-01-XYZ67890',
          date: new Date('2025-01-02'),
          status: AllotmentStatus.DRAFT,
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date(),
          updated_at: new Date(),
          remarks: 'Test remarks 2',
        },
      ];

      const mockServiceResponse = {
        data: mockAllotments,
        totalItems: 2,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery = { page: 1, limit: 10 };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined, {
        date: undefined,
        fund_cluster: undefined,
        appropriation_type: undefined,
        bfars_budget_type: undefined,
        allotment_type: undefined,
        status: undefined,
      });
      expect(result).toEqual({
        statusCode: 200,
        message: 'Allotments retrieved successfully',
        data: mockAllotments,
        meta: {
          pagination: {
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            totalItems: 2,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    });
  });

  describe('findAllDrafts', () => {
    it('should return paginated list of allotment drafts', async () => {
      const mockDrafts: AllotmentDraftResponseDto[] = [
        {
          id: 'mock-uuid-1',
          allotment_code: 'AC-2025-01-ABC12345',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Draft 1',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 100000,
          date: new Date('2025-01-01'),
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date(),
          updated_at: new Date(),
          remarks: 'Test remarks 1',
        },
        {
          id: 'mock-uuid-2',
          allotment_code: 'AC-2025-01-XYZ67890',
          fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
          particulars: 'Test Draft 2',
          appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
          bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
          allotment_type: AllotmentType.DIRECT_RELEASE,
          total_allotment: 200000,
          date: new Date('2025-01-02'),
          user_id: '00000000-0000-0000-0000-000000000000',
          created_at: new Date(),
          updated_at: new Date(),
          remarks: 'Test remarks 2',
        },
      ];

      const mockServiceResponse = {
        data: mockDrafts,
        totalItems: 2,
      };

      const findAllDraftsSpy = jest.spyOn(service, 'findAllDrafts').mockResolvedValue(mockServiceResponse);

      const paginationQuery = { page: 1, limit: 10 };
      const result = await controller.findAllDrafts(paginationQuery);

      expect(findAllDraftsSpy).toHaveBeenCalledWith(1, 10, undefined, {
        date: undefined,
        fund_cluster: undefined,
        appropriation_type: undefined,
        bfars_budget_type: undefined,
        allotment_type: undefined,
      });
      expect(result).toEqual({
        statusCode: 200,
        message: 'Allotment drafts retrieved successfully',
        data: mockDrafts,
        meta: {
          pagination: {
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            totalItems: 2,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    });
  });

  describe('findOneDraft', () => {
    it('should return a single allotment draft', async () => {
      const mockDraft: AllotmentDraftResponseDto = {
        id: 'mock-uuid',
        allotment_code: 'AC-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Draft',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        date: new Date('2025-01-01'),
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
        remarks: 'Test remarks',
      };

      const findOneDraftSpy = jest.spyOn(service, 'findOneDraft').mockResolvedValue(mockDraft);

      const result = await controller.findOneDraft('mock-uuid');

      expect(findOneDraftSpy).toHaveBeenCalledWith('mock-uuid');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Allotment draft retrieved successfully',
        data: mockDraft,
        meta: {},
      });
    });
  });

  describe('findOne', () => {
    it('should return a single allotment', async () => {
      const mockAllotment: AllotmentResponseDto = {
        id: 'mock-uuid',
        allotment_code: 'AC-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        tracking_reference: 'EX-2025-01-ABC12345',
        date: new Date('2025-01-01'),
        status: AllotmentStatus.DRAFT,
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
        remarks: 'Test remarks',
      };

      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(mockAllotment);

      const result = await controller.findOne('mock-uuid');

      expect(findOneSpy).toHaveBeenCalledWith('mock-uuid');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Allotment retrieved successfully',
        data: mockAllotment,
        meta: {},
      });
    });
  });

  describe('updateStatus', () => {
    it('should update allotment status and return success response', async () => {
      const updateStatusDto: UpdateAllotmentStatusDto = {
        status: AllotmentStatus.APPROVED,
      };

      const mockAllotment: AllotmentResponseDto = {
        id: 'mock-uuid',
        allotment_code: 'AC-2025-01-ABC12345',
        fund_cluster: FundCluster.REGULAR_AGENCY_FUND,
        particulars: 'Test Allotment',
        appropriation_type: AppropriationType.CURRENT_APPROPRIATION,
        bfars_budget_type: BfarsBudgetType.AGENCY_SPECIFIC_BUDGET,
        allotment_type: AllotmentType.DIRECT_RELEASE,
        total_allotment: 100000,
        tracking_reference: 'EX-2025-01-ABC12345',
        date: new Date('2025-01-01'),
        status: AllotmentStatus.APPROVED,
        user_id: '00000000-0000-0000-0000-000000000000',
        created_at: new Date(),
        updated_at: new Date(),
        remarks: 'Test remarks',
      };

      const updateStatusSpy = jest.spyOn(service, 'updateStatus').mockResolvedValue(mockAllotment);

      const result = await controller.updateStatus('mock-uuid', updateStatusDto);

      expect(updateStatusSpy).toHaveBeenCalledWith('mock-uuid', AllotmentStatus.APPROVED);

      const successResult = result as SuccessResponseDto<AllotmentResponseDto>;
      expect(successResult.data).toEqual(mockAllotment);
      expect(successResult.message).toBe('Allotment status updated successfully');
    });
  });
});
