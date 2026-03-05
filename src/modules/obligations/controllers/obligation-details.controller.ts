import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { ObligationDetailsService } from '../services/obligation-details.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateObligationDetailDto } from '../dtos/create-obligation-detail.dto';
import { CreateObligationDetailBodyDto } from '../dtos/create-obligation-detail-body.dto';
import { ObligationDetailResponseDto } from '../dtos/obligation-detail-response.dto';
import { ObligationDetailsPaginationQueryDto } from '../dtos/obligation-details-pagination.dto';
import { UpdateObligationDetailDto } from '../dtos/update-obligation-detail.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '../../../modules/auth/decorators';

@ApiTags('obligation-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('obligations/:obligationId/details')
export class ObligationDetailsController {
  constructor(private readonly obligationDetailsService: ObligationDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create obligation detail' })
  @ApiCustomResponse(ObligationDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Obligation detail created successfully',
  })
  async create(
    @Param('obligationId') obligationId: string,
    @CurrentUser('userId') userId: string,
    @Body() createObligationDetailBodyDto: CreateObligationDetailBodyDto,
  ): Promise<ApiResponseDto<ObligationDetailResponseDto>> {
    const createObligationDetailDto: CreateObligationDetailDto = {
      obligation_id: obligationId,
      allotment_details_id: createObligationDetailBodyDto.allotment_details_id,
      amount: createObligationDetailBodyDto.amount,
      user_id: userId,
    };
    const obligationDetail = await this.obligationDetailsService.create(createObligationDetailDto);
    return ApiResponse.success<ObligationDetailResponseDto>(
      obligationDetail,
      'Obligation detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve obligation details list with pagination and filters' })
  @ApiParam({ name: 'obligationId', description: 'Obligation ID' })
  @ApiPaginatedResponse(ObligationDetailResponseDto, { description: 'Obligation details retrieved successfully' })
  async findAll(
    @Param('obligationId') obligationId: string,
    @Query() paginationQuery: ObligationDetailsPaginationQueryDto,
  ) {
    const { data, totalItems } = await this.obligationDetailsService.findAll(obligationId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Obligation details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single obligation detail by ID' })
  @ApiParam({ name: 'obligationId', description: 'Obligation ID' })
  @ApiParam({ name: 'id', description: 'Obligation detail ID' })
  @ApiCustomResponse(ObligationDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Obligation detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<ObligationDetailResponseDto>> {
    const obligationDetail = await this.obligationDetailsService.findOne(id);
    return ApiResponse.success<ObligationDetailResponseDto>(
      obligationDetail,
      'Obligation detail retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a obligation detail by ID' })
  @ApiParam({ name: 'obligationId', description: 'Obligation ID' })
  @ApiParam({ name: 'id', description: 'Obligation detail ID' })
  @ApiCustomResponse(ObligationDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Obligation detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateObligationDetailDto: UpdateObligationDetailDto,
  ): Promise<ApiResponseDto<ObligationDetailResponseDto>> {
    const obligationDetail = await this.obligationDetailsService.update(id, updateObligationDetailDto);
    return ApiResponse.success<ObligationDetailResponseDto>(obligationDetail, 'Obligation detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a obligation detail by ID' })
  @ApiParam({ name: 'obligationId', description: 'Obligation ID' })
  @ApiParam({ name: 'id', description: 'Obligation detail ID' })
  @ApiNoContentResponse({
    description: 'Obligation detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.obligationDetailsService.delete(id);
  }
}
