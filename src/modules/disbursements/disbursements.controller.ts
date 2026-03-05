import { Controller, Post, Get, Patch, Query, Param, Body, Delete, HttpStatus, UseGuards } from '@nestjs/common';
import { DisbursementsService } from './disbursements.service';
import { CreateDisbursementDto } from './dto/create-disbursement.dto';
import { UpdateDisbursementDto } from './dto/update-disbursement.dto';
import { UpdateDisbursementStatusDto } from './dto/update-disbursement-status.dto';
import { AttachObligationDto } from './dto/attach-obligation.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { DisbursementResponseDto } from './dto/disbursement-response.dto';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../common/decorators/api-response.decorator';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('disbursements')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('disbursements')
export class DisbursementsController {
  constructor(private readonly disbursementsService: DisbursementsService) {}

  @Post()
  @ApiCustomResponse(DisbursementResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Disbursement created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDisbursementDto: CreateDisbursementDto,
  ): Promise<ApiResponseDto<DisbursementResponseDto>> {
    const disbursement = await this.disbursementsService.create(userId, createDisbursementDto);
    return ApiResponse.success<DisbursementResponseDto>(
      disbursement,
      'Disbursement created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve disbursement list with pagination and search' })
  @ApiPaginatedResponse(DisbursementResponseDto, { description: 'Disbursements retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const filters = {
      fund_cluster: paginationQuery.fund_cluster,
      status: paginationQuery.status,
    };
    const sortByDate = paginationQuery.sortByDate || 'desc';
    const { data, totalItems } = await this.disbursementsService.findAll(page, limit, search, filters, sortByDate, {
      startDate: paginationQuery.startDate,
      endDate: paginationQuery.endDate,
    });
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Disbursements retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve disbursement by ID' })
  @ApiCustomResponse(DisbursementResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Disbursement retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<DisbursementResponseDto>> {
    const disbursement = await this.disbursementsService.findOne(id);
    return ApiResponse.success<DisbursementResponseDto>(disbursement, 'Disbursement retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update disbursement',
    description: 'Updates an existing disbursement by its ID',
  })
  @ApiCustomResponse(DisbursementResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Disbursement updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDisbursementDto: UpdateDisbursementDto,
  ): Promise<ApiResponseDto<DisbursementResponseDto>> {
    const disbursement = await this.disbursementsService.update(id, updateDisbursementDto);
    return ApiResponse.success<DisbursementResponseDto>(disbursement, 'Disbursement updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a disbursement by ID' })
  @ApiCustomResponse(DisbursementResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Disbursement status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDisbursementStatusDto: UpdateDisbursementStatusDto,
  ): Promise<ApiResponseDto<DisbursementResponseDto>> {
    const disbursement = await this.disbursementsService.updateStatus(id, updateDisbursementStatusDto.status);
    return ApiResponse.success<DisbursementResponseDto>(disbursement, 'Disbursement status updated successfully');
  }

  @Post(':id/obligations')
  @ApiOperation({ summary: 'Attach obligation to a disbursement' })
  @ApiCustomResponse(Object, {
    statusCode: HttpStatus.OK,
    description: 'Obligation attached successfully',
  })
  async attachObligation(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() body: AttachObligationDto,
  ): Promise<ApiResponseDto<null>> {
    await this.disbursementsService.attachObligation(userId, id, body.obligation_detail_id);
    return ApiResponse.success<null>(null, 'Obligation attached successfully', HttpStatus.OK);
  }

  @Delete(':id/obligations/:obligationDetailId')
  @ApiOperation({ summary: 'Detach obligation from a disbursement' })
  @ApiCustomResponse(Object, {
    statusCode: HttpStatus.OK,
    description: 'Obligation detached successfully',
  })
  async detachObligation(
    @Param('id') id: string,
    @Param('obligationDetailId') obligationDetailId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.disbursementsService.detachObligation(id, obligationDetailId);
    return ApiResponse.success<null>(null, 'Obligation detached successfully', HttpStatus.OK);
  }
}
