import { ConfigService } from '@nestjs/config';

export interface CorsConfig {
  origin: string | string[];
  methods: string[];
  allowedHeaders: string[];
  credentials: boolean;
}

export const getCorsConfig = (configService: ConfigService): CorsConfig => ({
  origin: configService
    .getOrThrow<string>('CORS_ORIGIN')
    .split(',')
    .map((item) => item.trim()),
  methods: configService
    .getOrThrow<string>('CORS_METHODS')
    .split(',')
    .map((item) => item.trim()),
  allowedHeaders: configService
    .getOrThrow<string>('CORS_ALLOWED_HEADERS')
    .split(',')
    .map((item) => item.trim()),
  credentials: configService.get<string>('CORS_CREDENTIALS') !== 'false',
});
