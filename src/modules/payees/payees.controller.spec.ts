import { Test, TestingModule } from '@nestjs/testing';
import { PayeesController } from './payees.controller';
import { PayeesService } from './payees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { PayeeResponseDto } from './dto/payee-response.dto';
import { PayeeType } from '../../database/schemas/payees.schema';
import { ApiResponse } from '../../common/utils/api-response.util';
import { HttpStatus } from '@nestjs/common';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { NotFoundException } from '@nestjs/common';

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

describe('PayeesController', () => {
  let controller: PayeesController;
  let service: PayeesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayeesController],
      providers: [
        {
          provide: PayeesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            importEmployeesFromFile: jest.fn(),
            importNonEmployeesFromFile: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PayeesController>(PayeesController);
    service = module.get<PayeesService>(PayeesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new payee and return a success response', async () => {
      const userId = 'some-user-uuid';
      const createPayeeDto: CreatePayeeDto = {
        type: PayeeType.EMPLOYEE,
        employee_id: 'some-employee-uuid',
        bank_account_no: '0987654321',
      };
      const payeeResponse: PayeeResponseDto = {
        id: 'some-uuid',
        user_id: 'some-user-uuid',
        type: PayeeType.EMPLOYEE,
        employee_id: 'some-employee-uuid',
        name: 'Test Payee',
        tin_no: '123-456-789',
        bank_account_no: '0987654321',
      };

      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(payeeResponse);

      const result = await controller.create(userId, createPayeeDto);

      expect(createSpy).toHaveBeenCalledWith(userId, createPayeeDto);
      expect(result).toEqual(ApiResponse.success(payeeResponse, 'Payee created successfully', HttpStatus.CREATED));
    });

    it('should create a CREDITOR payee and return a success response', async () => {
      const userId = 'some-user-uuid';
      const createPayeeDto: CreatePayeeDto = {
        type: PayeeType.CREDITOR,
        tin_no: '987-654-321',
        bank_account_no: '1234567890',
      };
      const payeeResponse: PayeeResponseDto = {
        id: 'some-other-uuid',
        user_id: undefined,
        type: PayeeType.CREDITOR,
        employee_id: undefined,
        name: 'Test Creditor Payee',
        tin_no: '987-654-321',
        bank_account_no: '1234567890',
      };

      const createSpy = jest.spyOn(service, 'create').mockResolvedValue(payeeResponse);

      const result = await controller.create(userId, createPayeeDto);

      expect(createSpy).toHaveBeenCalledWith(userId, createPayeeDto);
      expect(result).toEqual(ApiResponse.success(payeeResponse, 'Payee created successfully', HttpStatus.CREATED));
    });
  });

  describe('findAll', () => {
    it('should return paginated list of payees', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
        {
          id: 'mock-uuid-2',
          user_id: 'user-uuid-2',
          type: PayeeType.CREDITOR,
          name: 'Creditor Two',
          tin_no: '222-222-222',
          bank_account_no: '0987654321',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 2,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10 };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined, undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

    it('should return paginated list of payees with search', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10, search: 'Employee' };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, 'Employee', undefined, undefined, undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

    it('should return paginated list of payees with type filter', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10, type: PayeeType.EMPLOYEE };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined, PayeeType.EMPLOYEE, undefined, undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

    it('should return paginated list of payees with tin_no filter', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10, tin_no: '111-111-111' };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined, undefined, '111-111-111', undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

    it('should return paginated list of payees with search and type filter', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10, search: 'Employee', type: PayeeType.EMPLOYEE };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, 'Employee', PayeeType.EMPLOYEE, undefined, undefined);
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

    it('should return paginated list of payees with bank_account_no filter', async () => {
      const mockPayees: PayeeResponseDto[] = [
        {
          id: 'mock-uuid-1',
          user_id: 'user-uuid-1',
          type: PayeeType.EMPLOYEE,
          name: 'Employee One',
          tin_no: '111-111-111',
          bank_account_no: '1234567890',
        },
      ];

      const mockServiceResponse = {
        data: mockPayees,
        totalItems: 1,
      };

      const findAllSpy = jest.spyOn(service, 'findAll').mockResolvedValue(mockServiceResponse);

      const paginationQuery: PaginationQueryDto = { page: 1, limit: 10, bank_account_no: '1234567890' };
      const result = await controller.findAll(paginationQuery);

      expect(findAllSpy).toHaveBeenCalledWith(1, 10, undefined, undefined, undefined, '1234567890');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payees retrieved successfully',
        data: mockPayees,
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

  describe('findOne', () => {
    it('should return a single payee by ID', async () => {
      const mockPayee: PayeeResponseDto = {
        id: 'mock-uuid',
        user_id: 'user-uuid',
        type: PayeeType.SUPPLIER,
        name: 'Supplier One',
        tin_no: '333-333-333',
        bank_account_no: '1234567890',
      };

      const findOneSpy = jest.spyOn(service, 'findOne').mockResolvedValue(mockPayee);

      const result = await controller.findOne('mock-uuid');

      expect(findOneSpy).toHaveBeenCalledWith('mock-uuid');
      expect(result).toEqual({
        statusCode: 200,
        message: 'Payee retrieved successfully',
        data: mockPayee,
        meta: {},
      });
    });
  });

  describe('update', () => {
    it('should update an existing payee and return success response', async () => {
      const payeeId = 'payee-to-update-uuid';
      const updatePayeeDto: UpdatePayeeDto = {
        name: 'Updated Payee Name',
        tin_no: '111-222-333',
        bank_account_no: '1234567890',
      };
      const updatedPayeeResponse: PayeeResponseDto = {
        id: payeeId,
        user_id: 'some-user-uuid',
        type: PayeeType.EMPLOYEE,
        employee_id: 'some-employee-uuid',
        name: 'Updated Payee Name',
        tin_no: '111-222-333',
        bank_account_no: '1234567890',
      };

      const updateSpy = jest.spyOn(service, 'update').mockResolvedValue(updatedPayeeResponse);

      const result = await controller.update(payeeId, updatePayeeDto);

      expect(updateSpy).toHaveBeenCalledWith(payeeId, updatePayeeDto);
      expect(result).toEqual(ApiResponse.success(updatedPayeeResponse, 'Payee updated successfully', HttpStatus.OK));
    });

    it('should return appropriate response if payee is not found', async () => {
      const payeeId = 'non-existent-payee-uuid';
      const updatePayeeDto: UpdatePayeeDto = {
        name: 'Trying to update',
      };

      const updateSpy = jest
        .spyOn(service, 'update')
        .mockRejectedValue(new NotFoundException(`Payee with ID ${payeeId} not found`));

      await expect(controller.update(payeeId, updatePayeeDto)).rejects.toThrow(NotFoundException);
      expect(updateSpy).toHaveBeenCalledWith(payeeId, updatePayeeDto);
    });
  });

  describe('remove', () => {
    it('should remove a payee and return a success response', async () => {
      const payeeId = 'some-uuid';
      const mockPayee: PayeeResponseDto = {
        id: payeeId,
        user_id: 'user-uuid',
        type: PayeeType.SUPPLIER,
        name: 'Supplier One',
        tin_no: '333-333-333',
        bank_account_no: '1234567890',
      };

      const removeSpy = jest.spyOn(service, 'remove').mockResolvedValue(mockPayee);

      const result = await controller.remove(payeeId);

      expect(removeSpy).toHaveBeenCalledWith(payeeId);
      expect(result).toEqual(ApiResponse.success(mockPayee, 'Payee deleted successfully', HttpStatus.OK));
    });

    it('should throw NotFoundException if payee to remove is not found', async () => {
      const payeeId = 'non-existent-uuid';
      const removeSpy = jest
        .spyOn(service, 'remove')
        .mockRejectedValue(new NotFoundException(`Payee with ID ${payeeId} not found`));

      await expect(controller.remove(payeeId)).rejects.toThrow(NotFoundException);
      expect(removeSpy).toHaveBeenCalledWith(payeeId);
    });
  });
});
