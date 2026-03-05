import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiUnprocessableEntityResponse,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';

import { RcaResponseDto } from './dto/rca-response.dto';
import { SubObjectResponseDto } from './dto/sub-object-response.dto';
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
import { RcaService } from './rca.service';
import { CreateRcaDto } from './dto/create-rca.dto';
import { UpdateRcaDto } from './dto/update-rca.dto';
import { CreateSubObjectDto } from './dto/create-sub-object.dto';
import { UpdateSubObjectDto } from './dto/update-sub-object.dto';
import { ApiPaginatedResponse, ApiCustomResponse } from '../../common/decorators/api-response.decorator';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@ApiTags('revised-chart-of-accounts')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('rca')
export class RcaController {
  constructor(private readonly rcaService: RcaService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RCA' })
  @ApiCustomResponse(CreateRcaDto, {
    statusCode: HttpStatus.CREATED,
    description: 'RCA created successfully',
  })
  async create(@Body() createRcaDto: CreateRcaDto): Promise<ApiResponseDto<CreateRcaDto>> {
    const result = await this.rcaService.create(createRcaDto);
    return ApiResponse.success(result, 'RCA created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve RCA list with pagination and search' })
  @ApiPaginatedResponse(RcaResponseDto, { description: 'RCAs retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const { data, totalItems } = await this.rcaService.findAll(page, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Revised Chart of Accounts/UACS retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve RCA by ID' })
  @ApiCustomResponse(RcaResponseDto, { description: 'RCA retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'RCA not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<RcaResponseDto>> {
    const rca = await this.rcaService.findOne(id);
    return ApiResponse.success(rca, 'RCA retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update RCA information',
    description: 'Updates an existing RCA by its ID',
  })
  @ApiCustomResponse(RcaResponseDto, { statusCode: HttpStatus.OK, description: 'RCA updated successfully' })
  async update(@Param('id') id: string, @Body() updateRcaDto: UpdateRcaDto) {
    const rca = await this.rcaService.update(id, updateRcaDto);
    return ApiResponse.success(rca, 'RCA updated successfully');
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate RCA (soft delete)',
    description: 'Deactivates an existing RCA by its ID',
  })
  @ApiCustomResponse(RcaResponseDto, { statusCode: HttpStatus.OK, description: 'RCA deactivated successfully' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.rcaService.remove(id);
    return ApiResponse.success(result, 'RCA deactivated successfully');
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import RCAs from Excel/CSV file',
    description:
      'Upload an Excel (.xlsx, .xls) or CSV file to bulk import RCAs. File must contain "name" and "code" columns.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel or CSV file containing RCA data',
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
  @ApiCustomResponse(RcaResponseDto, {
    description: 'File imported successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format, size exceeds limit, or missing required columns',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation errors in file data',
  })
  @UseInterceptors(FileInterceptor('file'))
  async importRcaExcel(
    @CurrentUser('userId') userId: string,
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
    const result = await this.rcaService.import(userId, file);
    return ApiResponse.success(result, 'File imported successfully');
  }

  @Post(':rcaId/sub-objects')
  @ApiOperation({ summary: 'Create a new sub object for an Revised Chart of Account/UACS' })
  @ApiCustomResponse(SubObjectResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Sub object created successfully',
  })
  async createSubObject(@Param('rcaId', ParseUUIDPipe) rcaId: string, @Body() createSubObjectDto: CreateSubObjectDto) {
    const subObject = await this.rcaService.createSubObject(rcaId, createSubObjectDto);
    return ApiResponse.success(subObject, 'Sub object created successfully', HttpStatus.CREATED);
  }

  @Get(':rcaId/sub-objects')
  @ApiOperation({ summary: 'Retrieve sub objects list for an RCA with pagination and search' })
  @ApiPaginatedResponse(SubObjectResponseDto, { description: 'Sub objects retrieved successfully' })
  @ApiNotFoundResponse({ description: 'Parent RCA not found' })
  async findAllSubObjects(@Param('rcaId', ParseUUIDPipe) rcaId: string, @Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const { data, totalItems } = await this.rcaService.findAllSubObjects(rcaId, page, limit, search);
    const totalPages = Math.ceil(totalItems / limit);

    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Sub objects retrieved successfully');
  }

  @Get(':rcaId/sub-objects/:id')
  @ApiOperation({ summary: 'Retrieve sub object by ID' })
  @ApiCustomResponse(SubObjectResponseDto, { description: 'Sub object retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'Sub object not found' })
  async findOneSubObject(@Param('rcaId', ParseUUIDPipe) rcaId: string, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.rcaService.findOneSubObject(rcaId, id);
    return ApiResponse.success(result, 'Sub object retrieved successfully');
  }

  @Patch(':rcaId/sub-objects/:id')
  @ApiOperation({ summary: 'Update sub object information' })
  @ApiCustomResponse(SubObjectResponseDto, { description: 'Sub object updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or UUID format' })
  @ApiNotFoundResponse({ description: 'Sub object not found' })
  @ApiConflictResponse({ description: 'Sub object with the same code already exists for this RCA' })
  async updateSubObject(
    @Param('rcaId', ParseUUIDPipe) rcaId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSubObjectDto: UpdateSubObjectDto,
  ) {
    const result = await this.rcaService.updateSubObject(rcaId, id, updateSubObjectDto);
    return ApiResponse.success(result, 'Sub object updated successfully');
  }

  @Delete(':rcaId/sub-objects/:id')
  @ApiOperation({ summary: 'Deactivate sub object (soft delete)' })
  @ApiCustomResponse(SubObjectResponseDto, { description: 'Sub object deactivated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'Sub object not found' })
  @ApiConflictResponse({ description: 'Sub object is already deactivated' })
  async removeSubObject(@Param('rcaId', ParseUUIDPipe) rcaId: string, @Param('id', ParseUUIDPipe) id: string) {
    const result = await this.rcaService.removeSubObject(rcaId, id);
    return ApiResponse.success(result, 'Sub object deactivated successfully');
  }
}
