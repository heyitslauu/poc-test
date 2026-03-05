import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { SuccessResponseDto } from '../../common/types/api-response.types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

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

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let service: EmployeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        {
          provide: EmployeesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<EmployeesController>(EmployeesController);
    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an employee and return success response', async () => {
      const createDto: CreateEmployeeDto = {
        user_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'John',
        middle_name: 'Doe',
        last_name: 'Smith',
        extension_name: 'Jr.',
      };

      const expectedEmployee: EmployeeResponseDto = {
        id: 'mock-employee-uuid',
        user_id: createDto.user_id,
        first_name: createDto.first_name,
        middle_name: createDto.middle_name,
        last_name: createDto.last_name,
        extension_name: createDto.extension_name,
      };

      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(expectedEmployee);

      const result = await controller.create(createDto);

      expect(createSpy).toHaveBeenCalledWith(createDto);

      const successResult = result as SuccessResponseDto<EmployeeResponseDto>;
      expect(successResult.data).toEqual(expectedEmployee);
      expect(successResult.message).toBe('Employee created successfully');
    });
  });

  describe('findAll', () => {
    it('should return paginated list of employees', async () => {
      const mockEmployees: EmployeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: '00000000-0000-0000-0000-000000000001',
          first_name: 'John',
          middle_name: 'Doe',
          last_name: 'Smith',
          extension_name: 'Jr.',
        },
        {
          id: 'mock-uuid-2',
          user_id: '00000000-0000-0000-0000-000000000002',
          first_name: 'Jane',
          middle_name: null,
          last_name: 'Doe',
          extension_name: null,
        },
      ];

      const mockServiceResponse = {
        data: mockEmployees,
        totalItems: 2,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery = { page: 1, limit: 10 };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Employees retrieved successfully',
        data: mockEmployees,
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

  describe('findOne', () => {
    it('should return a single employee', async () => {
      const mockEmployee: EmployeeResponseDto = {
        id: 'mock-uuid',
        user_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'John',
        middle_name: 'Doe',
        last_name: 'Smith',
        extension_name: 'Jr.',
      };

      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(mockEmployee);

      const result = await controller.findOne('mock-uuid');

      expect(findOneSpy).toHaveBeenCalledWith('mock-uuid');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Employee retrieved successfully',
        data: mockEmployee,
        meta: {},
      });
    });
  });

  describe('update', () => {
    it('should update an employee and return success response', async () => {
      const updateDto: UpdateEmployeeDto = {
        first_name: 'UpdatedJohn',
        last_name: 'UpdatedSmith',
      };

      const mockEmployee: EmployeeResponseDto = {
        id: 'mock-uuid',
        user_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'UpdatedJohn',
        middle_name: 'Doe',
        last_name: 'UpdatedSmith',
        extension_name: 'Jr.',
      };

      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(mockEmployee);

      const result = await controller.update('mock-uuid', updateDto);

      expect(updateSpy).toHaveBeenCalledWith('mock-uuid', updateDto);

      const successResult = result as SuccessResponseDto<EmployeeResponseDto>;
      expect(successResult.data).toEqual(mockEmployee);
      expect(successResult.message).toBe('Employee updated successfully');
    });
  });

  describe('remove', () => {
    it('should deactivate an employee and return success response', async () => {
      const mockEmployee: EmployeeResponseDto = {
        id: 'mock-uuid',
        user_id: '00000000-0000-0000-0000-000000000000',
        first_name: 'John',
        middle_name: 'Doe',
        last_name: 'Smith',
        extension_name: 'Jr.',
      };

      const removeSpy = jest.spyOn(service, 'remove').mockResolvedValue(mockEmployee);

      const result = await controller.remove('mock-uuid');

      expect(removeSpy).toHaveBeenCalledWith('mock-uuid');

      const successResult = result as SuccessResponseDto<EmployeeResponseDto>;
      expect(successResult.data).toEqual(mockEmployee);
      expect(successResult.message).toBe('Employee deactivated successfully');
    });
  });
});
