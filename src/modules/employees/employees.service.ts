import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, sql, or, ilike, count, and } from 'drizzle-orm';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { DATABASE_CONNECTION } from '../../config/database.config';
import * as schema from '../../database/schemas';
import { employees, NewEmployee } from '../../database/schemas';
import { plainToInstance } from 'class-transformer';
import { EmployeeResponseDto } from './dto/employee-response.dto';

@Injectable()
export class EmployeesService {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    return await this.db.transaction(async (tx) => {
      if (createEmployeeDto.user_id) {
        const existingUserIdEmployee = await tx
          .select()
          .from(employees)
          .where(eq(employees.user_id, createEmployeeDto.user_id));
        if (existingUserIdEmployee.length > 0) {
          throw new UnprocessableEntityException(`Employee with User ID ${createEmployeeDto.user_id} already exists`);
        }
      }

      if (createEmployeeDto.employee_number) {
        const existingEmployeeNumber = await tx
          .select()
          .from(employees)
          .where(eq(employees.employee_number, createEmployeeDto.employee_number));

        if (existingEmployeeNumber.length > 0) {
          throw new UnprocessableEntityException(
            `Employee with Employee Number ${createEmployeeDto.employee_number} already exists`,
          );
        }
      }

      const [employee] = await tx
        .insert(employees)
        .values({
          ...(createEmployeeDto.user_id ? { user_id: createEmployeeDto.user_id } : {}),
          employee_number: createEmployeeDto.employee_number ?? null,
          first_name: createEmployeeDto.first_name,
          middle_name: createEmployeeDto.middle_name ?? null,
          last_name: createEmployeeDto.last_name,
          extension_name: createEmployeeDto.extension_name ?? null,
        } as NewEmployee)
        .returning();

      return plainToInstance(EmployeeResponseDto, employee);
    });
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    is_active?: boolean,
  ): Promise<{ data: EmployeeResponseDto[]; totalItems: number }> {
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(sql`COALESCE(${employees.employee_number}, '')`, `%${search}%`),
          ilike(employees.first_name, `%${search}%`),
          ilike(employees.last_name, `%${search}%`),
        )
      : undefined;

    const filterCondition = is_active !== undefined ? eq(employees.is_active, is_active) : undefined;

    const whereCondition = and(searchCondition, filterCondition);

    const [employeesList, [{ value: totalItems }]] = await Promise.all([
      this.db.select().from(employees).where(whereCondition).limit(limit).offset(offset),
      this.db.select({ value: count() }).from(employees).where(whereCondition),
    ]);

    return { data: plainToInstance(EmployeeResponseDto, employeesList), totalItems };
  }

  async findOne(id: string) {
    const result = await this.db.select().from(employees).where(eq(employees.id, id));

    if (result.length === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return plainToInstance(EmployeeResponseDto, result[0]);
  }

  async remove(id: string) {
    const existingEmployee = await this.db.select().from(employees).where(eq(employees.id, id));

    if (existingEmployee.length === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const result = await this.db.update(employees).set({ is_active: false }).where(eq(employees.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to deactivate employee with ID ${id}`);
    }

    return plainToInstance(EmployeeResponseDto, result[0]);
  }

  async activate(id: string) {
    const existingEmployee = await this.db.select().from(employees).where(eq(employees.id, id));

    if (existingEmployee.length === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    const result = await this.db.update(employees).set({ is_active: true }).where(eq(employees.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to activate employee with ID ${id}`);
    }

    return plainToInstance(EmployeeResponseDto, result[0]);
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    const existingEmployee = await this.db.select().from(employees).where(eq(employees.id, id));

    if (existingEmployee.length === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    if (updateEmployeeDto.user_id && updateEmployeeDto.user_id !== existingEmployee[0].user_id) {
      const existingUserIdEmployee = await this.db
        .select()
        .from(employees)
        .where(eq(employees.user_id, updateEmployeeDto.user_id));

      if (existingUserIdEmployee.length > 0) {
        throw new UnprocessableEntityException(`Employee with User ID ${updateEmployeeDto.user_id} already exists`);
      }
    }

    if (
      updateEmployeeDto.employee_number !== undefined &&
      updateEmployeeDto.employee_number &&
      updateEmployeeDto.employee_number !== existingEmployee[0].employee_number
    ) {
      const existingEmployeeNumber = await this.db
        .select()
        .from(employees)
        .where(eq(employees.employee_number, updateEmployeeDto.employee_number));

      if (existingEmployeeNumber.length > 0) {
        throw new UnprocessableEntityException(
          `Employee with Employee Number ${updateEmployeeDto.employee_number} already exists`,
        );
      }
    }

    const updateData: Partial<NewEmployee> = {};

    if (updateEmployeeDto.user_id) updateData.user_id = updateEmployeeDto.user_id;
    if (updateEmployeeDto.employee_number !== undefined)
      updateData.employee_number = updateEmployeeDto.employee_number ?? null;
    if (updateEmployeeDto.first_name) updateData.first_name = updateEmployeeDto.first_name;
    if (updateEmployeeDto.middle_name !== undefined) updateData.middle_name = updateEmployeeDto.middle_name ?? null;
    if (updateEmployeeDto.last_name) updateData.last_name = updateEmployeeDto.last_name;
    if (updateEmployeeDto.extension_name !== undefined)
      updateData.extension_name = updateEmployeeDto.extension_name ?? null;

    const result = await this.db.update(employees).set(updateData).where(eq(employees.id, id)).returning();

    if (result.length === 0) {
      throw new NotFoundException(`Unable to update employee with ID ${id}`);
    }

    return plainToInstance(EmployeeResponseDto, result[0]);
  }
}
