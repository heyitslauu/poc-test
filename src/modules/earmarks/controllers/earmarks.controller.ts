import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { EarmarksService } from '../services/earmarks.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';
import { CreateEarmarkDto } from '../dto/create-earmark.dto';
import { UpdateEarmarkDto } from '../dto/update-earmark.dto';
import { UpdateEarmarkStatusDto } from '../dto/update-earmark-status.dto';
import { EarmarkResponseDto } from '../dto/earmark-response.dto';
import { EarmarksPaginationQueryDto } from '../dto/earmarks-pagination-query.dto';
import { ApiResponse } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';

@ApiTags('earmarks')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('earmarks')
export class EarmarksController {
  constructor(private readonly earmarksService: EarmarksService) {}

  @Post()
  @ApiCustomResponse(EarmarkResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Earmark created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createEarmarkDto: CreateEarmarkDto,
  ): Promise<ApiResponseDto<EarmarkResponseDto>> {
    const earmark = await this.earmarksService.create(userId, createEarmarkDto);
    return ApiResponse.success<EarmarkResponseDto>(earmark, 'Earmark created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve Earmark list with pagination' })
  @ApiPaginatedResponse(EarmarkResponseDto, { description: 'Earmarks retrieved successfully' })
  async findAll(@Query() paginationQuery: EarmarksPaginationQueryDto) {
    const { data, totalItems } = await this.earmarksService.findAll(paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Earmarks retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single Earmark by ID' })
  @ApiCustomResponse(EarmarkResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Earmark retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<EarmarkResponseDto>> {
    const earmark = await this.earmarksService.findOne(id);
    return ApiResponse.success<EarmarkResponseDto>(earmark, 'Earmark retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an Earmark by ID' })
  @ApiCustomResponse(EarmarkResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Earmark updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEarmarkDto: UpdateEarmarkDto,
  ): Promise<ApiResponseDto<EarmarkResponseDto>> {
    const earmark = await this.earmarksService.update(id, updateEarmarkDto);
    return ApiResponse.success<EarmarkResponseDto>(earmark, 'Earmark updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of an Earmark by ID' })
  @ApiCustomResponse(EarmarkResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Earmark status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateEarmarkStatusDto: UpdateEarmarkStatusDto,
  ): Promise<ApiResponseDto<EarmarkResponseDto>> {
    const earmark = await this.earmarksService.updateStatus(id, updateEarmarkStatusDto.status);
    return ApiResponse.success<EarmarkResponseDto>(earmark, 'Earmark status updated successfully');
  }
}
