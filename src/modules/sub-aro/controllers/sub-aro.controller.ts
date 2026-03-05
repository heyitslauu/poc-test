import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { SubAroService } from '../services/sub-aro.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateSubAroDto } from '../dto/create-sub-aro.dto';
import { SubAroResponseDto } from '../dto/sub-aro-response.dto';
import { SubAroPaginationQueryDto } from '../dto/sub-aro-pagination.dto';
import { UpdateSubAroDto } from '../dto/update-sub-aro.dto';
import { UpdateSubAroStatusDto } from '../dto/update-sub-aro-status.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('sub-aro')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('sub-aro')
export class SubAroController {
  constructor(private readonly subAroService: SubAroService) {}

  @Post()
  @ApiCustomResponse(SubAroResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Sub-aro created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createSubAroDto: CreateSubAroDto,
  ): Promise<ApiResponseDto<SubAroResponseDto>> {
    const subAro = await this.subAroService.create(userId, createSubAroDto);
    return ApiResponse.success<SubAroResponseDto>(subAro, 'Sub-aro created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve sub-aros list with pagination and search' })
  @ApiPaginatedResponse(SubAroResponseDto, { description: 'Sub-aros retrieved successfully' })
  async findAll(@Query() paginationQuery: SubAroPaginationQueryDto) {
    const { data, totalItems } = await this.subAroService.findAll(paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Sub-aros retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single sub-aro by ID' })
  @ApiCustomResponse(SubAroResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Sub-aro retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<SubAroResponseDto>> {
    const subAro = await this.subAroService.findOne(id);
    return ApiResponse.success<SubAroResponseDto>(subAro, 'Sub-aro retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sub-aro by ID' })
  @ApiCustomResponse(SubAroResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Sub-aro updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSubAroDto: UpdateSubAroDto,
  ): Promise<ApiResponseDto<SubAroResponseDto>> {
    const subAro = await this.subAroService.update(id, updateSubAroDto);
    return ApiResponse.success<SubAroResponseDto>(subAro, 'Sub-aro updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a sub-aro by ID' })
  @ApiCustomResponse(SubAroResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Sub-aro status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateSubAroStatusDto: UpdateSubAroStatusDto,
  ): Promise<ApiResponseDto<SubAroResponseDto>> {
    const subAro = await this.subAroService.updateStatus(id, updateSubAroStatusDto.status);
    return ApiResponse.success<SubAroResponseDto>(subAro, 'Sub-aro status updated successfully');
  }
}
