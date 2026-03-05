import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ObligationsService } from '../services/obligations.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';
import { CreateObligationDto } from '../dtos/create-obligation.dto';
import { ObligationResponseDto } from '../dtos/obligation-response.dto';
import { ObligationsPaginationQueryDto } from '../dtos/obligations-pagination-query.dto';
import { UpdateObligationDto } from '../dtos/update-obligation.dto';
import { ApiResponse } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { UpdateObligationStatusDto } from '../dtos/update-obligation-status.dto';

@ApiTags('obligations')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('obligations')
export class ObligationsController {
  constructor(private readonly obligationsService: ObligationsService) {}

  @Post()
  @ApiCustomResponse(ObligationResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Obligation created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createObligationDto: CreateObligationDto,
  ): Promise<ApiResponseDto<ObligationResponseDto>> {
    const obligation = await this.obligationsService.create(userId, createObligationDto);
    return ApiResponse.success<ObligationResponseDto>(obligation, 'Obligation created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve Obligation list with pagination' })
  @ApiPaginatedResponse(ObligationResponseDto, { description: 'Obligations retrieved successfully' })
  async findAll(@Query() paginationQuery: ObligationsPaginationQueryDto) {
    const { data, totalItems } = await this.obligationsService.findAll(paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Obligations retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single Obligation by ID' })
  @ApiCustomResponse(ObligationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Obligation retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<ObligationResponseDto>> {
    const obligation = await this.obligationsService.findOne(id);
    return ApiResponse.success<ObligationResponseDto>(obligation, 'Obligation retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a obligation by ID' })
  @ApiCustomResponse(ObligationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Obligation updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateObligationDto: UpdateObligationDto,
  ): Promise<ApiResponseDto<ObligationResponseDto>> {
    const obligation: ObligationResponseDto = await this.obligationsService.update(id, updateObligationDto);
    return ApiResponse.success<ObligationResponseDto>(obligation, 'Obligation updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a Obligation by ID' })
  @ApiCustomResponse(ObligationResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Obligation status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateObligationStatusDto: UpdateObligationStatusDto,
  ): Promise<ApiResponseDto<ObligationResponseDto>> {
    const obligation = await this.obligationsService.updateStatus(id, updateObligationStatusDto.status);
    return ApiResponse.success<ObligationResponseDto>(obligation, 'Obligation status updated successfully');
  }
}
