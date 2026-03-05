import { Controller, Post, Get, Delete, Patch, Body, HttpStatus, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity, ApiParam } from '@nestjs/swagger';
import { DepositsService } from '../services/deposits.service';
import { CreateDepositJournalEntryDto } from '../dto/create-deposit-journal-entry.dto';
import { UpdateDepositJournalEntryDto } from '../dto/update-deposit-journal-entry.dto';
import { DepositJournalEntryResponseDto } from '../dto/deposit-journal-entry-response.dto';
import { ApiResponse as ApiResp } from '@/common/utils/api-response.util';
import { ApiResponseDto } from '@/common/types/api-response.types';
import { ApiCustomResponse } from '@/common/decorators/api-response.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@/modules/auth/decorators/current-user.decorator';

@ApiTags('deposit-journal-entries')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('deposits/:depositId/journal-entries')
export class DepositJournalEntriesController {
  constructor(private readonly depositsService: DepositsService) {}

  @Post()
  @ApiOperation({ summary: 'Add a journal entry to a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiCustomResponse(DepositJournalEntryResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Journal entry added to deposit successfully',
  })
  async createDepositJournalEntry(
    @CurrentUser('userId') userId: string,
    @Param('depositId') depositId: string,
    @Body() createDepositJournalEntryDto: CreateDepositJournalEntryDto,
  ): Promise<ApiResponseDto<DepositJournalEntryResponseDto>> {
    const depositJournalEntry = await this.depositsService.createDepositJournalEntry(
      userId,
      depositId,
      createDepositJournalEntryDto,
    );
    return ApiResp.success<DepositJournalEntryResponseDto>(
      depositJournalEntry,
      'Journal entry added to deposit successfully',
      HttpStatus.CREATED,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List journal entries for a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiCustomResponse(DepositJournalEntryResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Journal entries retrieved successfully',
  })
  async getDepositJournalEntries(@Param('depositId') depositId: string) {
    const data = await this.depositsService.findAllDepositJournalEntries(depositId);
    return ApiResp.success<DepositJournalEntryResponseDto[]>(data, 'Journal entries retrieved successfully');
  }

  @Patch(':entryId')
  @ApiOperation({ summary: 'Update a journal entry for a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiParam({ name: 'entryId', description: 'Journal Entry ID' })
  @ApiCustomResponse(DepositJournalEntryResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Journal entry updated successfully',
  })
  async updateDepositJournalEntry(
    @Param('depositId') depositId: string,
    @Param('entryId') entryId: string,
    @Body() updateDepositJournalEntryDto: UpdateDepositJournalEntryDto,
  ): Promise<ApiResponseDto<DepositJournalEntryResponseDto>> {
    const depositJournalEntry = await this.depositsService.updateDepositJournalEntry(
      depositId,
      entryId,
      updateDepositJournalEntryDto,
    );
    return ApiResp.success<DepositJournalEntryResponseDto>(depositJournalEntry, 'Journal entry updated successfully');
  }

  @Delete(':entryId')
  @ApiOperation({ summary: 'Remove a journal entry from a deposit' })
  @ApiParam({ name: 'depositId', description: 'Deposit ID' })
  @ApiParam({ name: 'entryId', description: 'Journal Entry ID' })
  async removeDepositJournalEntry(
    @Param('depositId') depositId: string,
    @Param('entryId') entryId: string,
  ): Promise<ApiResponseDto<{ message: string }>> {
    await this.depositsService.removeDepositJournalEntry(depositId, entryId);
    return ApiResp.success({ message: 'Journal entry removed' }, 'Journal entry removed successfully');
  }
}
