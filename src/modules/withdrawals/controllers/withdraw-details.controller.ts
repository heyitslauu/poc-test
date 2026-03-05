import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch, Delete, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard';
import { WithdrawDetailsService } from '../services/withdraw-details.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common';
import { CreateWithdrawalDetailDto } from '../dto/create-withdrawal-detail.dto';
import { CreateWithdrawalDetailBodyDto } from '../dto/create-withdrawal-detail-body.dto';
import { WithdrawalDetailResponseDto } from '../dto/withdrawal-detail-response.dto';
import { WithdrawalDetailsPaginationQueryDto } from '../dto/withdrawal-details-pagination.dto';
import { UpdateWithdrawalDetailDto } from '../dto/update-withdrawal-detail.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('withdrawal-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('withdrawals/:withdrawalId/details')
export class WithdrawDetailsController {
  constructor(private readonly withdrawDetailsService: WithdrawDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create withdrawal detail' })
  @ApiCustomResponse(WithdrawalDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Withdrawal detail created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Param('withdrawalId') withdrawalId: string,
    @Body() createWithdrawalDetailBodyDto: CreateWithdrawalDetailBodyDto,
  ): Promise<ApiResponseDto<WithdrawalDetailResponseDto>> {
    const createWithdrawalDetailDto: CreateWithdrawalDetailDto = {
      withdrawal_id: withdrawalId,
      sub_aro_details_id: createWithdrawalDetailBodyDto.sub_aro_details_id,
      amount: createWithdrawalDetailBodyDto.amount,
    };
    console.log(createWithdrawalDetailDto);

    const withdrawalDetail = await this.withdrawDetailsService.create(userId, createWithdrawalDetailDto);
    return ApiResponse.success<WithdrawalDetailResponseDto>(
      withdrawalDetail,
      'Withdrawal detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve withdrawal details list with pagination and filters' })
  @ApiParam({ name: 'withdrawalId', description: 'Withdrawal ID' })
  @ApiPaginatedResponse(WithdrawalDetailResponseDto, { description: 'Withdrawal details retrieved successfully' })
  async findAll(
    @Param('withdrawalId') withdrawalId: string,
    @Query() paginationQuery: WithdrawalDetailsPaginationQueryDto,
  ) {
    const { data, totalItems } = await this.withdrawDetailsService.findAll(withdrawalId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Withdrawal details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single withdrawal detail by ID' })
  @ApiParam({ name: 'withdrawalId', description: 'Withdrawal ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal detail ID' })
  @ApiCustomResponse(WithdrawalDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Withdrawal detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<WithdrawalDetailResponseDto>> {
    const withdrawalDetail = await this.withdrawDetailsService.findOne(id);
    return ApiResponse.success<WithdrawalDetailResponseDto>(
      withdrawalDetail,
      'Withdrawal detail retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a withdrawal detail by ID' })
  @ApiParam({ name: 'withdrawalId', description: 'Withdrawal ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal detail ID' })
  @ApiCustomResponse(WithdrawalDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Withdrawal detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateWithdrawalDetailDto: UpdateWithdrawalDetailDto,
  ): Promise<ApiResponseDto<WithdrawalDetailResponseDto>> {
    const withdrawalDetail = await this.withdrawDetailsService.update(id, updateWithdrawalDetailDto);
    return ApiResponse.success<WithdrawalDetailResponseDto>(withdrawalDetail, 'Withdrawal detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a withdrawal detail by ID' })
  @ApiParam({ name: 'withdrawalId', description: 'Withdrawal ID' })
  @ApiParam({ name: 'id', description: 'Withdrawal detail ID' })
  @ApiNoContentResponse({
    description: 'Withdrawal detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.withdrawDetailsService.delete(id);
  }
}
