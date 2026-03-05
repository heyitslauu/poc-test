import { v4 as uuidv4 } from 'uuid';
import { HttpStatus } from '@nestjs/common';
import {
  ApiResponseBase,
  SuccessResponseDto,
  ApiResponseDto,
  BaseMeta,
  Meta,
  PaginationMeta,
  ErrorDetail,
  PaginationResponseDto,
  ErrorResponseDto,
  BasicErrorResponseDto,
} from '../types/api-response.types';

/**
 * Utility class for creating standardized API responses.
 */
export class ApiResponse {
  /**
   * Generate a unique trace ID
   * @returns A unique trace ID string.
   */
  static generateTraceId(): string {
    return uuidv4();
  }

  /**
   * Get current timestamp in ISO format
   * @returns Current timestamp as ISO string.
   */
  static getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Type guard to check if a value is an ApiResponseDto
   * @param value - The value to check.
   * @returns True if the value is an ApiResponseDto instance.
   */
  static isApiResponseDto<T = object>(value: unknown): value is ApiResponseDto<T> {
    return value instanceof ApiResponseBase;
  }

  /**
   * Create basic meta object (without pagination)
   * @param appliedFilters - Optional applied filters.
   * @returns BaseMeta object.
   */
  static createBaseMeta(appliedFilters?: Record<string, unknown>): BaseMeta {
    return {
      traceId: this.generateTraceId(),
      timestamp: this.getCurrentTimestamp(),
      ...(appliedFilters && { appliedFilters }),
    };
  }

  /**
   * Create paginated meta object
   * @param pagination - Pagination metadata.
   * @param appliedFilters - Optional applied filters.
   * @returns Meta object with pagination.
   */
  static createPaginatedMeta(pagination: PaginationMeta, appliedFilters?: Record<string, unknown>): Meta {
    return {
      traceId: this.generateTraceId(),
      timestamp: this.getCurrentTimestamp(),
      pagination,
      ...(appliedFilters && { appliedFilters }),
    };
  }

  /**
   * Create pagination metadata
   * @param currentPage - Current page number.
   * @param totalPages - Total number of pages.
   * @param limit - Number of items per page.
   * @param totalItems - Total number of items.
   * @returns Pagination metadata object.
   */
  static createPaginationMeta(
    currentPage: number,
    totalPages: number,
    limit: number,
    totalItems: number,
  ): PaginationMeta {
    return {
      currentPage,
      totalPages,
      limit,
      totalItems,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    };
  }

  /**
   * Create success response
   * @param data - The data to include in the response.
   * @param message - Response message.
   * @param statusCode - HTTP status code.
   * @param appliedFilters - Optional applied filters.
   * @returns Success response DTO.
   */
  static success<T>(
    data: T,
    message: string = 'Operation successful',
    statusCode: HttpStatus = HttpStatus.OK,
    appliedFilters?: Record<string, unknown>,
  ): SuccessResponseDto<T> {
    return new SuccessResponseDto<T>(statusCode, message, this.createBaseMeta(appliedFilters), data);
  }

  /**
   * Create paginated success response
   * @param data - Array of data items.
   * @param pagination - Pagination metadata.
   * @param message - Response message.
   * @param statusCode - HTTP status code.
   * @param appliedFilters - Optional applied filters.
   * @returns Pagination response DTO.
   */
  static paginatedSuccess<T>(
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Data retrieved successfully',
    statusCode: HttpStatus = HttpStatus.OK,
    appliedFilters?: Record<string, unknown>,
  ): PaginationResponseDto<T> {
    return new PaginationResponseDto<T>(
      statusCode,
      message,
      this.createPaginatedMeta(pagination, appliedFilters),
      data,
    );
  }

  /**
   * Create error response (basic, no details)
   * @param statusCode - HTTP status code.
   * @param message - Error message.
   * @returns Basic error response DTO.
   */
  static error(statusCode: HttpStatus, message: string): BasicErrorResponseDto {
    return new BasicErrorResponseDto(statusCode, message, this.createBaseMeta());
  }

  /**
   * Create validation error response
   * @param details - Array of validation error details.
   * @returns Error response DTO.
   */
  static validationError(details: ErrorDetail[]): ErrorResponseDto {
    return new ErrorResponseDto(HttpStatus.UNPROCESSABLE_ENTITY, 'Validation Failed', this.createBaseMeta(), {
      code: 'VALIDATION_ERROR',
      details,
    });
  }

  /**
   * Create not found error response
   * @param resource - Name of the resource that was not found.
   * @returns Error response DTO.
   */
  static notFound(resource: string = 'Resource'): BasicErrorResponseDto {
    return this.error(HttpStatus.NOT_FOUND, `${resource} not found`);
  }

  /**
   * Create unauthorized error response
   * @param message - Error message.
   * @returns Error response DTO.
   */
  static unauthorized(message: string = 'Unauthorized access'): BasicErrorResponseDto {
    return this.error(HttpStatus.UNAUTHORIZED, message);
  }

  /**
   * Create forbidden error response
   * @param message - Error message.
   * @returns Error response DTO.
   */
  static forbidden(message: string = 'Access forbidden'): BasicErrorResponseDto {
    return this.error(HttpStatus.FORBIDDEN, message);
  }

  /**
   * Create internal server error response
   * @param message - Error message.
   * @returns Error response DTO.
   */
  static internalServerError(message: string = 'Internal server error'): BasicErrorResponseDto {
    return this.error(HttpStatus.INTERNAL_SERVER_ERROR, message);
  }

  /**
   * Create conflict error response (no error details)
   * @param message - Error message.
   * @returns Basic error response DTO.
   */
  static conflict(message: string = 'Conflict'): BasicErrorResponseDto {
    return new BasicErrorResponseDto(HttpStatus.CONFLICT, message, this.createBaseMeta());
  }

  /**
   * Create bad request error response (no error details)
   * @param message - Error message.
   * @returns Basic error response DTO.
   */
  static badRequest(message: string = 'Bad Request'): BasicErrorResponseDto {
    return new BasicErrorResponseDto(HttpStatus.BAD_REQUEST, message, this.createBaseMeta());
  }

  /**
   * Create payload too large error response
   * @param message - Error message.
   * @returns Basic error response DTO.
   */
  static payloadTooLarge(message: string = 'Payload Too Large'): BasicErrorResponseDto {
    return new BasicErrorResponseDto(HttpStatus.PAYLOAD_TOO_LARGE, message, this.createBaseMeta());
  }
}
