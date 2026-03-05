import { ValidationError } from 'class-validator';
import { ErrorDetail } from '../types/api-response.types';

/**
 * Formats class-validator errors into standardized ErrorDetail objects.
 * @param errors - Array of validation errors from class-validator.
 * @param location - The location of the error (e.g., 'body', 'query', 'param'). Defaults to 'body'.
 * @returns Array of formatted ErrorDetail objects.
 */
export function formatValidationErrors(errors: ValidationError[], location: string = 'body'): ErrorDetail[] {
  return errors.map((err) => ({
    field: err.property,
    value: err.value as unknown,
    issue: Object.values(err.constraints || {}).join(', '),
    location,
  }));
}

/**
 * Safely truncates a number to a specified number of decimal places.
 * Rounds towards zero (truncates).
 * @param num - The number to truncate.
 * @param decimals - The number of decimal places to keep.
 * @returns The truncated number.
 */
export function truncateAmount(num: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return (num < 0 ? Math.ceil(num * factor) : Math.floor(num * factor)) / factor;
}
