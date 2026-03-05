import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { SubAroDetailsController } from './sub-aro-details.controller';
import { SubAroDetailsService } from '../services/sub-aro-details.service';
import { CreateSubAroDetailsDto } from '../dto/create-sub-aro-details.dto';
import { UpdateSubAroDetailsDto } from '../dto/update-sub-aro-details.dto';
import { SubAroDetailsPaginationQueryDto } from '../dto/sub-aro-details-pagination.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

describe('SubAroDetailsController', () => {
  let controller: SubAroDetailsController;
  let service: {
    create: jest.MockedFunction<SubAroDetailsService['create']>;
    findAll: jest.MockedFunction<SubAroDetailsService['findAll']>;
    findOne: jest.MockedFunction<SubAroDetailsService['findOne']>;
    update: jest.MockedFunction<SubAroDetailsService['update']>;
    remove: jest.MockedFunction<SubAroDetailsService['remove']>;
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubAroDetailsController],
      providers: [{ provide: SubAroDetailsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubAroDetailsController>(SubAroDetailsController);
    service = module.get(SubAroDetailsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sub-aro detail', async () => {
      const createDto: CreateSubAroDetailsDto = {
        sub_aro_id: 'test-sub-aro-id',
        uacs_id: 'test-uacs-id',
        // Add other required fields
      } as CreateSubAroDetailsDto;
      const mockResult = {
        id: 'test-id',
        // Add other response properties
      };

      service.create.mockResolvedValue(mockResult);

      const result = await controller.create(createDto);

      expect(service.create.mock.calls).toEqual([[createDto]]);
      expect(result).toEqual(
        expect.objectContaining({
          data: mockResult,
          message: 'Sub-aro detail created successfully',
          success: true,
          statusCode: HttpStatus.CREATED,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated sub-aro details', async () => {
      const paginationQuery: SubAroDetailsPaginationQueryDto = {
        page: 1,
        limit: 10,
        // Add other query params if needed
      };
      const mockData = [{ id: 'test-id-1' }, { id: 'test-id-2' }];
      const totalItems = 2;

      service.findAll.mockResolvedValue({ data: mockData, totalItems });

      const result = await controller.findAll(paginationQuery);

      expect(service.findAll.mock.calls).toEqual([[paginationQuery]]);
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockData);
      expect(result.message).toBe('Sub-aro details retrieved successfully');
      expect(result.meta).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return a single sub-aro detail', async () => {
      const id = 'test-id';
      const mockResult = { id };

      service.findOne.mockResolvedValue(mockResult);

      const result = await controller.findOne(id);

      expect(service.findOne.mock.calls).toEqual([[id]]);
      expect(result).toEqual(
        expect.objectContaining({
          data: mockResult,
          message: 'Sub-aro detail retrieved successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a sub-aro detail', async () => {
      const id = 'test-id';
      const updateDto: UpdateSubAroDetailsDto = {
        // Add mock properties
      } as UpdateSubAroDetailsDto;
      const mockResult = { id };

      service.update.mockResolvedValue(mockResult);

      const result = await controller.update(id, updateDto);

      expect(service.update.mock.calls).toEqual([[id, updateDto]]);
      expect(result).toEqual(
        expect.objectContaining({
          data: mockResult,
          message: 'Sub-aro detail updated successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a sub-aro detail', async () => {
      const id = 'test-id';

      service.remove.mockResolvedValue(undefined); // eslint-disable-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access

      await controller.remove(id); // eslint-disable-line @typescript-eslint/no-unsafe-call

      expect(service.remove.mock.calls[0][0]).toBe(id); // eslint-disable-line @typescript-eslint/no-unsafe-member-access
    });
  });
});
