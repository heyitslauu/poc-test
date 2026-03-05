import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiNoContentResponse, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { PaymentDetailsService } from '../services/payment-details.service';
import { CreatePaymentDetailBodyDto } from '../dto/create-payment-detail-body.dto';
import { CreatePaymentDetailDto } from '../dto/create-payment-detail.dto';
import { PaymentDetailResponseDto } from '../dto/create-payment-detail.dto';
import { UpdatePaymentDetailDto } from '../dto/update-payment-detail.dto';
import { PaymentDetailPaginationQueryDto } from '../dto/payment-detail-pagination-query.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiPaginatedResponse, ApiCustomResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('payment-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('payments/:paymentId/details')
export class PaymentDetailsController {
  constructor(private readonly paymentDetailsService: PaymentDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment detail' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiCustomResponse(PaymentDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Payment detail created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Param('paymentId') paymentId: string,
    @Body() body: CreatePaymentDetailBodyDto,
  ): Promise<ApiResponseDto<PaymentDetailResponseDto>> {
    const createPaymentDetailDto: CreatePaymentDetailDto = {
      payment_id: paymentId,
      user_id: userId,
      journal_entry_id: body.journal_entry_id,
      payee_id: body.payee_id,
      amount: body.amount,
    };
    const paymentDetail = await this.paymentDetailsService.create(createPaymentDetailDto);
    return ApiResp.success<PaymentDetailResponseDto>(
      paymentDetail,
      'Payment detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve payment details list with pagination and filters' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiPaginatedResponse(PaymentDetailResponseDto, { description: 'Payment details retrieved successfully' })
  async findAll(@Param('paymentId') paymentId: string, @Query() paginationQuery: PaymentDetailPaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const { search, journal_entry_id, payee_id, user_id } = paginationQuery;

    const { data, totalItems } = await this.paymentDetailsService.findAll(
      paymentId,
      page,
      limit,
      search,
      journal_entry_id,
      payee_id,
      user_id,
    );
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResp.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResp.paginatedSuccess(data, pagination, 'Payment details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve payment detail by ID' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiParam({ name: 'id', description: 'Payment detail ID' })
  @ApiCustomResponse(PaymentDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payment detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<PaymentDetailResponseDto>> {
    const paymentDetail = await this.paymentDetailsService.findOne(id);
    return ApiResp.success<PaymentDetailResponseDto>(paymentDetail, 'Payment detail retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a payment detail' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiParam({ name: 'id', description: 'Payment detail ID' })
  @ApiCustomResponse(PaymentDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payment detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePaymentDetailDto: UpdatePaymentDetailDto,
  ): Promise<ApiResponseDto<PaymentDetailResponseDto>> {
    const paymentDetail = await this.paymentDetailsService.update(id, updatePaymentDetailDto);
    return ApiResp.success<PaymentDetailResponseDto>(paymentDetail, 'Payment detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment detail' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  @ApiParam({ name: 'id', description: 'Payment detail ID' })
  @ApiNoContentResponse({
    description: 'Payment detail deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.paymentDetailsService.remove(id);
  }
}
