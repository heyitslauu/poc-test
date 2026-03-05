/**
 * Get maximum file size from environment variable or use default
 * Environment variable should be in MB, will be converted to bytes
 */
export const MAX_FILE_SIZE_BYTES = process.env.DEFAULT_MAX_FILE_SIZE
  ? Number(process.env.DEFAULT_MAX_FILE_SIZE) * 1024 * 1024
  : 5 * 1024 * 1024;
