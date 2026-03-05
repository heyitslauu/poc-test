import { Controller, Post, Patch, Get, Query, Body, Param, HttpStatus } from '@nestjs/common';
import { AllotmentsService } from './allotments.service';
import { CreateAllotmentDto } from './dto/create-allotment.dto';
import { UpdateAllotmentDto } from './dto/update-allotment.dto';
import { UpdateAllotmentStatusDto } from './dto/update-allotment-status.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { DraftPaginationQueryDto } from './dto/draft-pagination-query.dto';
import { ApiResponse } from '../../common/utils/api-response.util';
import { AllotmentResponseDto } from './dto/allotment-response.dto';
import { AllotmentDraftResponseDto } from './dto/allotment-draft-response.dto';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../common/decorators/api-response.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateAllotmentWorkflowDto } from './dto/update-allotment-workflow.dto';

@ApiTags('allotments')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('allotments')
export class AllotmentsController {
  constructor(private readonly allotmentsService: AllotmentsService) {}

  @Post()
  @ApiCustomResponse(AllotmentResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Allotment created and submitted successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createAllotmentDto: CreateAllotmentDto,
  ): Promise<ApiResponseDto<AllotmentResponseDto>> {
    const allotment = await this.allotmentsService.create(userId, createAllotmentDto);
    return ApiResponse.success<AllotmentResponseDto>(
      allotment,
      'Allotment created and submitted successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve allotment list with pagination and search' })
  @ApiPaginatedResponse(AllotmentResponseDto, { description: 'Allotments retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const filters = {
      date: paginationQuery.date,
      fund_cluster: paginationQuery.fund_cluster,
      appropriation_type: paginationQuery.appropriation_type,
      bfars_budget_type: paginationQuery.bfars_budget_type,
      allotment_type: paginationQuery.allotment_type,
      status: paginationQuery.status,
    };
    const { data, totalItems } = await this.allotmentsService.findAll(page, limit, search, filters);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Allotments retrieved successfully');
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Retrieve allotment drafts list with pagination and search' })
  @ApiPaginatedResponse(AllotmentDraftResponseDto, { description: 'Allotment drafts retrieved successfully' })
  async findAllDrafts(@Query() paginationQuery: DraftPaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const filters = {
      date: paginationQuery.date,
      fund_cluster: paginationQuery.fund_cluster,
      appropriation_type: paginationQuery.appropriation_type,
      bfars_budget_type: paginationQuery.bfars_budget_type,
      allotment_type: paginationQuery.allotment_type,
    };
    const { data, totalItems } = await this.allotmentsService.findAllDrafts(page, limit, search, filters);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Allotment drafts retrieved successfully');
  }

  @Get('drafts/:id')
  @ApiOperation({ summary: 'Retrieve allotment draft by ID' })
  @ApiCustomResponse(AllotmentDraftResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment draft retrieved successfully',
  })
  async findOneDraft(@Param('id') id: string): Promise<ApiResponseDto<AllotmentDraftResponseDto>> {
    const allotment = await this.allotmentsService.findOneDraft(id);
    return ApiResponse.success<AllotmentDraftResponseDto>(allotment, 'Allotment draft retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve allotment by ID' })
  @ApiCustomResponse(AllotmentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<AllotmentResponseDto>> {
    const allotment = await this.allotmentsService.findOne(id);
    return ApiResponse.success<AllotmentResponseDto>(allotment, 'Allotment retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update allotment',
    description: 'Updates an existing allotment with FOR_PROCESSING status by its ID',
  })
  @ApiCustomResponse(AllotmentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAllotmentDto: UpdateAllotmentDto,
  ): Promise<ApiResponseDto<AllotmentResponseDto>> {
    const allotment = await this.allotmentsService.update(id, updateAllotmentDto);
    return ApiResponse.success<AllotmentResponseDto>(allotment, 'Allotment updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update allotment status',
    description: 'Updates the status of an allotment by its ID',
  })
  @ApiCustomResponse(AllotmentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateAllotmentStatusDto: UpdateAllotmentStatusDto,
  ): Promise<ApiResponseDto<AllotmentResponseDto>> {
    const allotment = await this.allotmentsService.updateStatus(id, updateAllotmentStatusDto.status);
    return ApiResponse.success<AllotmentResponseDto>(allotment, 'Allotment status updated successfully');
  }

  @Patch(':id/workflow')
  @ApiOperation({ summary: 'Link exFLOW workflow ID for an allotment' })
  @ApiCustomResponse(AllotmentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment workflow ID updated successfully',
  })
  async updateWorkflowId(
    @Param('id') id: string,
    @Body() body: UpdateAllotmentWorkflowDto,
  ): Promise<ApiResponseDto<AllotmentResponseDto>> {
    const allotment = await this.allotmentsService.updateWorkflowId(id, body.workflow_id);
    return ApiResponse.success<AllotmentResponseDto>(allotment, 'Allotment workflow ID updated successfully');
  }
}
