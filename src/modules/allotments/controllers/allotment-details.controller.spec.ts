import { Test, TestingModule } from '@nestjs/testing';
import { AllotmentDetailsController } from './allotment-details.controller';
import { AllotmentDetailsService } from '../services/allotment-details.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CreateAllotmentDetailBodyDto } from '../dto/create-allotment-detail-body.dto';
import { AllotmentDetailResponseDto } from '../dto/allotment-detail-response.dto';
import { AllotmentDetailsPaginationQueryDto } from '../dto/allotment-details-pagination.dto';
import { CreateAllotmentDetailDto } from '../dto/create-allotment-detail.dto';
import { HttpStatus } from '@nestjs/common';

jest.mock('../../../common/decorators/api-response.decorator', () => ({
  ApiCustomResponse: () => jest.fn(),
  ApiPaginatedResponse: () => jest.fn(),
}));

jest.mock('../../../common/utils/api-response.util', () => ({
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

import { UpdateAllotmentDetailDto } from '../dto/update-allotment-detail.dto';

describe('AllotmentDetailsController', () => {
  let controller: AllotmentDetailsController;

  const mockAllotmentDetailsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllotmentDetailsController],
      providers: [
        {
          provide: AllotmentDetailsService,
          useValue: mockAllotmentDetailsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AllotmentDetailsController>(AllotmentDetailsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an allotment detail', async () => {
      const allotmentId = 'allotment-uuid';
      const userId = 'user-uuid';
      const bodyDto: CreateAllotmentDetailBodyDto = {
        office_id: 'office-uuid',
        pap_id: 'pap-uuid',
        rca_id: 'rca-uuid',
        amount: 1000,
      };

      const expectedCreateDto: CreateAllotmentDetailDto = {
        allotment_id: allotmentId,
        office_id: bodyDto.office_id,
        pap_id: bodyDto.pap_id,
        rca_id: bodyDto.rca_id,
        rca_sub_object_id: undefined,
        amount: bodyDto.amount,
      };

      const resultDto: AllotmentDetailResponseDto = {
        id: 'detail-uuid',
        user_id: userId,
        allotment_id: expectedCreateDto.allotment_id,
        office_id: expectedCreateDto.office_id,
        pap_id: expectedCreateDto.pap_id,
        rca_id: expectedCreateDto.rca_id,
        rca_sub_object_id: expectedCreateDto.rca_sub_object_id,
        amount: expectedCreateDto.amount,
      };

      mockAllotmentDetailsService.create.mockResolvedValue(resultDto);

      const result = await controller.create(allotmentId, userId, bodyDto);

      expect(mockAllotmentDetailsService.create).toHaveBeenCalledWith(userId, expectedCreateDto);
      expect(result).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Allotment detail created successfully',
        data: resultDto,
        meta: {},
      });
    });
  });

  describe('update', () => {
    it('should update an allotment detail', async () => {
      const id = 'detail-uuid';
      const updateDto: UpdateAllotmentDetailDto = {
        amount: 2000,
      };
      const resultDto: AllotmentDetailResponseDto = {
        id,
        user_id: 'user-uuid',
        allotment_id: 'allotment-uuid',
        office_id: 'office-uuid',
        pap_id: 'pap-uuid',
        rca_id: 'rca-uuid',
        amount: 2000,
      };

      mockAllotmentDetailsService.update.mockResolvedValue(resultDto);

      const result = await controller.update(id, updateDto);

      expect(mockAllotmentDetailsService.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Allotment detail updated successfully',
        data: resultDto,
        meta: {},
      });
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of allotment details', async () => {
      const allotmentId = 'allotment-uuid';
      const paginationQuery: AllotmentDetailsPaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const data: AllotmentDetailResponseDto[] = [
        {
          id: 'detail-uuid',
          user_id: 'user-uuid',
          allotment_id: allotmentId,
          office_id: 'office-uuid',
          pap_id: 'pap-uuid',
          rca_id: 'rca-uuid',
          amount: 1000,
        },
      ];
      const totalItems = 1;

      mockAllotmentDetailsService.findAll.mockResolvedValue({ data, totalItems });

      const result = await controller.findAll(allotmentId, paginationQuery);

      expect(mockAllotmentDetailsService.findAll).toHaveBeenCalledWith(allotmentId, paginationQuery);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Allotment details retrieved successfully',
        data,
        meta: {
          pagination: {
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            totalItems: 1,
            hasNextPage: false,
            hasPrevPage: false,
          },
        },
      });
    });
  });

  describe('delete', () => {
    it('should delete an allotment detail', async () => {
      const id = 'detail-uuid';

      mockAllotmentDetailsService.delete.mockResolvedValue(undefined);

      await controller.delete(id);
      expect(mockAllotmentDetailsService.delete).toHaveBeenCalledWith(id);
    });
  });
});
