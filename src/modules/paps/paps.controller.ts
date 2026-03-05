import {
  ApiTags,
  ApiOperation,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiBearerAuth,
  ApiSecurity,
  ApiConsumes,
  ApiBody,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { PapResponseDto } from './dto/pap-response.dto';
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
import { UseGuards } from '@nestjs/common';
import { PapsService } from './paps.service';
import { CreatePapDto } from './dto/create-pap.dto';
import { UpdatePapDto } from './dto/update-pap.dto';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiPaginatedResponse, ApiCustomResponse } from '../../common/decorators/api-response.decorator';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators';

@ApiTags('paps')
@Controller('paps')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
export class PapsController {
  constructor(private readonly papsService: PapsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new PAP' })
  @ApiCustomResponse(PapResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'PAP created successfully',
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'PAP with the same code already exists' })
  async create(@Body() createPapDto: CreatePapDto) {
    const result = await this.papsService.create(createPapDto);
    return ApiResponse.success(result, 'PAP created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve PAP list with pagination and search' })
  @ApiPaginatedResponse(PapResponseDto, { description: 'PAPs retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const { data, totalItems } = await this.papsService.findAll(page, limit, search);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Revised Chart of Accounts/UACS retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve PAP by ID' })
  @ApiCustomResponse(PapResponseDto, { description: 'PAP retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'PAP not found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.papsService.findOne(id);
    return ApiResponse.success(result, 'PAP retrieved successfully', HttpStatus.OK);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update PAP information' })
  @ApiCustomResponse(PapResponseDto, { description: 'PAP updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid input data or UUID format' })
  @ApiNotFoundResponse({ description: 'PAP not found' })
  @ApiConflictResponse({ description: 'PAP with the same code already exists' })
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() updatePapDto: UpdatePapDto) {
    const result = await this.papsService.update(id, updatePapDto);
    return ApiResponse.success(result, 'PAP updated successfully', HttpStatus.OK);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate PAP (soft delete)' })
  @ApiCustomResponse(PapResponseDto, { description: 'PAP deactivated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid UUID format' })
  @ApiNotFoundResponse({ description: 'PAP not found' })
  @ApiConflictResponse({ description: 'PAP is already deactivated' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.papsService.remove(id);
    return ApiResponse.success(result, 'PAP deactivated successfully', HttpStatus.OK);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import PAPs from Excel/CSV file',
    description:
      'Upload an Excel (.xlsx, .xls) or CSV file to bulk import PAPs. File must contain "name" and "code" columns.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel or CSV file containing PAP data',
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
  @ApiCustomResponse(PapResponseDto, {
    description: 'File imported successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid file format, size exceeds limit, or missing required columns',
  })
  @ApiUnprocessableEntityResponse({
    description: 'Validation errors in file data',
  })
  @UseInterceptors(FileInterceptor('file'))
  async importPapExcel(
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
    const result = await this.papsService.import(userId, file);
    return ApiResponse.success(result, 'File imported successfully');
  }
}
