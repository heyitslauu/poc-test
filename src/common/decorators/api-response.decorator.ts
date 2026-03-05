import { applyDecorators, Type, HttpStatus } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiAcceptedResponse,
  ApiNoContentResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { SuccessResponseDto, PaginationResponseDto } from '../types/api-response.types';

/**
 * Options for custom API response decorator
 */
interface ApiCustomResponseOptions {
  statusCode?: HttpStatus;
  description?: string;
}

/**
 * Get the appropriate Swagger response decorator based on status code
 */
const getResponseDecorator = (statusCode: HttpStatus = HttpStatus.OK) => {
  switch (statusCode) {
    case HttpStatus.OK:
      return ApiOkResponse;
    case HttpStatus.CREATED:
      return ApiCreatedResponse;
    case HttpStatus.ACCEPTED:
      return ApiAcceptedResponse;
    case HttpStatus.NO_CONTENT:
      return ApiNoContentResponse;
    default:
      return ApiOkResponse;
  }
};

/**
 * Decorator for a successful API response.
 * Wraps the response in the standard ApiResponseDto structure.
 * @param model - The DTO class of the data being returned.
 * @param options - Optional configuration (statusCode, description).
 */
export const ApiCustomResponse = (model: Type<object>, options?: ApiCustomResponseOptions) => {
  const { statusCode = HttpStatus.OK, description } = options || {};
  const ResponseDecorator = getResponseDecorator(statusCode);

  return applyDecorators(
    ApiExtraModels(SuccessResponseDto, model),
    ResponseDecorator({
      description: description || 'Successful response',
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: {
                $ref: getSchemaPath(model),
              },
            },
          },
        ],
      },
    }),
  );
};

/**
 * Decorator for a paginated API response.
 * Wraps the response in the standard PaginationResponseDto structure.
 * @param model - The DTO class of the data items being returned.
 * @param options - Optional configuration (description).
 */
export const ApiPaginatedResponse = (model: Type<object>, options?: { description?: string }) => {
  const { description } = options || {};

  return applyDecorators(
    ApiExtraModels(PaginationResponseDto, model),
    ApiOkResponse({
      description: description || 'Paginated data retrieved successfully',
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginationResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
            },
          },
        ],
      },
    }),
  );
};
