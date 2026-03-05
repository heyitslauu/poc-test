import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { OfficeResponseDto } from './dto/office-response.dto';
import { MAX_FILE_SIZE_BYTES } from '../../common/constants/file-upload.constants';
import {
  Controller,
  Body,
  Param,
  Get,
  Query,
  Post,
  Delete,
  Patch,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
  HttpStatus,
} from '@nestjs/common';
import { OfficesService } from './offices.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { ApiPaginatedResponse, ApiCustomResponse } from '../../common/decorators/api-response.decorator';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiResponseDto } from '../../common/types/api-response.types';

@ApiTags('offices')
@Controller('offices')
export class OfficesController {
  constructor(private readonly officesService: OfficesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new office' })
  @ApiCustomResponse(OfficeResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Office created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'Office with the same code already exists' })
  async create(@Body() createOfficeDto: CreateOfficeDto): Promise<ApiResponseDto<OfficeResponseDto>> {
    const office = await this.officesService.create(createOfficeDto);
    return ApiResponse.success(office, 'Office created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve office list with pagination and search' })
  @ApiPaginatedResponse(OfficeResponseDto, { description: 'Offices retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;

    const { data, totalItems } = await this.officesService.findAll(page, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);

    return ApiResponse.paginatedSuccess(
      data,
      pagination,
      'Offices retrieved successfully',
      HttpStatus.OK,
      search ? { search } : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve office by ID' })
  @ApiCustomResponse(OfficeResponseDto, { description: 'Office retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'Office not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<OfficeResponseDto>> {
    const office = await this.officesService.findOne(id);
    return ApiResponse.success(office, 'Office retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update office information' })
  @ApiCustomResponse(OfficeResponseDto, { description: 'Office updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or UUID format' })
  @ApiNotFoundResponse({ description: 'Office not found' })
  @ApiConflictResponse({ description: 'Office with the same code already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOfficeDto: UpdateOfficeDto,
  ): Promise<ApiResponseDto<OfficeResponseDto>> {
    const office = await this.officesService.update(id, updateOfficeDto);
    return ApiResponse.success(office, 'Office updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate office (soft delete)' })
  @ApiCustomResponse(OfficeResponseDto, { description: 'Office deactivated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'Office not found' })
  @ApiConflictResponse({ description: 'Office is already deactivated' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponseDto<OfficeResponseDto>> {
    const office = await this.officesService.remove(id);
    return ApiResponse.success(office, 'Office deactivated successfully');
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import offices from Excel/CSV file',
    description:
      'Upload an Excel (.xlsx, .xls) or CSV file to bulk import offices. File must contain "name" and "code" columns.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel or CSV file containing office data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel (.xlsx, .xls) or CSV file (max 25MB)',
        },
      },
    },
  })
  @ApiCustomResponse(OfficeResponseDto, {
    description: 'File imported successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format, size exceeds limit, or missing required columns',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation errors in file data',
  })
  @UseInterceptors(FileInterceptor('file'))
  async importOfficeExcel(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
          new FileTypeValidator({
            fileType:
              /(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv)$/,
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const results = await this.officesService.import(file);

    if (results.failed.length > 0) {
      return ApiResponse.success(
        results.successful,
        `Partially imported: ${results.successful.length.toString()} succeeded, ${results.failed.length.toString()} failed`,
      );
    }

    return ApiResponse.success(
      results.successful,
      `Successfully imported ${results.successful.length.toString()} office(s)`,
    );
  }
}
