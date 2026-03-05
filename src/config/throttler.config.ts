import { ConfigService } from '@nestjs/config';

export interface ThrottlerConfig {
  ttl: number;
  limit: number;
  isDev: boolean;
}

export const getThrottlerConfig = (configService: ConfigService<Record<string, string>>): ThrottlerConfig => {
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isDev = nodeEnv === 'development';

  const ttlValue = configService.get<string>('THROTTLE_TTL') ?? '60000';
  const limitValue = configService.get<string>('THROTTLE_LIMIT') ?? '10';

  const ttl = Number.parseInt(ttlValue, 10);
  const limit = Number.parseInt(limitValue, 10);

  return {
    ttl: Number.isNaN(ttl) ? 60000 : ttl,
    limit: Number.isNaN(limit) ? 10 : limit,
    isDev,
  };
};
