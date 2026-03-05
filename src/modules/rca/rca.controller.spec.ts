import { Test, TestingModule } from '@nestjs/testing';
import { RcaController } from './rca.controller';
import { RcaService } from './rca.service';
import { HttpStatus } from '@nestjs/common';
import { CreateRcaDto } from './dto/create-rca.dto';
import { UpdateRcaDto } from './dto/update-rca.dto';
import { CreateSubObjectDto } from './dto/create-sub-object.dto';
import { UpdateSubObjectDto } from './dto/update-sub-object.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

describe('RcaController', () => {
  let controller: RcaController;

  const mockRca = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    updateStatus: jest.fn(),
  };

  const mockSubObject = {
    create: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  };

  const mockSuccessResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'Success',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
    },
    data: mockRca,
  };

  const mockPaginatedResponse = {
    success: true,
    statusCode: HttpStatus.OK,
    message: 'RCAs retrieved successfully',
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
    data: [mockRca],
  };

  const mockErrorResponse = {
    success: false,
    statusCode: HttpStatus.NOT_FOUND,
    message: 'RCA not found',
    meta: {
      traceId: 'test-trace-id',
      timestamp: '2026-01-13T10:00:00.000Z',
    },
  };

  const mockRcaService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createSubObject: jest.fn(),
    findAllSubObjects: jest.fn(),
    findOneSubObject: jest.fn(),
    updateSubObject: jest.fn(),
    removeSubObject: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RcaController],
      providers: [
        {
          provide: RcaService,
          useValue: mockRcaService,
        },
      ],
    }).compile();

    controller = module.get<RcaController>(RcaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an RCA successfully', async () => {
      const createRcaDto: CreateRcaDto = {
        code: '5-02-01-010',
        name: 'Salaries and Wages - Regular',
        is_active: true,
        allows_sub_object: false,
      };

      const createResponse = {
        ...mockSuccessResponse,
        statusCode: HttpStatus.CREATED,
        message: 'RCA created successfully',
      };

      mockRcaService.create.mockResolvedValue(createResponse);

      const result = await controller.create(createRcaDto);

      expect(result).toEqual(createResponse);
      expect(mockRcaService.create).toHaveBeenCalledWith(createRcaDto);
      expect(mockRcaService.create).toHaveBeenCalledTimes(1);
    });

    it('should return conflict when RCA code already exists', async () => {
      const createRcaDto: CreateRcaDto = {
        code: '5-02-01-010',
        name: 'Salaries and Wages - Regular',
        is_active: true,
        allows_sub_object: false,
      };

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: "RCA with code '5-02-01-010' already exists",
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.create.mockResolvedValue(conflictResponse);

      const result = await controller.create(createRcaDto);

      expect(result).toEqual(conflictResponse);
      expect(mockRcaService.create).toHaveBeenCalledWith(createRcaDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated RCAs', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      mockRcaService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockRcaService.findAll).toHaveBeenCalledWith(1, 10, undefined);
      expect(mockRcaService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return paginated RCAs with search filter', async () => {
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: 'Salaries',
      };

      mockRcaService.findAll.mockResolvedValue(mockPaginatedResponse);

      const result = await controller.findAll(paginationQuery);

      expect(result).toEqual(mockPaginatedResponse);
      expect(mockRcaService.findAll).toHaveBeenCalledWith(1, 10, 'Salaries');
    });

    it('should use default pagination values', async () => {
      const paginationQuery: PaginationQueryDto = {};

      mockRcaService.findAll.mockResolvedValue(mockPaginatedResponse);

      await controller.findAll(paginationQuery);

      expect(mockRcaService.findAll).toHaveBeenCalledWith(undefined, undefined, undefined);
    });
  });

  describe('findOne', () => {
    it('should return an RCA by ID', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';

      mockRcaService.findOne.mockResolvedValue(mockSuccessResponse);

      const result = await controller.findOne(rcaId);

      expect(result).toEqual(mockSuccessResponse);
      expect(mockRcaService.findOne).toHaveBeenCalledWith(rcaId);
      expect(mockRcaService.findOne).toHaveBeenCalledTimes(1);
    });

    it('should return not found when RCA does not exist', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';

      mockRcaService.findOne.mockResolvedValue(mockErrorResponse);

      const result = await controller.findOne(rcaId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockRcaService.findOne).toHaveBeenCalledWith(rcaId);
    });
  });

  describe('update', () => {
    it('should update an RCA', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const updateRcaDto: UpdateRcaDto = {
        name: 'Updated RCA Name',
      };

      const updateResponse = {
        ...mockSuccessResponse,
        message: 'RCA updated successfully',
      };

      mockRcaService.update.mockResolvedValue(updateResponse);

      const result = await controller.update(rcaId, updateRcaDto);

      expect(result).toEqual(updateResponse);
      expect(mockRcaService.update).toHaveBeenCalledWith(rcaId, updateRcaDto);
      expect(mockRcaService.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove', () => {
    it('should deactivate an RCA', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';

      const deactivateResponse = {
        ...mockSuccessResponse,
        message: 'RCA deactivated successfully',
        data: { ...mockRca, is_active: false },
      };

      mockRcaService.remove.mockResolvedValue(deactivateResponse);

      const result = await controller.remove(rcaId);

      expect(result).toEqual(deactivateResponse);
      expect(mockRcaService.remove).toHaveBeenCalledWith(rcaId);
      expect(mockRcaService.remove).toHaveBeenCalledTimes(1);
    });

    it('should return not found when RCA does not exist', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';

      mockRcaService.remove.mockResolvedValue(mockErrorResponse);

      const result = await controller.remove(rcaId);

      expect(result).toEqual(mockErrorResponse);
      expect(mockRcaService.remove).toHaveBeenCalledWith(rcaId);
    });

    it('should return conflict when RCA is already deactivated', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'RCA is already deactivated',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.remove.mockResolvedValue(conflictResponse);

      const result = await controller.remove(rcaId);

      expect(result).toEqual(conflictResponse);
      expect(mockRcaService.remove).toHaveBeenCalledWith(rcaId);
    });
  });

  describe('createSubObject', () => {
    it('should create a sub object successfully', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const createSubObjectDto: CreateSubObjectDto = {
        code: '01',
        name: 'Training Expenses',
        is_active: true,
      };

      const createResponse = {
        success: true,
        statusCode: HttpStatus.CREATED,
        message: 'Sub object created successfully',
        meta: mockSuccessResponse.meta,
        data: mockSubObject,
      };

      mockRcaService.createSubObject.mockResolvedValue(createResponse);

      const result = await controller.createSubObject(rcaId, createSubObjectDto);

      expect(result).toEqual(createResponse);
      expect(mockRcaService.createSubObject).toHaveBeenCalledWith(rcaId, createSubObjectDto);
      expect(mockRcaService.createSubObject).toHaveBeenCalledTimes(1);
    });

    it('should return not found when parent RCA does not exist', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const createSubObjectDto: CreateSubObjectDto = {
        code: '01',
        name: 'Training Expenses',
        is_active: true,
      };

      const notFoundResponse = {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Parent RCA not found',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.createSubObject.mockResolvedValue(notFoundResponse);

      const result = await controller.createSubObject(rcaId, createSubObjectDto);

      expect(result).toEqual(notFoundResponse);
      expect(mockRcaService.createSubObject).toHaveBeenCalledWith(rcaId, createSubObjectDto);
    });

    it('should return bad request when parent RCA does not allow sub objects', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const createSubObjectDto: CreateSubObjectDto = {
        code: '01',
        name: 'Training Expenses',
        is_active: true,
      };

      const badRequestResponse = {
        success: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Parent RCA does not allow sub objects',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.createSubObject.mockResolvedValue(badRequestResponse);

      const result = await controller.createSubObject(rcaId, createSubObjectDto);

      expect(result).toEqual(badRequestResponse);
      expect(mockRcaService.createSubObject).toHaveBeenCalledWith(rcaId, createSubObjectDto);
    });
  });

  describe('findAllSubObjects', () => {
    it('should return paginated sub objects', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
      };

      const subObjectsPaginatedResponse = {
        ...mockPaginatedResponse,
        message: 'Sub objects retrieved successfully',
        data: [mockSubObject],
      };

      mockRcaService.findAllSubObjects.mockResolvedValue(subObjectsPaginatedResponse);

      const result = await controller.findAllSubObjects(rcaId, paginationQuery);

      expect(result).toEqual(subObjectsPaginatedResponse);
      expect(mockRcaService.findAllSubObjects).toHaveBeenCalledWith(rcaId, 1, 10, undefined);
      expect(mockRcaService.findAllSubObjects).toHaveBeenCalledTimes(1);
    });

    it('should return paginated sub objects with search filter', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const paginationQuery: PaginationQueryDto = {
        page: 1,
        limit: 10,
        search: 'Training',
      };

      const subObjectsPaginatedResponse = {
        ...mockPaginatedResponse,
        message: 'Sub objects retrieved successfully',
        data: [mockSubObject],
      };

      mockRcaService.findAllSubObjects.mockResolvedValue(subObjectsPaginatedResponse);

      const result = await controller.findAllSubObjects(rcaId, paginationQuery);

      expect(result).toEqual(subObjectsPaginatedResponse);
      expect(mockRcaService.findAllSubObjects).toHaveBeenCalledWith(rcaId, 1, 10, 'Training');
    });
  });

  describe('findOneSubObject', () => {
    it('should return a sub object by ID', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';

      const subObjectResponse = {
        ...mockSuccessResponse,
        data: mockSubObject,
      };

      mockRcaService.findOneSubObject.mockResolvedValue(subObjectResponse);

      const result = await controller.findOneSubObject(rcaId, subObjectId);

      expect(result).toEqual(subObjectResponse);
      expect(mockRcaService.findOneSubObject).toHaveBeenCalledWith(rcaId, subObjectId);
      expect(mockRcaService.findOneSubObject).toHaveBeenCalledTimes(1);
    });

    it('should return not found when sub object does not exist', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';

      const notFoundResponse = {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Sub object not found',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.findOneSubObject.mockResolvedValue(notFoundResponse);

      const result = await controller.findOneSubObject(rcaId, subObjectId);

      expect(result).toEqual(notFoundResponse);
      expect(mockRcaService.findOneSubObject).toHaveBeenCalledWith(rcaId, subObjectId);
    });
  });

  describe('updateSubObject', () => {
    it('should update a sub object', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';
      const updateSubObjectDto: UpdateSubObjectDto = {
        name: 'Updated Sub Object Name',
      };

      const updateResponse = {
        ...mockSuccessResponse,
        message: 'Sub object updated successfully',
        data: mockSubObject,
      };

      mockRcaService.updateSubObject.mockResolvedValue(updateResponse);

      const result = await controller.updateSubObject(rcaId, subObjectId, updateSubObjectDto);

      expect(result).toEqual(updateResponse);
      expect(mockRcaService.updateSubObject).toHaveBeenCalledWith(rcaId, subObjectId, updateSubObjectDto);
      expect(mockRcaService.updateSubObject).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeSubObject', () => {
    it('should deactivate a sub object', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';

      const deactivateResponse = {
        ...mockSuccessResponse,
        message: 'Sub object deactivated successfully',
        data: { ...mockSubObject, is_active: false },
      };

      mockRcaService.removeSubObject.mockResolvedValue(deactivateResponse);

      const result = await controller.removeSubObject(rcaId, subObjectId);

      expect(result).toEqual(deactivateResponse);
      expect(mockRcaService.removeSubObject).toHaveBeenCalledWith(rcaId, subObjectId);
      expect(mockRcaService.removeSubObject).toHaveBeenCalledTimes(1);
    });

    it('should return not found when sub object does not exist', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';

      const notFoundResponse = {
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Sub object not found',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.removeSubObject.mockResolvedValue(notFoundResponse);

      const result = await controller.removeSubObject(rcaId, subObjectId);

      expect(result).toEqual(notFoundResponse);
      expect(mockRcaService.removeSubObject).toHaveBeenCalledWith(rcaId, subObjectId);
    });

    it('should return conflict when sub object is already deactivated', async () => {
      const rcaId = '123e4567-e89b-12d3-a456-426614174000';
      const subObjectId = '987e6543-e89b-12d3-a456-426614174000';

      const conflictResponse = {
        success: false,
        statusCode: HttpStatus.CONFLICT,
        message: 'Sub object is already deactivated',
        meta: mockSuccessResponse.meta,
      };

      mockRcaService.removeSubObject.mockResolvedValue(conflictResponse);

      const result = await controller.removeSubObject(rcaId, subObjectId);

      expect(result).toEqual(conflictResponse);
      expect(mockRcaService.removeSubObject).toHaveBeenCalledWith(rcaId, subObjectId);
    });
  });
});
