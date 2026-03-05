import { Controller, Post, Get, Body, HttpStatus, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { WithdrawalsService } from '../services/withdrawals.service';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common';
import { CreateWithdrawalDto } from '../dto/create-withdrawal.dto';
import { UpdateWithdrawalDto } from '../dto/update-withdrawal.dto';
import { UpdateWithdrawalStatusDto } from '../dto/update-withdrawal-status.dto';
import { WithdrawalResponseDto } from '../dto/withdrawal-response.dto';
import { WithdrawalsPaginationQueryDto } from '../dto/withdrawals-pagination.dto';
import { ApiResponseDto, ApiResponse } from '@/common';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('withdrawals')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('withdrawals')
export class WithdrawalsController {
  constructor(private readonly withdrawalsService: WithdrawalsService) {}

  @Post()
  @ApiCustomResponse(WithdrawalResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Withdrawal created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createWithdrawalDto: CreateWithdrawalDto,
  ): Promise<ApiResponseDto<WithdrawalResponseDto>> {
    const withdrawal = await this.withdrawalsService.create(userId, createWithdrawalDto);
    return ApiResponse.success<WithdrawalResponseDto>(withdrawal, 'Withdrawal created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve withdrawals list with pagination' })
  @ApiPaginatedResponse(WithdrawalResponseDto, { description: 'Withdrawals retrieved successfully' })
  async findAll(@Query() paginationQuery: WithdrawalsPaginationQueryDto) {
    const { data, totalItems } = await this.withdrawalsService.findAll(paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Withdrawals retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single withdrawal by ID' })
  @ApiCustomResponse(WithdrawalResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Withdrawal retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<WithdrawalResponseDto>> {
    const withdrawal = await this.withdrawalsService.findOne(id);
    return ApiResponse.success<WithdrawalResponseDto>(withdrawal, 'Withdrawal retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a withdrawal by ID' })
  @ApiCustomResponse(WithdrawalResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Withdrawal updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateWithdrawalDto: UpdateWithdrawalDto,
  ): Promise<ApiResponseDto<WithdrawalResponseDto>> {
    const withdrawal: WithdrawalResponseDto = await this.withdrawalsService.update(id, updateWithdrawalDto);
    return ApiResponse.success<WithdrawalResponseDto>(withdrawal, 'Withdrawal updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a withdrawal by ID' })
  @ApiCustomResponse(WithdrawalResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Withdrawal status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateWithdrawalStatusDto: UpdateWithdrawalStatusDto,
  ): Promise<ApiResponseDto<WithdrawalResponseDto>> {
    const withdrawal = await this.withdrawalsService.updateStatus(id, updateWithdrawalStatusDto.status);
    return ApiResponse.success<WithdrawalResponseDto>(withdrawal, 'Withdrawal status updated successfully');
  }
}
