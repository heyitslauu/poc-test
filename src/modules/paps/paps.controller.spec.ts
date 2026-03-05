import { Test, TestingModule } from '@nestjs/testing';
import { PapsController } from './paps.controller';
import { PapsService } from './paps.service';
import { HttpStatus } from '@nestjs/common';
import { CreatePapDto } from './dto/create-pap.dto';
import { UpdatePapDto } from './dto/update-pap.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

describe('PapsController', () => {
  let controller: PapsController;

  const mockPap = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockSuccessResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'Success',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
    },
    data: mockPap,
  };

  const mockPaginatedResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'PAPs retrieved successfully',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
      pagination: {
        currentPage: 1,
        totalPages: 1,
        limit: 10,
        totalItems: 1,
        hasNextPage: false,
        hasPrevPage: false,
      },
    },
    data: [mockPap],
  };

  const mockErrorResponse = {
    success: false,
    statusCode: HttpStatus.NOT_FOUND,
    message: 'PAP not found',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
    },
  };

  const mockPapsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PapsController],
      providers: [
        {
          provide: PapsService,
          useValue: mockPapsService,
        },
      ],
    }).compile();

    controller = module.get<PapsController>(PapsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a PAP successfully', async () => {
      const createPapDto: CreatePapDto = {
        code: '200000100001000',
        name: 'Information and Communication Technology Management',
        is_active: true,
      };

      const createResponse = {
        ...mockSuccessResponse,
        statusCode: HttpStatus.CREATED,
        message: 'PAP created successfully',
      };

      mockPapsService.create.mockResolvedValue(createResponse);

      const result = await controller.create(createPapDto);

      expect(result).toEqual(createResponse);
      expect(mockPapsService.create).toHaveBeenCalledWith(createPapDto);
      expect(mockPapsService.create).toHaveBeenCalledTimes(1);
    });

    it('should return conflict when PAP code already exists', async () => {
      const createPapDto: CreatePapDto = {
        code: '200000100001000',
        name: 'Information and Communication Technology Management',
        is_active: true,
      };

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: "PAP with code '200000100001000' already exists",
        meta: mockSuccessResponse.meta,
      };

      mockPapsService.create.mockResolvedValue(conflictResponse);

      const result = await controller.create(createPapDto);

      expect(result).toEqual(conflictResponse);
      expect(mockPapsService.create).toHaveBeenCalledWith(createPapDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated PAPs', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      mockPapsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockPapsService.findAll).toHaveBeenCalledWith(1, 10, undefined);
      expect(mockPapsService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return paginated PAPs with search filter', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: 'Technology',
      };

      mockPapsService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockPapsService.findAll).toHaveBeenCalledWith(1, 10, 'Technology');
    });

    it('should use default pagination values', async () => {
      const paginationQuery: PaginationQueryDto = {};

      mockPapsService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(paginationQuery);

      expect(mockPapsService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should return a PAP by ID', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';

      mockPapsService.findOne.mockResolvedValue(mockSuccessResponse);

      const result = await controller.findOne(papId);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockPapsService.findOne).toHaveBeenCalledWith(papId);
      expect(mockPapsService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return not found when PAP does not exist', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';

      mockPapsService.findOne.mockResolvedValue(mockErrorResponse);

      const result = await controller.findOne(papId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPapsService.findOne).toHaveBeenCalledWith(papId);
    });
  });

  describe('update', () => {
    it('should update a PAP', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';
      const updatePapDto: UpdatePapDto = {
        name: 'Updated PAP Name',
      };

      const updateResponse = {
        ...mockSuccessResponse,
        message: 'PAP updated successfully',
      };

      mockPapsService.update.mockResolvedValue(updateResponse);

      const result = await controller.update(papId, updatePapDto);

      expect(result).toEqual(updateResponse);
      expect(mockPapsService.update).toHaveBeenCalledWith(papId, updatePapDto);
      expect(mockPapsService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should deactivate a PAP', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';

      const deactivateResponse = {
        ...mockSuccessResponse,
        message: 'PAP deactivated successfully',
        data: { ...mockPap, is_active: false },
      };

      mockPapsService.remove.mockResolvedValue(deactivateResponse);

      const result = await controller.remove(papId);

      expect(result).toEqual(deactivateResponse);
      expect(mockPapsService.remove).toHaveBeenCalledWith(papId);
      expect(mockPapsService.remove).toHaveBeenCalledTimes(1);
    });

    it('should return not found when PAP does not exist', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';

      mockPapsService.remove.mockResolvedValue(mockErrorResponse);

      const result = await controller.remove(papId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockPapsService.remove).toHaveBeenCalledWith(papId);
    });

    it('should return conflict when PAP is already deactivated', async () => {
      const papId = '123e4567-e89b-12d3-a456-426614174000';

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'PAP is already deactivated',
        meta: mockSuccessResponse.meta,
      };

      mockPapsService.remove.mockResolvedValue(conflictResponse);

      const result = await controller.remove(papId);

      expect(result).toEqual(conflictResponse);
      expect(mockPapsService.remove).toHaveBeenCalledWith(papId);
    });
  });
});
