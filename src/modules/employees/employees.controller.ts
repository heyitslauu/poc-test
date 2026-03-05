import { Controller, Post, Get, Patch, Delete, Query, Body, Param, HttpStatus, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { ApiResponse } from '../../common/utils/api-response.util';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { ApiResponseDto } from '../../common/types/api-response.types';
import { ApiCustomResponse, ApiPaginatedResponse } from '../../common/decorators/api-response.decorator';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('employees')
@ApiBearerAuth()
@ApiSecurity('cognito')
@UseGuards(JwtAuthGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Public()
  @ApiCustomResponse(EmployeeResponseDto, {
    statusCode: HttpStatus.CREATED,
    description: 'Employee created successfully',
  })
  async create(@Body() createEmployeeDto: CreateEmployeeDto): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.create(createEmployeeDto);
    return ApiResponse.success<EmployeeResponseDto>(employee, 'Employee created successfully', HttpStatus.CREATED);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve employee list with pagination and search' })
  @ApiPaginatedResponse(EmployeeResponseDto, { description: 'Employees retrieved successfully' })
  async findAll(@Query() paginationQuery: PaginationQueryDto) {
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const search = paginationQuery.search;
    const is_active = paginationQuery.is_active;
    const { data, totalItems } = await this.employeesService.findAll(page, limit, search, is_active);
    const totalPages = Math.ceil(totalItems / limit);
    const pagination = ApiResponse.createPaginationMeta(page, totalPages, limit, totalItems);
    return ApiResponse.paginatedSuccess(data, pagination, 'Employees retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve employee by ID' })
  @ApiCustomResponse(EmployeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Employee retrieved successfully',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.findOne(id);
    return ApiResponse.success<EmployeeResponseDto>(employee, 'Employee retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee by ID' })
  @ApiCustomResponse(EmployeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Employee updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.update(id, updateEmployeeDto);
    return ApiResponse.success<EmployeeResponseDto>(employee, 'Employee updated successfully');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate employee by ID' })
  @ApiCustomResponse(EmployeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Employee deactivated successfully',
  })
  async remove(@Param('id') id: string): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.remove(id);
    return ApiResponse.success<EmployeeResponseDto>(employee, 'Employee deactivated successfully');
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate employee by ID' })
  @ApiCustomResponse(EmployeeResponseDto, {
    statusCode: HttpStatus.OK,
    description: 'Employee activated successfully',
  })
  async activate(@Param('id') id: string): Promise<ApiResponseDto<EmployeeResponseDto>> {
    const employee = await this.employeesService.activate(id);
    return ApiResponse.success<EmployeeResponseDto>(employee, 'Employee activated successfully');
  }
}
