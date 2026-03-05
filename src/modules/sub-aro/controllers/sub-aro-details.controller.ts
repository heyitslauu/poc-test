import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { SubAroDetailsService } from '../services/sub-aro-details.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateSubAroDetailsDto } from '../dto/create-sub-aro-details.dto';
import { CreateSubAroDetailsBodyDto } from '../dto/create-sub-aro-details-body.dto';
import { SubAroDetailsResponseDto } from '../dto/sub-aro-details-response.dto';
import { SubAroDetailsPaginationQueryDto } from '../dto/sub-aro-details-pagination.dto';
import { UpdateSubAroDetailsDto } from '../dto/update-sub-aro-details.dto';
import { ApiResponseDto, ApiResponse } from '@/common';

@ApiTags('sub-aro-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('sub-aro/:subAroId/details')
export class SubAroDetailsController {
  constructor(private readonly subAroDetailsService: SubAroDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create sub-aro detail' })
  @ApiParam({ name: 'subAroId', description: 'Sub-aro ID' })
  @ApiCustomResponse(SubAroDetailsResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Sub-aro detail created successfully',
  })
  async create(
    @Param('subAroId') subAroId: string,
    @Body() createSubAroDetailsBodyDto: CreateSubAroDetailsBodyDto,
  ): Promise<ApiResponseDto<SubAroDetailsResponseDto>> {
    const createSubAroDetailsDto: CreateSubAroDetailsDto = {
      sub_aro_id: subAroId,
      uacs_id: createSubAroDetailsBodyDto.uacs_id,
      amount: createSubAroDetailsBodyDto.amount,
    };
    const subAroDetail = await this.subAroDetailsService.create(createSubAroDetailsDto);
    return ApiResponse.success<SubAroDetailsResponseDto>(
      subAroDetail,
      'Sub-aro detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve sub-aro details list with pagination and filters' })
  @ApiParam({ name: 'subAroId', description: 'Sub-aro ID' })
  @ApiPaginatedResponse(SubAroDetailsResponseDto, { description: 'Sub-aro details retrieved successfully' })
  async findAll(@Param('subAroId') subAroId: string, @Query() paginationQuery: SubAroDetailsPaginationQueryDto) {
    const { data, totalItems } = await this.subAroDetailsService.findAll(subAroId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Sub-aro details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single sub-aro detail by ID' })
  @ApiParam({ name: 'subAroId', description: 'Sub-aro ID' })
  @ApiParam({ name: 'id', description: 'Sub-aro detail ID' })
  @ApiCustomResponse(SubAroDetailsResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Sub-aro detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<SubAroDetailsResponseDto>> {
    const subAroDetail = await this.subAroDetailsService.findOne(id);
    return ApiResponse.success<SubAroDetailsResponseDto>(subAroDetail, 'Sub-aro detail retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sub-aro detail by ID' })
  @ApiParam({ name: 'subAroId', description: 'Sub-aro ID' })
  @ApiParam({ name: 'id', description: 'Sub-aro detail ID' })
  @ApiCustomResponse(SubAroDetailsResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Sub-aro detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSubAroDetailsDto: UpdateSubAroDetailsDto,
  ): Promise<ApiResponseDto<SubAroDetailsResponseDto>> {
    const subAroDetail = await this.subAroDetailsService.update(id, updateSubAroDetailsDto);
    return ApiResponse.success<SubAroDetailsResponseDto>(subAroDetail, 'Sub-aro detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sub-aro detail by ID' })
  @ApiParam({ name: 'subAroId', description: 'Sub-aro ID' })
  @ApiParam({ name: 'id', description: 'Sub-aro detail ID' })
  @ApiNoContentResponse({
    description: 'Sub-aro detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.subAroDetailsService.delete(id);
  }
}
