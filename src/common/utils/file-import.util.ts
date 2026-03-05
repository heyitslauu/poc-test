import * as XLSX from 'xlsx';
import { ApiResponse } from './api-response.util';
import { BasicErrorResponseDto } from '../types/api-response.types';

export interface FileValidationOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
}

export interface ParsedExcelData<T = Record<string, string>> {
  data: T[];
  headers: Record<string, string>;
}

export class FileImportUtil {
  private static readonly DEFAULT_ALLOWED_MIME_TYPES = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
  ];

  private static getDefaultMaxFileSize(): number {
    const envSize = process.env.DEFAULT_MAX_FILE_SIZE;
    return envSize ? Number(envSize) * 1024 * 1024 : 5 * 1024 * 1024;
  }

  /**
   * Normalize string to lowercase and trim whitespace
   */
  static normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * Validate file size and mime type
   */
  static validateFile(file: Express.Multer.File, options?: FileValidationOptions): BasicErrorResponseDto | null {
    const maxFileSize = options?.maxFileSize || this.getDefaultMaxFileSize();
    const allowedMimeTypes = options?.allowedMimeTypes || this.DEFAULT_ALLOWED_MIME_TYPES;

    if (file.size > maxFileSize) {
      return ApiResponse.payloadTooLarge(
        `File size exceeds the maximum limit of ${Math.round(maxFileSize / (1024 * 1024)).toString()}MB`,
      );
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
      return ApiResponse.badRequest('Invalid file type. Only Excel files (.xlsx, .xls) and CSV files are allowed');
    }

    return null;
  }

  /**
   * Parse Excel file to JSON
   */
  static parseExcelFile<T = Record<string, string>>(file: Express.Multer.File): ParsedExcelData<T> | null {
    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<T>(worksheet, {
        defval: '',
        raw: false,
      });

      if (data.length === 0) {
        return null;
      }

      const headers = data[0] as Record<string, string>;
      const normalizedHeaderMap: Record<string, string> = {};

      Object.keys(headers).forEach((key) => {
        normalizedHeaderMap[this.normalize(key)] = key;
      });

      return {
        data,
        headers: normalizedHeaderMap,
      };
    } catch {
      return null;
    }
  }

  /**
   * Validate required columns exist in the parsed data
   */
  static validateRequiredColumns(
    normalizedHeaders: Record<string, string>,
    requiredColumns: string[],
  ): BasicErrorResponseDto | null {
    const missingColumns = requiredColumns.filter((col) => !(col in normalizedHeaders));

    if (missingColumns.length > 0) {
      return ApiResponse.badRequest(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    return null;
  }

  /**
   * Map raw row data to DTO using normalized header mapping
   */
  static mapRowToDto(row: Record<string, string>, normalizedHeaders: Record<string, string>, fields: string[]) {
    const mapped: Record<string, string> = {};

    fields.forEach((field) => {
      mapped[field] = row[normalizedHeaders[field]] || '';
    });

    return mapped;
  }
}
