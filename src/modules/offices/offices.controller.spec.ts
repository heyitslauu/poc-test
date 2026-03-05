import { Test, TestingModule } from '@nestjs/testing';
import { OfficesController } from './offices.controller';
import { OfficesService } from './offices.service';
import { HttpStatus } from '@nestjs/common';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

describe('OfficesController', () => {
  let controller: OfficesController;

  const mockOffice = {
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
    data: mockOffice,
  };

  const mockPaginatedResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'Offices retrieved successfully',
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
    data: [mockOffice],
  };

  const mockErrorResponse = {
    success: false,
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Office not found',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
    },
  };

  const mockOfficesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OfficesController],
      providers: [
        {
          provide: OfficesService,
          useValue: mockOfficesService,
        },
      ],
    }).compile();

    controller = module.get<OfficesController>(OfficesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an office successfully', async () => {
      const createOfficeDto: CreateOfficeDto = {
        code: 'OFF-001',
        name: 'Main Office',
        is_active: true,
      };

      const createResponse = {
        ...mockSuccessResponse,
        statusCode: HttpStatus.CREATED,
        message: 'Office created successfully',
      };

      mockOfficesService.create.mockResolvedValue(createResponse);

      const result = await controller.create(createOfficeDto);

      expect(result).toEqual(createResponse);
      expect(mockOfficesService.create).toHaveBeenCalledWith(createOfficeDto);
      expect(mockOfficesService.create).toHaveBeenCalledTimes(1);
    });

    it('should return conflict when office code already exists', async () => {
      const createOfficeDto: CreateOfficeDto = {
        code: 'OFF-001',
        name: 'Main Office',
        is_active: true,
      };

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: "Office with code 'OFF-001' already exists",
        meta: mockSuccessResponse.meta,
      };

      mockOfficesService.create.mockResolvedValue(conflictResponse);

      const result = await controller.create(createOfficeDto);

      expect(result).toEqual(conflictResponse);
      expect(mockOfficesService.create).toHaveBeenCalledWith(createOfficeDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated offices', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      mockOfficesService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockOfficesService.findAll).toHaveBeenCalledWith(1, 10, undefined);
      expect(mockOfficesService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return paginated offices with search filter', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: 'Main',
      };

      mockOfficesService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockOfficesService.findAll).toHaveBeenCalledWith(1, 10, 'Main');
    });

    it('should use default pagination values', async () => {
      const paginationQuery: PaginationQueryDto = {};

      mockOfficesService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(paginationQuery);

      expect(mockOfficesService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should return an office by ID', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';

      mockOfficesService.findOne.mockResolvedValue(mockSuccessResponse);

      const result = await controller.findOne(officeId);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockOfficesService.findOne).toHaveBeenCalledWith(officeId);
      expect(mockOfficesService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return not found when office does not exist', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';

      mockOfficesService.findOne.mockResolvedValue(mockErrorResponse);

      const result = await controller.findOne(officeId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockOfficesService.findOne).toHaveBeenCalledWith(officeId);
    });
  });

  describe('update', () => {
    it('should update an office', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';
      const updateOfficeDto: UpdateOfficeDto = {
        name: 'Updated Office',
      };

      const updateResponse = {
        ...mockSuccessResponse,
        message: 'Office updated successfully',
      };

      mockOfficesService.update.mockResolvedValue(updateResponse);

      const result = await controller.update(officeId, updateOfficeDto);

      expect(result).toEqual(updateResponse);
      expect(mockOfficesService.update).toHaveBeenCalledWith(officeId, updateOfficeDto);
      expect(mockOfficesService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should deactivate an office', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';

      const deactivateResponse = {
        ...mockSuccessResponse,
        message: 'Office deactivated successfully',
        data: { ...mockOffice, is_active: false },
      };

      mockOfficesService.remove.mockResolvedValue(deactivateResponse);

      const result = await controller.remove(officeId);

      expect(result).toEqual(deactivateResponse);
      expect(mockOfficesService.remove).toHaveBeenCalledWith(officeId);
      expect(mockOfficesService.remove).toHaveBeenCalledTimes(1);
    });

    it('should return not found when office does not exist', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';

      mockOfficesService.remove.mockResolvedValue(mockErrorResponse);

      const result = await controller.remove(officeId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockOfficesService.remove).toHaveBeenCalledWith(officeId);
    });

    it('should return conflict when office is already deactivated', async () => {
      const officeId = '123e4567-e89b-12d3-a456-426614174000';

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Office is already deactivated',
        meta: mockSuccessResponse.meta,
      };

      mockOfficesService.remove.mockResolvedValue(conflictResponse);

      const result = await controller.remove(officeId);

      expect(result).toEqual(conflictResponse);
      expect(mockOfficesService.remove).toHaveBeenCalledWith(officeId);
    });
  });
});
