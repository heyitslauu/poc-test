import {
  Controller,
  Post,
  Body,
  HttpStatus,
  UseGuards,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PayeesService } from './payees.service';
import { CreatePayeeDto } from './dto/create-payee.dto';
import { UpdatePayeeDto } from './dto/update-payee.dto';
import { PayeeResponseDto } from './dto/payee-response.dto';
import { ImportPayeesResponseDto } from './dto/import-payee.dto';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../common/decorators/api-response.decorator';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { FileImportUtil } from '../../common/utils/file-import.util';

@ApiTags('payees')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('payees')
export class PayeesController {
  constructor(private readonly payeesService: PayeesService) {}

  @Post()
  @ApiCustomResponse(PayeeResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Payee created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createPayeeDto: CreatePayeeDto,
  ): Promise<ApiResponseDto<PayeeResponseDto>> {
    const payee = await this.payeesService.create(userId, createPayeeDto);
    return ApiResponse.success<PayeeResponseDto>(payee, 'Payee created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve payee list with pagination, search, and filters' })
  @ApiPaginatedResponse(PayeeResponseDto, { description: 'Payees retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const { search, type, tin_no, bank_account_no } = paginationQuery;

    const { data, totalItems } = await this.payeesService.findAll(page, limit, search, type, tin_no, bank_account_no);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Payees retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve payee by ID' })
  @ApiCustomResponse(PayeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payee retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<PayeeResponseDto>> {
    const payee = await this.payeesService.findOne(id);
    return ApiResponse.success<PayeeResponseDto>(payee, 'Payee retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update payee by ID' })
  @ApiCustomResponse(PayeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payee updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updatePayeeDto: UpdatePayeeDto,
  ): Promise<ApiResponseDto<PayeeResponseDto>> {
    const payee = await this.payeesService.update(id, updatePayeeDto);
    return ApiResponse.success<PayeeResponseDto>(payee, 'Payee updated successfully', HttpStatus.OK);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete payee by ID' })
  @ApiCustomResponse(PayeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Payee deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<PayeeResponseDto>> {
    const payee = await this.payeesService.remove(id);
    return ApiResponse.success<PayeeResponseDto>(payee, 'Payee deleted successfully', HttpStatus.OK);
  }

  @Post('import/employees')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import employee payees from Excel or CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel or CSV file containing employee payee data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Excel (.xlsx or .xls) or CSV file with columns: employee_number, tin_no, bank_account_no',
        },
      },
      required: ['file'],
    },
  })
  @ApiCustomResponse(ImportPayeesResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Employee payees imported successfully',
  })
  async importEmployees(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ApiResponseDto<ImportPayeesResponseDto>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileValidationError = FileImportUtil.validateFile(file);
    if (fileValidationError !== null) {
      throw new BadRequestException(fileValidationError.message);
    }

    const result = await this.payeesService.importEmployeesFromFile(userId, file);
    return ApiResponse.success<ImportPayeesResponseDto>(
      result,
      result.failed_rows > 0
        ? `Import completed with ${result.successful_rows.toString()} successful and ${result.failed_rows.toString()} failed rows`
        : `All ${result.successful_rows.toString()} rows imported successfully`,
      HttpStatus.OK,
    );
  }

  @Post('import/non-employees')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import creditor/supplier payees from Excel or CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Excel or CSV file containing creditor/supplier payee data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Excel (.xlsx or .xls) or CSV file with columns: type (CREDITOR|SUPPLIER), name, tin_no, bank_account_no',
        },
      },
      required: ['file'],
    },
  })
  @ApiCustomResponse(ImportPayeesResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Creditor/supplier payees imported successfully',
  })
  async importNonEmployees(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<ApiResponseDto<ImportPayeesResponseDto>> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const fileValidationError = FileImportUtil.validateFile(file);
    if (fileValidationError !== null) {
      throw new BadRequestException(fileValidationError.message);
    }

    const result = await this.payeesService.importNonEmployeesFromFile(userId, file);
    return ApiResponse.success<ImportPayeesResponseDto>(
      result,
      result.failed_rows > 0
        ? `Import completed with ${result.successful_rows.toString()} successful and ${result.failed_rows.toString()} failed rows`
        : `All ${result.successful_rows.toString()} rows imported successfully`,
      HttpStatus.OK,
    );
  }
}
