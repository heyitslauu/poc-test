import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiParam, ApiNoContentResponse } from '@nestjs/swagger';
import { CollectionDetailsService } from '../services/collection-details.service';
import { CreateCollectionDetailBodyDto } from '../dto/create-collection-detail-body.dto';
import { CreateCollectionDetailDto } from '../dto/create-collection-detail.dto';
import { CollectionDetailResponseDto } from '../dto/collection-detail-response.dto';
import { CollectionDetailsPaginationQueryDto } from '../dto/collection-details-pagination.dto';
import { UpdateCollectionDetailDto } from '../dto/update-collection-detail.dto';
import { ApiResponse, ApiResponseDto, ApiCustomResponse, ApiPaginatedResponse } from '@/common';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators';

@ApiTags('collection-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('collections/:collectionId/details')
export class CollectionDetailsController {
  constructor(private readonly collectionDetailsService: CollectionDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create collection detail' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiCustomResponse(CollectionDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Collection detail created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Param('collectionId') collectionId: string,
    @Body() createCollectionDetailBodyDto: CreateCollectionDetailBodyDto,
  ): Promise<ApiResponseDto<CollectionDetailResponseDto>> {
    const createCollectionDetailDto: CreateCollectionDetailDto = {
      collection_id: collectionId,
      paps_id: createCollectionDetailBodyDto.paps_id,
      payee_type: createCollectionDetailBodyDto.payee_type,
      payee_id: createCollectionDetailBodyDto.payee_id,
      uacs_id: createCollectionDetailBodyDto.uacs_id,
      debit: createCollectionDetailBodyDto.debit,
      credit: createCollectionDetailBodyDto.credit,
    };

    const collectionDetail = await this.collectionDetailsService.create(userId, createCollectionDetailDto);
    return ApiResponse.success<CollectionDetailResponseDto>(
      collectionDetail,
      'Collection detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve collection details list with pagination and filters' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiPaginatedResponse(CollectionDetailResponseDto, {
    description: 'Collection details retrieved successfully',
  })
  async findAll(
    @Param('collectionId') collectionId: string,
    @Query() paginationQuery: CollectionDetailsPaginationQueryDto,
  ) {
    const { data, totalItems } = await this.collectionDetailsService.findAll(collectionId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Collection details retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single collection detail by ID' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiParam({ name: 'id', description: 'Collection detail ID' })
  @ApiCustomResponse(CollectionDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection detail retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<CollectionDetailResponseDto>> {
    const collectionDetail = await this.collectionDetailsService.findOne(id);
    return ApiResponse.success<CollectionDetailResponseDto>(
      collectionDetail,
      'Collection detail retrieved successfully',
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a collection detail by ID' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiParam({ name: 'id', description: 'Collection detail ID' })
  @ApiCustomResponse(CollectionDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Collection detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDetailDto: UpdateCollectionDetailDto,
  ): Promise<ApiResponseDto<CollectionDetailResponseDto>> {
    const collectionDetail = await this.collectionDetailsService.update(id, updateCollectionDetailDto);
    return ApiResponse.success<CollectionDetailResponseDto>(collectionDetail, 'Collection detail updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a collection detail by ID' })
  @ApiParam({ name: 'collectionId', description: 'Collection ID' })
  @ApiParam({ name: 'id', description: 'Collection detail ID' })
  @ApiNoContentResponse({
    description: 'Collection detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.collectionDetailsService.delete(id);
  }
}
