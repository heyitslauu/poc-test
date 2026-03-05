import { Controller, Post, Body, Get, Query, Param, Patch, Delete, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { CollectionsService } from '../services/collections.service';
import { CreateCollectionDto } from '../dto/create-collection.dto';
import { UpdateCollectionDto } from '../dto/update-collection.dto';
import { UpdateCollectionStatusDto } from '../dto/update-collection-status.dto';
import { UpdateCollectionWorkflowDto } from '../dto/update-collection-workflow.dto';
import { CollectionResponseDto } from '../dto/collection-response.dto';
import { CollectionPaginationQueryDto } from '../dto/collection-pagination-query.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('collections')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Collection created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createCollectionDto: CreateCollectionDto,
  ): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.create(userId, createCollectionDto);
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve collections list with pagination, search, and filters' })
  @ApiPaginatedResponse(CollectionResponseDto, { description: 'Collections retrieved successfully' })
  async findAll(@Query() query: CollectionPaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, totalItems } = await this.collectionsService.findAll(query);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResp.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResp.paginatedSuccess(data, pagination, 'Collections retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve collection by ID' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.findOne(id);
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection retrieved successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a collection by ID' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateCollectionStatusDto: UpdateCollectionStatusDto,
  ): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.updateStatus(
      id,
      updateCollectionStatusDto.status,
      updateCollectionStatusDto.remarks,
    );
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection status updated successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
  ): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.update(id, updateCollectionDto);
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection updated successfully');
  }

  @Patch(':id/workflow')
  @ApiOperation({ summary: 'linked exFLOW workflow ID for a collection' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection workflow ID updated successfully',
  })
  async updateWorkflow(
    @Param('id') id: string,
    @Body() body: UpdateCollectionWorkflowDto,
  ): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.updateWorkflowId(id, body.workflow_id);
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection workflow ID updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a collection by ID' })
  @ApiCustomResponse(CollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.remove(id);
    return ApiResp.success<CollectionResponseDto>(collection, 'Collection deleted successfully');
  }
}
