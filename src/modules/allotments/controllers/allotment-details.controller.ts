import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  UseGuards,
  HttpCode,
  Patch,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiSecurity,
  ApiTags,
  ApiOperation,
  ApiNoContentResponse,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AllotmentDetailsService } from '../services';
import { CreateAllotmentDetailDto } from '../dto/create-allotment-detail.dto';
import { CreateAllotmentDetailBodyDto } from '../dto/create-allotment-detail-body.dto';
import { AllotmentDetailResponseDto } from '../dto/allotment-detail-response.dto';
import { AllotmentDetailsPaginationQueryDto } from '../dto/allotment-details-pagination.dto';
import { ImportAllotmentDetailsResponseDto } from '../dto/import-allotment-details.dto';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../../common/decorators/api-response.decorator';
import { ApiResponseDto } from '../../../common/types/api-response.types';
import { ApiResponse } from '../../../common/utils/api-response.util';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UpdateAllotmentDetailDto } from '../dto/update-allotment-detail.dto';
import { FileImportUtil } from '../../../common/utils/file-import.util';

@ApiTags('allotment-details')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('allotments/:allotmentId/details')
export class AllotmentDetailsController {
  constructor(private readonly allotmentDetailsService: AllotmentDetailsService) {}

  @Post()
  @ApiOperation({ summary: 'Create allotment detail' })
  @ApiCustomResponse(AllotmentDetailResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Allotment detail created successfully',
  })
  async create(
    @Param('allotmentId') allotmentId: string,
    @CurrentUser('userId') userId: string,
    @Body() createAllotmentDetailBodyDto: CreateAllotmentDetailBodyDto,
  ): Promise<ApiResponseDto<AllotmentDetailResponseDto>> {
    const createAllotmentDetailDto: CreateAllotmentDetailDto = {
      allotment_id: allotmentId,
      office_id: createAllotmentDetailBodyDto.office_id,
      pap_id: createAllotmentDetailBodyDto.pap_id,
      rca_id: createAllotmentDetailBodyDto.rca_id,
      rca_sub_object_id: createAllotmentDetailBodyDto.rca_sub_object_id,
      amount: createAllotmentDetailBodyDto.amount,
    };
    const detail = await this.allotmentDetailsService.create(userId, createAllotmentDetailDto);
    return ApiResponse.success<AllotmentDetailResponseDto>(
      detail,
      'Allotment detail created successfully',
      HttpStatus.CREATED,
    );
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import allotment details from Excel file' })
  @ApiParam({ name: 'allotmentId', description: 'ID of the allotment' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel file containing allotment details',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel file (.xlsx or .xls) with columns: office_code, pap_code, rca_code, amount',
        },
      },
      required: ['file'],
    },
  })
  @ApiCustomResponse(ImportAllotmentDetailsResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment details imported successfully',
  })
  async import(
    @Param('allotmentId') allotmentId: string,
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ApiResponseDto<ImportAllotmentDetailsResponseDto>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const fileValidationError = FileImportUtil.validateFile(file);

    if (fileValidationError !== null) {
      throw new BadRequestException(fileValidationError.message);
    }

    const result = await this.allotmentDetailsService.importFromFile(allotmentId, userId, file);
    return ApiResponse.success<ImportAllotmentDetailsResponseDto>(
      result,
      result.failed_rows > 0
        ? `Import completed with ${result.successful_rows.toString()} successful and ${result.failed_rows.toString()} failed rows`
        : `All ${result.successful_rows.toString()} rows imported successfully`,
      HttpStatus.OK,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve allotment details list with pagination' })
  @ApiPaginatedResponse(AllotmentDetailResponseDto, { description: 'Allotment details retrieved successfully' })
  async findAll(
    @Param('allotmentId') allotmentId: string,
    @Query() paginationQuery: AllotmentDetailsPaginationQueryDto,
  ) {
    const { data, totalItems } = await this.allotmentDetailsService.findAll(allotmentId, paginationQuery);
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(data, pagination, 'Allotment details retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update allotment detail' })
  @ApiCustomResponse(AllotmentDetailResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Allotment detail updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateAllotmentDetailDto: UpdateAllotmentDetailDto,
  ): Promise<ApiResponseDto<AllotmentDetailResponseDto>> {
    const detail = await this.allotmentDetailsService.update(id, updateAllotmentDetailDto);
    return ApiResponse.success<AllotmentDetailResponseDto>(
      detail,
      'Allotment detail updated successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete allotment detail' })
  @ApiNoContentResponse({
    description: 'Allotment detail deleted successfully',
  })
  async delete(@Param('id') id: string): Promise<void> {
    await this.allotmentDetailsService.delete(id);
  }
}
