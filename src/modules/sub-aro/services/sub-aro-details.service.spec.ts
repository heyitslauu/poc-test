import { Test, TestingModule } from '@nestjs/testing';
import { SubAroDetailsService } from './sub-aro-details.service';
import { DATABASE_CONNECTION } from '../../../config/database.config';
import { CreateSubAroDetailsDto } from '../dto/create-sub-aro-details.dto';
import { UpdateSubAroDetailsDto } from '../dto/update-sub-aro-details.dto';
import { SubAroDetailsPaginationQueryDto } from '../dto/sub-aro-details-pagination.dto';
import { NotFoundException } from '@nestjs/common';
import { subAroDetails } from '../../../database/schemas/sub-aro-details.schema';
import * as schema from '../../../database/schemas';

describe('SubAroDetailsService', () => {
  let service: SubAroDetailsService;
  let dbMock: {
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    select: jest.Mock;
    from: jest.Mock;
    where: jest.Mock;
    limit: jest.Mock;
    offset: jest.Mock;
    orderBy: jest.Mock;
    values: jest.Mock;
    set: jest.Mock;
    returning: jest.Mock;
  };

  beforeEach(async () => {
    const returningMock = jest.fn();
    const valuesMock = jest.fn().mockReturnValue({ returning: returningMock });
    const setMock = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: returningMock }) });

    // Create a mock that can be chained
    const createChainableMock = () => ({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
          offset: jest.fn().mockResolvedValue([]),
          orderBy: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              offset: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
        orderBy: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            offset: jest.fn().mockResolvedValue([]),
          }),
        }),
        limit: jest.fn().mockReturnValue({
          offset: jest.fn().mockResolvedValue([]),
        }),
      }),
    });

    const selectMock = jest.fn().mockImplementation(createChainableMock);

    dbMock = {
      insert: jest.fn().mockReturnValue({ values: valuesMock }),
      update: jest.fn().mockReturnValue({ set: setMock }),
      delete: jest.fn().mockReturnValue({ where: jest.fn() }),
      select: selectMock,
      from: jest.fn(),
      where: jest.fn(),
      limit: jest.fn(),
      offset: jest.fn(),
      orderBy: jest.fn(),
      values: valuesMock,
      set: setMock,
      returning: returningMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubAroDetailsService,
        {
          provide: DATABASE_CONNECTION,
          useValue: dbMock,
        },
      ],
    }).compile();

    service = module.get<SubAroDetailsService>(SubAroDetailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto: CreateSubAroDetailsDto = {
      sub_aro_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
      amount: 50000.0,
    };

    it('should create a sub-aro detail successfully', async () => {
      const mockSubAroDetail = {
        id: 'mock-uuid',
        sub_aro_id: createDto.sub_aro_id,
        uacs_id: createDto.uacs_id,
        amount: createDto.amount.toString(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Mock all validation queries to return existing records, and duplicate check to return empty
      dbMock.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table === subAroDetails) {
            // This is the duplicate check - return empty
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]),
              }),
            };
          }
          // All other checks return existing records
          return {
            where: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
          };
        }),
      }));

      dbMock.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockSubAroDetail]),
        }),
      });

      const result = await service.create(createDto);

      expect(result).toEqual(expect.any(Object));
      expect(dbMock.insert).toHaveBeenCalledWith(subAroDetails);
    });

    it('should throw NotFoundException if sub-aro does not exist', async () => {
      dbMock.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table === schema.subAros) {
            return {
              where: jest.fn().mockResolvedValue([]),
            };
          }
          return {
            where: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
          };
        }),
      }));

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if allotment details do not exist', async () => {
      dbMock.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table === schema.allotmentDetails) {
            return {
              where: jest.fn().mockResolvedValue([]),
            };
          }
          return {
            where: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
          };
        }),
      }));

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if office does not exist', async () => {
      dbMock.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table === schema.fieldOffices) {
            return {
              where: jest.fn().mockResolvedValue([]),
            };
          }
          return {
            where: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
          };
        }),
      }));

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const subAroId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    const paginationQuery: SubAroDetailsPaginationQueryDto = {
      page: 1,
      limit: 10,
      uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
    };

    it('should return paginated sub-aro details', async () => {
      const mockData = [
        {
          id: 'mock-uuid-1',
          sub_aro_id: subAroId,
          uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
          amount: '50000.00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      dbMock.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockData),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 1 }]),
          }),
        });

      const result = await service.findAll(subAroId, paginationQuery);

      expect(result).toEqual({ data: mockData, totalItems: 1 });
    });

    it('should return all sub-aro details without filters', async () => {
      const mockData = [
        {
          id: 'mock-uuid-1',
          sub_aro_id: subAroId,
          uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
          office_id: 'c2ggde11-9e0d-4efa-dd8f-8dd9df382c33',
          amount: '50000.00',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      dbMock.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              orderBy: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  offset: jest.fn().mockResolvedValue(mockData),
                }),
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ value: 1 }]),
          }),
        });

      const result = await service.findAll(subAroId, {});

      expect(result).toEqual({ data: mockData, totalItems: 1 });
    });
  });

  describe('findOne', () => {
    it('should return a sub-aro detail by id', async () => {
      const mockDetail = {
        id: 'mock-uuid',
        sub_aro_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        office_id: 'c2ggde11-9e0d-4efa-dd8f-8dd9df382c33',
        amount: '50000.00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([mockDetail]),
        }),
      });

      const result = await service.findOne('mock-uuid');

      expect(result).toEqual(mockDetail);
    });

    it('should throw NotFoundException if sub-aro detail not found', async () => {
      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateSubAroDetailsDto = {
      amount: 75000.0,
    };

    it('should update a sub-aro detail successfully', async () => {
      const existingDetail = {
        id: 'mock-uuid',
        sub_aro_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
        office_id: 'c2ggde11-9e0d-4efa-dd8f-8dd9df382c33',
        amount: '50000.00',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedDetail = { ...existingDetail, amount: '75000.00' };

      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([existingDetail]),
        }),
      });

      dbMock.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([updatedDetail]),
          }),
        }),
      });

      const result = await service.update('mock-uuid', updateDto);

      expect(result).toEqual(updatedDetail);
    });

    it('should throw NotFoundException if sub-aro detail not found', async () => {
      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should validate foreign keys when updating', async () => {
      const updateDtoWithInvalidSubAro: UpdateSubAroDetailsDto = {
        sub_aro_id: 'invalid-sub-aro-id',
      };

      dbMock.select.mockImplementation(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table === subAroDetails) {
            return {
              where: jest.fn().mockResolvedValue([
                {
                  id: 'mock-uuid',
                  sub_aro_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                  uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
                  office_id: 'c2ggde11-9e0d-4efa-dd8f-8dd9df382c33',
                  amount: '50000.00',
                },
              ]),
            };
          }
          if (table === schema.subAros) {
            return {
              where: jest.fn().mockResolvedValue([]),
            };
          }
          return {
            where: jest.fn().mockResolvedValue([{ id: 'existing-id' }]),
          };
        }),
      }));

      await expect(service.update('mock-uuid', updateDtoWithInvalidSubAro)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a sub-aro detail successfully', async () => {
      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([
            {
              id: 'mock-uuid',
              sub_aro_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
              uacs_id: 'b1ffcd00-9d0c-4ef9-cc7e-7cc9ce381b22',
              office_id: 'c2ggde11-9e0d-4efa-dd8f-8dd9df382c33',
              amount: '50000.00',
            },
          ]),
        }),
      });

      dbMock.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      await expect(service.delete('mock-uuid')).resolves.toBeUndefined();
    });

    it('should throw NotFoundException if sub-aro detail not found', async () => {
      dbMock.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.delete('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
