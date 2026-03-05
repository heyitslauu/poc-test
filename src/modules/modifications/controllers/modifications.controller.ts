import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ModificationsService } from '../services/modifications.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common';
import { CreateModificationDto } from '../dto/create-modification.dto';
import { UpdateModificationDto } from '../dto/update-modification.dto';
import { UpdateModificationStatusDto } from '../dto/update-modification-status.dto';
import { ModificationResponseDto } from '../dto/modification-response.dto';
import { ModificationsPaginationQueryDto } from '../dto/modifications-pagination.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('modifications')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('modifications')
export class ModificationsController {
  constructor(private readonly modificationsService: ModificationsService) {}

  @Post()
  @ApiCustomResponse(ModificationResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Modification created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createModificationDto: CreateModificationDto,
  ): Promise<ApiResponseDto<ModificationResponseDto>> {
    const modification = await this.modificationsService.create(userId, createModificationDto);
    return ApiResponse.success<ModificationResponseDto>(modification, 'Modification created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve modifications list with pagination' })
  @ApiPaginatedResponse(ModificationResponseDto, { description: 'Modifications retrieved successfully' })
  async findAll(@Query() paginationQuery: ModificationsPaginationQueryDto) {
    const { data, totalItems } = await this.modificationsService.findAll(paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Modifications retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single modification by ID' })
  @ApiCustomResponse(ModificationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Modification retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<ModificationResponseDto>> {
    const modification = await this.modificationsService.findOne(id);
    return ApiResponse.success<ModificationResponseDto>(modification, 'Modification retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a modification by ID' })
  @ApiCustomResponse(ModificationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Modification updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateModificationDto: UpdateModificationDto,
  ): Promise<ApiResponseDto<ModificationResponseDto>> {
    const modification: ModificationResponseDto = await this.modificationsService.update(id, updateModificationDto);
    return ApiResponse.success<ModificationResponseDto>(modification, 'Modification updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a modification by ID' })
  @ApiCustomResponse(ModificationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Modification status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateModificationStatusDto: UpdateModificationStatusDto,
  ): Promise<ApiResponseDto<ModificationResponseDto>> {
    const modification = await this.modificationsService.updateStatus(id, updateModificationStatusDto.status);
    return ApiResponse.success<ModificationResponseDto>(modification, 'Modification status updated successfully');
  }
}
