import {
  Controller,
  Post,
  Get,
  Body,
  HttpStatus,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { EarmarkDetailsService } from '../services/earmark-details.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateEarmarkDetailDto } from '../dto/create-earmark-detail.dto';
import { CreateEarmarkDetailBodyDto } from '../dto/create-earmark-detail-body.dto';
import { EarmarkDetailResponseDto } from '../dto/earmark-detail-response.dto';
import { EarmarkDetailsPaginationQueryDto } from '../dto/earmark-details-pagination-query.dto';
import { UpdateEarmarkDetailDto } from '../dto/update-earmark-detail.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '../../../modules/auth/decorators';

@ApiTags('earmark-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('earmarks/:earmarkId/details')
export class EarmarkDetailsController {
  constructor(private readonly earmarkDetailsService: EarmarkDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create earmark detail' })
  @ApiParam({ name: 'earmarkId', description: 'Earmark ID' })
  @ApiCustomResponse(EarmarkDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Earmark detail created successfully',
  })
  async create(
    @Param('earmarkId') earmarkId: string,
    @CurrentUser('userId') userId: string,
    @Body() createEarmarkDetailBodyDto: CreateEarmarkDetailBodyDto,
  ): Promise<ApiResponseDto<EarmarkDetailResponseDto>> {
    const createEarmarkDetailDto: CreateEarmarkDetailDto = {
      earmark_id: earmarkId,
      allotment_details_id: createEarmarkDetailBodyDto.allotment_details_id,
      amount: createEarmarkDetailBodyDto.amount,
      user_id: userId,
    };
    const earmarkDetail = await this.earmarkDetailsService.create(createEarmarkDetailDto);
    return ApiResponse.success<EarmarkDetailResponseDto>(
      earmarkDetail,
      'Earmark detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve earmark details list with pagination and filters' })
  @ApiParam({ name: 'earmarkId', description: 'Earmark ID' })
  @ApiPaginatedResponse(EarmarkDetailResponseDto, { description: 'Earmark details retrieved successfully' })
  async findAll(@Param('earmarkId') earmarkId: string, @Query() paginationQuery: EarmarkDetailsPaginationQueryDto) {
    const { data, totalItems } = await this.earmarkDetailsService.findAll(earmarkId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Earmark details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single earmark detail by ID' })
  @ApiParam({ name: 'earmarkId', description: 'Earmark ID' })
  @ApiParam({ name: 'id', description: 'Earmark detail ID' })
  @ApiCustomResponse(EarmarkDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Earmark detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<EarmarkDetailResponseDto>> {
    const earmarkDetail = await this.earmarkDetailsService.findOne(id);
    return ApiResponse.success<EarmarkDetailResponseDto>(earmarkDetail, 'Earmark detail retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an earmark detail by ID' })
  @ApiParam({ name: 'earmarkId', description: 'Earmark ID' })
  @ApiParam({ name: 'id', description: 'Earmark detail ID' })
  @ApiCustomResponse(EarmarkDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Earmark detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEarmarkDetailDto: UpdateEarmarkDetailDto,
  ): Promise<ApiResponseDto<EarmarkDetailResponseDto>> {
    const earmarkDetail = await this.earmarkDetailsService.update(id, updateEarmarkDetailDto);
    return ApiResponse.success<EarmarkDetailResponseDto>(earmarkDetail, 'Earmark detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an earmark detail by ID' })
  @ApiParam({ name: 'earmarkId', description: 'Earmark ID' })
  @ApiParam({ name: 'id', description: 'Earmark detail ID' })
  @ApiNoContentResponse({
    description: 'Earmark detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.earmarkDetailsService.delete(id);
  }
}
