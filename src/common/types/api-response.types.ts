import { ApiProperty } from '@nestjs/swagger';
import { HttpStatus } from '@nestjs/common';

/**
 * Pagination metadata.
 */
export class PaginationMeta {
  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty()
  hasNextPage: boolean;

  @ApiProperty()
  hasPrevPage: boolean;
}

/**
 * Base metadata for API responses (without pagination).
 */
export class BaseMeta {
  @ApiProperty()
  traceId: string;

  @ApiProperty()
  timestamp: string;

  @ApiProperty({ required: false })
  appliedFilters?: Record<string, unknown>;
}

/**
 * Metadata for paginated API responses.
 */
export class Meta extends BaseMeta {
  @ApiProperty()
  pagination: PaginationMeta;
}

/**
 * Details of an error.
 */
export class ErrorDetail {
  @ApiProperty()
  field: string;

  @ApiProperty()
  value: unknown;

  @ApiProperty()
  issue: string;

  @ApiProperty()
  location: string;
}

/**
 * Information about an error.
 */
export class ErrorInfo {
  @ApiProperty()
  code: string;

  @ApiProperty({ type: [ErrorDetail] })
  details: ErrorDetail[];
}

/**
 * Item in a validation error.
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
}

/**
 * Response structure for HTTP exceptions.
 */
export interface HttpExceptionResponse {
  statusCode: number;
  message: ValidationErrorItem[] | string;
  error: string;
}

/**
 * Abstract Base Data Transfer Object for API responses.
 */
export abstract class ApiResponseBase {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string;

  constructor(success: boolean, statusCode: number, message: string) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
  }
}

/**
 * DTO for successful responses.
 */
export class SuccessResponseDto<T> extends ApiResponseBase {
  @ApiProperty()
  meta: BaseMeta;

  @ApiProperty()
  data: T;

  constructor(statusCode: number, message: string, meta: BaseMeta, data: T) {
    super(true, statusCode, message);
    this.meta = meta;
    this.data = data;
  }
}

/**
 * DTO for paginated responses.
 */
export class PaginationResponseDto<T> extends ApiResponseBase {
  @ApiProperty()
  meta: Meta;

  @ApiProperty({ isArray: true })
  data: T[];

  constructor(statusCode: number, message: string, meta: Meta, data: T[]) {
    super(true, statusCode, message);
    this.meta = meta;
    this.data = data;
  }
}

/**
 * DTO for error responses.
 */
export class ErrorResponseDto extends ApiResponseBase {
  @ApiProperty()
  meta: BaseMeta;

  @ApiProperty()
  error: ErrorInfo;

  constructor(statusCode: number, message: string, meta: BaseMeta, error: ErrorInfo) {
    super(false, statusCode, message);
    this.meta = meta;
    this.error = error;
  }
}

/**
 * DTO for validation error responses.
 */
export class ValidationErrorResponse extends ErrorResponseDto {
  constructor(message: string = 'Validation Failed', details: ErrorDetail[] = []) {
    const meta: BaseMeta = {
      traceId: '',
      timestamp: '',
    };
    const error: ErrorInfo = {
      code: 'VALIDATION_ERROR',
      details,
    };
    super(HttpStatus.UNPROCESSABLE_ENTITY, message, meta, error);
  }
}

/**
 * DTO for basic error responses (without error details).
 */
export class BasicErrorResponseDto extends ApiResponseBase {
  @ApiProperty()
  meta: BaseMeta;

  constructor(statusCode: number, message: string, meta: BaseMeta) {
    super(false, statusCode, message);
    this.meta = meta;
  }
}

/**
 * Union type for any API response
 */
export type ApiResponseDto<T> =
  | SuccessResponseDto<T>
  | PaginationResponseDto<T>
  | ErrorResponseDto
  | BasicErrorResponseDto;
