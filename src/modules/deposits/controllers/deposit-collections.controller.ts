import { Controller, Post, Get, Delete, Patch, Body, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { DepositsService } from '../services/deposits.service';
import { CreateDepositCollectionDto } from '../dto/create-deposit-collection.dto';
import { DepositCollectionResponseDto } from '../dto/deposit-collection-response.dto';
import { DepositCollectionItemDto } from '../dto/deposit-collection-item.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiCustomResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('deposit-collections')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('deposits/:depositId/collections')
export class DepositCollectionsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Link a collection to a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiCustomResponse(DepositCollectionResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Collection linked to deposit successfully',
  })
  async createDepositCollection(
    @CurrentUser('userId') userId: string,
    @Param('depositId') depositId: string,
    @Body() createDepositCollectionDto: CreateDepositCollectionDto,
  ): Promise<ApiResponseDto<DepositCollectionResponseDto>> {
    const depositCollection = await this.depositsService.createDepositCollection(
      userId,
      depositId,
      createDepositCollectionDto,
    );
    return ApiResp.success<DepositCollectionResponseDto>(
      depositCollection,
      'Collection linked to deposit successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List collections linked to a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiCustomResponse(DepositCollectionItemDto, {
    statusCode: HttpStatus.OK,
    description: 'Collections retrieved successfully',
  })
  async getDepositCollections(@Param('depositId') depositId: string) {
    const data = await this.depositsService.findAllDepositCollections(depositId);
    return ApiResp.success<DepositCollectionItemDto[]>(data, 'Collections retrieved successfully');
  }

  @Patch(':collectionId')
  @ApiOperation({ summary: 'Validate and refresh collection link for a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiCustomResponse(DepositCollectionResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection link validated successfully',
  })
  async updateDepositCollection(
    @Param('depositId') depositId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<ApiResponseDto<DepositCollectionResponseDto>> {
    const depositCollection = await this.depositsService.updateDepositCollection(depositId, collectionId);
    return ApiResp.success<DepositCollectionResponseDto>(depositCollection, 'Collection link validated successfully');
  }

  @Delete(':collectionId')
  @ApiOperation({ summary: 'Unlink a collection from a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  async removeDepositCollection(
    @Param('depositId') depositId: string,
    @Param('collectionId') collectionId: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.depositsService.removeDepositCollection(depositId, collectionId);
    return ApiResp.success({ message: 'Collection unlinked' }, 'Collection unlinked successfully');
  }
}
