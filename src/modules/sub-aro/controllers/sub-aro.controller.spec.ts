import { Test, TestingModule } from '@nestjs/testing';
import { SubAroController } from './sub-aro.controller';
import { SubAroService } from '../services/sub-aro.service';
import { CreateSubAroDto } from '../dto/create-sub-aro.dto';
import { UpdateSubAroDto } from '../dto/update-sub-aro.dto';
import { UpdateSubAroStatusDto } from '../dto/update-sub-aro-status.dto';
import { SubAroPaginationQueryDto } from '../dto/sub-aro-pagination.dto';
import { SubAroResponseDto } from '../dto/sub-aro-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubAroStatus } from '../../../database/schemas/sub-aro.schema';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

describe('SubAroController', () => {
  let controller: SubAroController;
  let service: {
    create: jest.MockedFunction<SubAroService['create']>;
    findAll: jest.MockedFunction<SubAroService['findAll']>;
    findOne: jest.MockedFunction<SubAroService['findOne']>;
    update: jest.MockedFunction<SubAroService['update']>;
    updateStatus: jest.MockedFunction<SubAroService['updateStatus']>;
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubAroController],
      providers: [
        {
          provide: SubAroService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SubAroController>(SubAroController);
    service = module.get(SubAroService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a sub-aro and return success response', async () => {
      const userId = 'user123';
      const createDto: CreateSubAroDto = {
        /* mock dto */
      } as CreateSubAroDto;
      const responseDto: SubAroResponseDto = {
        /* mock response */
      } as SubAroResponseDto;
      service.create.mockResolvedValue(responseDto);

      const result = await controller.create(userId, createDto);

      expect(service.create).toHaveBeenCalledWith(userId, createDto);
      expect(result).toEqual(
        expect.objectContaining({
          data: responseDto,
          message: 'Sub-aro created successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated sub-aros', async () => {
      const paginationQuery: SubAroPaginationQueryDto = { page: 1, limit: 10 };
      const data = [
        {
          /* mock data */
        },
      ] as SubAroResponseDto[];
      const totalItems = 1;
      service.findAll.mockResolvedValue({ data, totalItems });

      const result = await controller.findAll(paginationQuery);

      expect(service.findAll).toHaveBeenCalledWith(paginationQuery);

      expect(result).toEqual(
        expect.objectContaining({
          data,
          message: 'Sub-aros retrieved successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a single sub-aro', async () => {
      const id = '123';
      const responseDto: SubAroResponseDto = {
        /* mock response */
      } as SubAroResponseDto;
      service.findOne.mockResolvedValue(responseDto);

      const result = await controller.findOne(id);

      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(result).toEqual(
        expect.objectContaining({
          data: responseDto,
          message: 'Sub-aro retrieved successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('update', () => {
    it('should update a sub-aro and return success response', async () => {
      const id = '123';
      const updateDto: UpdateSubAroDto = {
        /* mock dto */
      } as UpdateSubAroDto;
      const responseDto: SubAroResponseDto = {
        /* mock response */
      } as SubAroResponseDto;
      service.update.mockResolvedValue(responseDto);

      const result = await controller.update(id, updateDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDto);
      expect(result).toEqual(
        expect.objectContaining({
          data: responseDto,
          message: 'Sub-aro updated successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });

  describe('updateStatus', () => {
    it('should update the status of a sub-aro and return success response', async () => {
      const id = '123';
      const updateStatusDto: UpdateSubAroStatusDto = {
        status: SubAroStatus.FOR_TRIAGE,
      };
      const responseDto: SubAroResponseDto = {
        /* mock response */
      } as SubAroResponseDto;
      service.updateStatus.mockResolvedValue(responseDto);

      const result = await controller.updateStatus(id, updateStatusDto);

      expect(service.updateStatus).toHaveBeenCalledWith(id, updateStatusDto.status);
      expect(result).toEqual(
        expect.objectContaining({
          data: responseDto,
          message: 'Sub-aro status updated successfully',
          success: true,
          statusCode: 200,
        }),
      );
    });
  });
});
