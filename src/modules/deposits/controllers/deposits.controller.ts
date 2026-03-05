import { Controller, Post, Get, Patch, Delete, Body, HttpStatus, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { DepositsService } from '../services/deposits.service';
import { CreateDepositDto } from '../dto/create-deposit.dto';
import { DepositResponseDto } from '../dto/deposit-response.dto';
import { DepositsPaginationQueryDto } from '../dto/deposits-pagination.dto';
import { UpdateDepositDto } from '../dto/update-deposit.dto';
import { UpdateDepositStatusDto } from '../dto/update-deposit-status.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('deposits')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('deposits')
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new deposit' })
  @ApiCustomResponse(DepositResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Deposit created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createDepositDto: CreateDepositDto,
  ): Promise<ApiResponseDto<DepositResponseDto>> {
    const deposit = await this.depositsService.create(userId, createDepositDto);
    return ApiResp.success<DepositResponseDto>(deposit, 'Deposit created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve deposits list with pagination, search, and filters' })
  @ApiPaginatedResponse(DepositResponseDto, { description: 'Deposits retrieved successfully' })
  async findAll(@Query() query: DepositsPaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const { data, totalItems } = await this.depositsService.findAll(query);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResp.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResp.paginatedSuccess(data, pagination, 'Deposits retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a deposit by ID' })
  @ApiCustomResponse(DepositResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Deposit retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<DepositResponseDto>> {
    const deposit = await this.depositsService.findOne(id);
    return ApiResp.success<DepositResponseDto>(deposit, 'Deposit retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a deposit by ID' })
  @ApiCustomResponse(DepositResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Deposit updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDepositDto: UpdateDepositDto,
  ): Promise<ApiResponseDto<DepositResponseDto>> {
    const deposit = await this.depositsService.update(id, updateDepositDto);
    return ApiResp.success<DepositResponseDto>(deposit, 'Deposit updated successfully');
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update the status of a deposit by ID' })
  @ApiCustomResponse(DepositResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Deposit status updated successfully',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDepositStatusDto: UpdateDepositStatusDto,
  ): Promise<ApiResponseDto<DepositResponseDto>> {
    const deposit = await this.depositsService.updateStatus(
      id,
      updateDepositStatusDto.status,
      updateDepositStatusDto.remarks,
    );
    return ApiResp.success<DepositResponseDto>(deposit, 'Deposit status updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a deposit by ID' })
  @ApiCustomResponse(DepositResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Deposit deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<DepositResponseDto>> {
    const deposit = await this.depositsService.remove(id);
    return ApiResp.success<DepositResponseDto>(deposit, 'Deposit deleted successfully');
  }
}
