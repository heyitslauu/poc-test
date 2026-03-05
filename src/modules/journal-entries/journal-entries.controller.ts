import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Delete,
  Param,
  Get,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiSecurity, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { CreateJournalEntriesBatchDto } from './dto/create-journal-entry.dto';
import { JournalEntryResponseDto } from './dto/journal-entry-response.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../../common/utils/api-response.util';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { ApiCustomResponse } from '../../common/decorators/api-response.decorator';
import { MAX_FILE_SIZE_BYTES } from '../../common/constants/file-upload.constants';

@ApiTags('journal-entries')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Post('import/:disbursementId')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'XLSX file to import journal entries',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiCustomResponse(JournalEntryResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Journal entries imported successfully',
  })
  async importJournalEntries(
    @CurrentUser('userId') userId: string,
    @Param('disbursementId') disbursementId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE_BYTES }),
          new FileTypeValidator({ fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<ApiResponseDto<JournalEntryResponseDto[]>> {
    const journalEntries = await this.journalEntriesService.import(userId, disbursementId, file);
    return ApiResponse.success(journalEntries, 'Journal entries imported successfully', HttpStatus.OK);
  }

  @Post()
  @ApiCustomResponse(JournalEntryResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Journal entries created successfully',
  })
  async create(
    @CurrentUser('userId') userId: string,
    @Body() createJournalEntriesBatchDto: CreateJournalEntriesBatchDto,
  ): Promise<ApiResponseDto<JournalEntryResponseDto[]>> {
    const journalEntries = await this.journalEntriesService.create(userId, createJournalEntriesBatchDto);
    return ApiResponse.success<JournalEntryResponseDto[]>(
      journalEntries,
      'Journal entries created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('disbursement/:disbursementId')
  @ApiCustomResponse(JournalEntryResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Journal entries retrieved successfully',
  })
  async findByDV(@Param('disbursementId') disbursementId: string): Promise<ApiResponseDto<JournalEntryResponseDto[]>> {
    const journalEntries = await this.journalEntriesService.findByDV(disbursementId);
    return ApiResponse.success<JournalEntryResponseDto[]>(
      journalEntries,
      'Journal entries retrieved successfully',
      HttpStatus.OK,
    );
  }

  @Delete(':id')
  @ApiCustomResponse(Object, {
    statusCode: HttpStatus.OK,
    description: 'Journal entry deleted successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<null>> {
    await this.journalEntriesService.remove(id);
    return ApiResponse.success<null>(null, 'Journal entry deleted successfully', HttpStatus.OK);
  }
}
