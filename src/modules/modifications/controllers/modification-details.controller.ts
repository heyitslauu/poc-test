import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ModificationDetailsService } from '../services/modification-details.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateModificationDetailDto } from '../dto/create-modification-detail.dto';
import { CreateModificationDetailBodyDto } from '../dto/create-modification-detail-body.dto';
import { ModificationDetailResponseDto } from '../dto/modification-detail-response.dto';
import { ModificationDetailsPaginationQueryDto } from '../dto/modification-details-pagination.dto';
import { UpdateModificationDetailDto } from '../dto/update-modification-detail.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('modification-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('modifications/:modificationId/details')
export class ModificationDetailsController {
  constructor(private readonly modificationDetailsService: ModificationDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create modification detail' })
  @ApiCustomResponse(ModificationDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Modification detail created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Param('modificationId') modificationId: string,
    @Body() createModificationDetailBodyDto: CreateModificationDetailBodyDto,
  ): Promise<ApiResponseDto<ModificationDetailResponseDto>> {
    const createModificationDetailDto: CreateModificationDetailDto = {
      modification_id: modificationId,
      allotment_details_id: createModificationDetailBodyDto.allotment_details_id,
      sub_aro_details_id: createModificationDetailBodyDto.sub_aro_details_id,
      action: createModificationDetailBodyDto.action,
      amount: createModificationDetailBodyDto.amount,
      office_id: createModificationDetailBodyDto.office_id,
      pap_id: createModificationDetailBodyDto.pap_id,
      rca_id: createModificationDetailBodyDto.rca_id,
    };
    const modificationDetail = await this.modificationDetailsService.create(userId, createModificationDetailDto);
    return ApiResponse.success<ModificationDetailResponseDto>(
      modificationDetail,
      'Modification detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve modification details list with pagination and filters' })
  @ApiParam({ name: 'modificationId', description: 'Modification ID' })
  @ApiPaginatedResponse(ModificationDetailResponseDto, { description: 'Modification details retrieved successfully' })
  async findAll(
    @Param('modificationId') modificationId: string,
    @Query() paginationQuery: ModificationDetailsPaginationQueryDto,
  ) {
    const { data, totalItems } = await this.modificationDetailsService.findAll(modificationId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Modification details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single modification detail by ID' })
  @ApiParam({ name: 'modificationId', description: 'Modification ID' })
  @ApiParam({ name: 'id', description: 'Modification detail ID' })
  @ApiCustomResponse(ModificationDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Modification detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<ModificationDetailResponseDto>> {
    const modificationDetail = await this.modificationDetailsService.findOne(id);
    return ApiResponse.success<ModificationDetailResponseDto>(
      modificationDetail,
      'Modification detail retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a modification detail by ID' })
  @ApiParam({ name: 'modificationId', description: 'Modification ID' })
  @ApiParam({ name: 'id', description: 'Modification detail ID' })
  @ApiCustomResponse(ModificationDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Modification detail updated successfully',
  })
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() updateModificationDetailDto: UpdateModificationDetailDto,
  ): Promise<ApiResponseDto<ModificationDetailResponseDto>> {
    const modificationDetail = await this.modificationDetailsService.update(userId, id, updateModificationDetailDto);
    return ApiResponse.success<ModificationDetailResponseDto>(
      modificationDetail,
      'Modification detail updated successfully',
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a modification detail by ID' })
  @ApiParam({ name: 'modificationId', description: 'Modification ID' })
  @ApiParam({ name: 'id', description: 'Modification detail ID' })
  @ApiNoContentResponse({
    description: 'Modification detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.modificationDetailsService.delete(id);
  }
}
