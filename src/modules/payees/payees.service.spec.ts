import { Test, TestingModule } from '@nestjs/testing';
import { PayeesService } from './payees.service';
import { DATABASE_CONNECTION } from '../../config/database.config';
import { UnprocessableEntityException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PayeeType } from '../../database/schemas/payees.schema';
import { FileImportUtil } from '../../common/utils/file-import.util';

jest.mock('../../common/utils/api-response.util', () => ({
  ApiResponse: {
    success: jest.fn((data: unknown, message: string, statusCode: number = 200) => ({ statusCode, message, data })),
    paginatedSuccess: jest.fn(),
    createPaginationMeta: jest.fn(),
    badRequest: jest.fn((msg: string) => ({ message: msg })),
    payloadTooLarge: jest.fn((msg: string) => ({ message: msg })),
  },
}));

jest.mock('../../common/utils/file-import.util');

interface MockQueryResult {
  from: jest.Mock;
  where: jest.Mock;
  limit?: jest.Mock;
  offset?: jest.Mock;
  returning?: jest.Mock;
}

interface MockTransaction {
  select: jest.Mock<MockQueryResult, unknown[]>;
  insert: jest.Mock;
}

interface MockDrizzle {
  transaction: jest.Mock;
  select: jest.Mock<MockQueryResult, unknown[]>;
  insert: jest.Mock;
  delete: jest.Mock;
}

describe('PayeesService', () => {
  let service: PayeesService;
  let dbMock: MockDrizzle;

  beforeEach(async () => {
    const mockSelect = jest.fn((fields?: Record<string, unknown>) => {
      const queryResult: MockQueryResult = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      };

      if (fields && 'value' in fields) {
        queryResult.where.mockResolvedValueOnce([{ value: 0 }]);
      } else {
        queryResult.limit = jest.fn().mockReturnThis();
        queryResult.offset = jest.fn().mockResolvedValue([]);
      }
      return queryResult;
    });

    const mockInsert = jest.fn(() => ({
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([]),
    }));

    const mockDelete = jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValueOnce([]),
    }));

    dbMock = {
      transaction: jest.fn((callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn((fields?: Record<string, unknown>) => {
            const txQueryResult: MockQueryResult = {
              from: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
            };
            if (fields && 'value' in fields) {
              txQueryResult.where.mockResolvedValueOnce([{ value: 0 }]);
            } else {
              txQueryResult.limit = jest.fn().mockReturnThis();
              txQueryResult.offset = jest.fn().mockResolvedValue([]);
            }
            return txQueryResult;
          }),
          insert: jest.fn(() => ({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([]),
          })),
        };
        return callback(txMock);
      }),
      select: mockSelect,
      insert: mockInsert,
      delete: mockDelete,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayeesService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<PayeesService>(PayeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create an EMPLOYEE payee', async () => {
      dbMock.transaction.mockImplementationOnce(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn(() => ({
            from: jest.fn().mockReturnThis(),
            where: jest
              .fn()
              .mockResolvedValueOnce([])
              .mockResolvedValueOnce([{ id: 'some-employee-uuid' }]),
          })),
          insert: jest.fn(() => ({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValueOnce([
              {
                id: 'some-uuid',
                user_id: 'some-user-uuid',
                type: PayeeType.EMPLOYEE,
                employee_id: 'some-employee-uuid',
                name: 'Test Payee',
                tin_no: '123-456-789',
                bank_account_no: '12345',
              },
            ]),
          })),
        };
        return await callback(txMock);
      });

      const userId = 'some-user-uuid';
      const createPayeeDto = {
        employee_id: 'some-employee-uuid',
        type: PayeeType.EMPLOYEE,
        bank_account_no: '12345',
      };

      const result = await service.create(userId, createPayeeDto);

      expect(result).toEqual({
        id: 'some-uuid',
        user_id: 'some-user-uuid',
        type: PayeeType.EMPLOYEE,
        employee_id: 'some-employee-uuid',
        name: 'Test Payee',
        tin_no: '123-456-789',
        bank_account_no: '12345',
      });
    });

    it('should throw UnprocessableEntityException if employee_id is missing for EMPLOYEE type', async () => {
      const userId = 'some-user-uuid';
      const createPayeeDto = {
        type: PayeeType.EMPLOYEE,
      };

      await expect(service.create(userId, createPayeeDto)).rejects.toThrow(UnprocessableEntityException);
      await expect(service.create(userId, createPayeeDto)).rejects.toThrow(
        'Employee ID is required for payee type EMPLOYEE',
      );
    });

    it('should throw UnprocessableEntityException if employee does not exist for EMPLOYEE type', async () => {
      dbMock.transaction.mockImplementationOnce(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn(() => ({
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([]),
          })),
          insert: jest.fn(() => ({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([]),
          })),
        };
        return await callback(txMock);
      });

      const userId = 'some-user-uuid';
      const createPayeeDto = {
        employee_id: 'non-existent-employee-uuid',
        type: PayeeType.EMPLOYEE,
      };

      await expect(service.create(userId, createPayeeDto)).rejects.toThrow(UnprocessableEntityException);
      await expect(service.create(userId, createPayeeDto)).rejects.toThrow(
        `Employee with ID ${createPayeeDto.employee_id} not found`,
      );
    });

    it('should successfully create a CREDITOR payee', async () => {
      dbMock.transaction.mockImplementationOnce(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn(() => ({
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValueOnce([]),
          })),
          insert: jest.fn(() => ({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValueOnce([
              {
                id: 'some-uuid-creditor',
                user_id: 'some-user-uuid-creditor',
                type: PayeeType.CREDITOR,
                name: 'Creditor Payee',
                tin_no: '987-654-321',
                employee_id: null,
                bank_account_no: '54321',
              },
            ]),
          })),
        };
        return await callback(txMock);
      });

      const userId = 'some-user-uuid-creditor';
      const createPayeeDto = {
        type: PayeeType.CREDITOR,
        name: 'Creditor Payee',
        tin_no: '987-654-321',
        bank_account_no: '54321',
      };

      const result = await service.create(userId, createPayeeDto);

      expect(result).toEqual({
        id: 'some-uuid-creditor',
        user_id: 'some-user-uuid-creditor',
        type: PayeeType.CREDITOR,
        name: 'Creditor Payee',
        tin_no: '987-654-321',
        employee_id: null,
        bank_account_no: '54321',
      });
    });

    it('should throw UnprocessableEntityException if name is missing for non-EMPLOYEE type', async () => {
      const userId = 'some-user-uuid';
      const createPayeeDto = {
        type: PayeeType.CREDITOR,
      };

      await expect(service.create(userId, createPayeeDto)).rejects.toThrow(UnprocessableEntityException);
      await expect(service.create(userId, createPayeeDto)).rejects.toThrow('Name is required for payee type CREDITOR');
    });

    it('should allow a user to create multiple payees (like collections)', async () => {
      const userId = 'user-uuid';
      const createPayeeDto = {
        type: PayeeType.SUPPLIER,
        name: 'Supplier Payee',
      };

      let callCount = 0;
      dbMock.transaction.mockImplementation(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        callCount += 1;
        const id = `payee-id-${String(callCount)}`;
        const txMock: MockTransaction = {
          select: jest.fn(() => ({
            from: jest.fn().mockReturnThis(),
            where: jest.fn().mockResolvedValue([]),
          })),
          insert: jest.fn(() => ({
            values: jest.fn().mockReturnThis(),
            returning: jest.fn().mockResolvedValue([
              {
                id,
                user_id: userId,
                type: createPayeeDto.type,
                name: callCount === 1 ? createPayeeDto.name : 'Second Supplier',
                employee_id: null,
                tin_no: null,
                bank_account_no: null,
              },
            ]),
          })),
        };
        return await callback(txMock);
      });

      const result1 = await service.create(userId, createPayeeDto);
      const result2 = await service.create(userId, { ...createPayeeDto, name: 'Second Supplier' });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      expect(result1.id).toBe('payee-id-1');
      expect(result2.id).toBe('payee-id-2');
    });
  });

  describe('findAll', () => {
    it('should return paginated payee data', async () => {
      const mockPayees = [
        { id: 'payee-1', name: 'Payee One', tin_no: '111', type: PayeeType.EMPLOYEE },
        { id: 'payee-2', name: 'Payee Two', tin_no: '222', type: PayeeType.CREDITOR },
      ];
      const totalItems = 2;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });

    it('should return paginated payee data with search term', async () => {
      const mockPayees = [{ id: 'payee-1', name: 'Search Payee One', tin_no: '111', type: PayeeType.EMPLOYEE }];
      const totalItems = 1;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10, 'Search');

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });

    it('should return paginated payee data with type filter', async () => {
      const mockPayees = [{ id: 'payee-1', name: 'Payee One', tin_no: '111', type: PayeeType.EMPLOYEE }];
      const totalItems = 1;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10, undefined, PayeeType.EMPLOYEE);

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });

    it('should return paginated payee data with tin_no filter', async () => {
      const mockPayees = [{ id: 'payee-1', name: 'Payee One', tin_no: '111-111-111', type: PayeeType.EMPLOYEE }];
      const totalItems = 1;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10, undefined, undefined, '111-111-111');

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });

    it('should return paginated payee data with bank_account_no filter', async () => {
      const mockPayees = [
        {
          id: 'payee-1',
          name: 'Payee One',
          tin_no: '111-111-111',
          type: PayeeType.EMPLOYEE,
          bank_account_no: '1234567890',
        },
      ];
      const totalItems = 1;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10, undefined, undefined, undefined, '1234567890');

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });

    it('should return paginated payee data with search and type filter', async () => {
      const mockPayees = [{ id: 'payee-1', name: 'Search Employee One', tin_no: '111', type: PayeeType.EMPLOYEE }];
      const totalItems = 1;

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      dbMock.select.mockImplementationOnce((fields?: Record<string, unknown>) => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
        };
        if (fields && 'value' in fields) {
          queryResult.where.mockResolvedValueOnce([{ value: totalItems }]);
        } else {
          queryResult.limit = jest.fn().mockReturnThis();
          queryResult.offset = jest.fn().mockResolvedValueOnce(mockPayees);
        }
        return queryResult;
      });

      const result = await service.findAll(1, 10, 'Search', PayeeType.EMPLOYEE);

      expect(result).toEqual({
        data: mockPayees,
        totalItems: totalItems,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single payee', async () => {
      const mockPayee = {
        id: 'payee-id',
        name: 'Single Payee',
        tin_no: '123',
        type: PayeeType.EMPLOYEE,
        bank_account_no: '12345',
      };

      dbMock.select.mockImplementationOnce(() => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([mockPayee]),
        };
        return queryResult;
      });

      const result = await service.findOne('payee-id');

      expect(result).toEqual(mockPayee);
    });

    it('should throw NotFoundException if payee not found', async () => {
      dbMock.select.mockImplementationOnce(() => {
        const queryResult: MockQueryResult = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValueOnce([]),
        };
        return queryResult;
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow('Payee with ID non-existent-id not found');
    });
  });

  describe('remove', () => {
    it('should remove a payee and return it', async () => {
      const mockPayee = {
        id: 'payee-id',
        name: 'Single Payee',
        tin_no: '123',
        type: PayeeType.EMPLOYEE,
        bank_account_no: '12345',
      };

      dbMock.delete.mockImplementationOnce(() => ({
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([mockPayee]),
      }));

      const result = await service.remove('payee-id');
      expect(result).toEqual(mockPayee);
    });

    it('should throw NotFoundException if payee to remove is not found', async () => {
      dbMock.delete.mockImplementationOnce(() => ({
        where: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([]),
      }));

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('importEmployeesFromFile', () => {
    const mockFile = {
      buffer: Buffer.from(''),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 100,
    } as Express.Multer.File;

    beforeEach(() => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReset();
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReset();
      (FileImportUtil.mapRowToDto as jest.Mock).mockReset();
    });

    it('should throw BadRequestException when file cannot be parsed', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue(null);
      await expect(service.importEmployeesFromFile('user-id', mockFile)).rejects.toThrow(BadRequestException);
      await expect(service.importEmployeesFromFile('user-id', mockFile)).rejects.toThrow(
        'Unable to parse the file or file is empty',
      );
    });

    it('should throw BadRequestException when required columns are missing', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({ data: [], headers: {} });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue({
        message: 'Missing required columns: employee_number',
      });
      await expect(service.importEmployeesFromFile('user-id', mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should return failed_rows when employee_number is not found in employees table', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({
        data: [{ employee_number: 'EMP-999' }],
        headers: { employee_number: 'employee_number', tin_no: 'tin_no', bank_account_no: 'bank_account_no' },
      });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue(null);
      (FileImportUtil.mapRowToDto as jest.Mock).mockReturnValue({
        employee_number: 'EMP-999',
        tin_no: '',
        bank_account_no: '',
      });

      dbMock.select.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([]),
      }));

      const result = await service.importEmployeesFromFile('user-id', mockFile);

      expect(result.successful_rows).toBe(0);
      expect(result.failed_rows).toBe(1);
      expect(result.failed_rows_details[0].errors[0]).toContain(
        "Employee with number 'EMP-999' not found or is inactive",
      );
    });

    it('should import employee payees successfully when employee_number is found', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({
        data: [{ employee_number: 'EMP-001', tin_no: '123', bank_account_no: '456' }],
        headers: { employee_number: 'employee_number', tin_no: 'tin_no', bank_account_no: 'bank_account_no' },
      });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue(null);
      (FileImportUtil.mapRowToDto as jest.Mock).mockReturnValue({
        employee_number: 'EMP-001',
        tin_no: '123',
        bank_account_no: '456',
      });

      dbMock.select.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([{ id: 'emp-uuid', employee_number: 'EMP-001', is_active: true }]),
      }));

      dbMock.transaction.mockImplementationOnce(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn() as jest.Mock<MockQueryResult, unknown[]>,
          insert: jest.fn(() => ({ values: jest.fn().mockResolvedValue([]) })),
        };
        return callback(txMock);
      });

      const result = await service.importEmployeesFromFile('user-id', mockFile);

      expect(result.successful_rows).toBe(1);
      expect(result.failed_rows).toBe(0);
      expect(result.message).toContain('Successfully imported 1 employee payees');
    });
  });

  describe('importNonEmployeesFromFile', () => {
    const mockFile = {
      buffer: Buffer.from(''),
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 100,
    } as Express.Multer.File;

    beforeEach(() => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReset();
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReset();
      (FileImportUtil.mapRowToDto as jest.Mock).mockReset();
    });

    it('should throw BadRequestException when file cannot be parsed', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue(null);
      await expect(service.importNonEmployeesFromFile('user-id', mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when required columns are missing', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({ data: [], headers: {} });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue({
        message: 'Missing required columns: type, name',
      });
      await expect(service.importNonEmployeesFromFile('user-id', mockFile)).rejects.toThrow(BadRequestException);
    });

    it('should return failed_rows when type is EMPLOYEE', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({
        data: [{ type: 'EMPLOYEE', name: 'Test' }],
        headers: { type: 'type', name: 'name', tin_no: 'tin_no', bank_account_no: 'bank_account_no' },
      });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue(null);
      (FileImportUtil.mapRowToDto as jest.Mock).mockReturnValue({
        type: 'EMPLOYEE',
        name: 'Test',
        tin_no: '',
        bank_account_no: '',
      });

      const result = await service.importNonEmployeesFromFile('user-id', mockFile);

      expect(result.successful_rows).toBe(0);
      expect(result.failed_rows).toBe(1);
      expect(result.failed_rows_details[0].errors).toEqual(
        expect.arrayContaining([expect.stringContaining('CREDITOR')]),
      );
    });

    it('should import CREDITOR and SUPPLIER rows successfully', async () => {
      (FileImportUtil.parseExcelFile as jest.Mock).mockReturnValue({
        data: [
          { type: 'CREDITOR', name: 'Cred Corp' },
          { type: 'SUPPLIER', name: 'Supp Inc' },
        ],
        headers: { type: 'type', name: 'name', tin_no: 'tin_no', bank_account_no: 'bank_account_no' },
      });
      (FileImportUtil.validateRequiredColumns as jest.Mock).mockReturnValue(null);
      (FileImportUtil.mapRowToDto as jest.Mock)
        .mockReturnValueOnce({ type: 'CREDITOR', name: 'Cred Corp', tin_no: '', bank_account_no: '' })
        .mockReturnValueOnce({ type: 'SUPPLIER', name: 'Supp Inc', tin_no: '', bank_account_no: '' });

      dbMock.transaction.mockImplementationOnce(async (callback: (tx: MockTransaction) => Promise<unknown>) => {
        const txMock: MockTransaction = {
          select: jest.fn() as jest.Mock<MockQueryResult, unknown[]>,
          insert: jest.fn(() => ({ values: jest.fn().mockResolvedValue([]) })),
        };
        return callback(txMock);
      });

      const result = await service.importNonEmployeesFromFile('user-id', mockFile);

      expect(result.successful_rows).toBe(2);
      expect(result.failed_rows).toBe(0);
      expect(result.message).toContain('Successfully imported 2 payees');
    });
  });
});
