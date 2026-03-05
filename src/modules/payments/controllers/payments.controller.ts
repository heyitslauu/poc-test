import { Controller, Post, Body, HttpStatus, UseGuards, Get, Query, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PaymentsService } from '../services/payments.service';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentDto } from '../dto/update-payment.dto';
import { UpdatePaymentStatusDto } from '../dto/update-payment-status.dto';
import { PaymentResponseDto } from '../dto/payment-response.dto';
import { PaymentPaginationQueryDto } from '../dto/payment-pagination-query.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiCustomResponse(PaymentResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Payment created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<ApiResponseDto<PaymentResponseDto>> {
    const payment = await this.paymentsService.create(userId, createPaymentDto);
    return ApiResp.success<PaymentResponseDto>(payment, 'Payment created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve payment list with pagination, search, and filters' })
  @ApiPaginatedResponse(PaymentResponseDto, { description: 'Payments retrieved successfully' })
  async findAll(@Query() paginationQuery: PaymentPaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const { search, type, status, spoil_check_status, bank_account_no, user_id, fund_cluster } = paginationQuery;

    const { data, totalItems } = await this.paymentsService.findAll(
      page,
      limit,
      search,
      type,
      status,
      spoil_check_status,
      bank_account_no,
      user_id,
      fund_cluster,
    );
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResp.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResp.paginatedSuccess(data, pagination, 'Payments retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve payment by ID' })
  @ApiCustomResponse(PaymentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payment retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<PaymentResponseDto>> {
    const payment = await this.paymentsService.findOne(id);
    return ApiResp.success<PaymentResponseDto>(payment, 'Payment retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiCustomResponse(PaymentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payment updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ): Promise<ApiResponseDto<PaymentResponseDto>> {
    const payment = await this.paymentsService.update(id, updatePaymentDto);
    return ApiResp.success<PaymentResponseDto>(payment, 'Payment updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a payment by ID' })
  @ApiCustomResponse(PaymentResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payment status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<ApiResponseDto<PaymentResponseDto>> {
    const payment = await this.paymentsService.updateStatus(id, updatePaymentStatusDto.status);
    return ApiResp.success<PaymentResponseDto>(payment, 'Payment status updated successfully');
  }
}
