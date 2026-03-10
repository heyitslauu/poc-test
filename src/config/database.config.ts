import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean };
}

export const DATABASE_CONNECTION = 'database_connection';

export const getDatabaseConfig = (configService: ConfigService<Record<string, string>>): DatabaseConfig => {
  const isProduction = process.env.NODE_ENV === 'production';
  const envSsl = configService.get('POSTGRES_SSL');

  const ssl = envSsl ? { rejectUnauthorized: false } : isProduction ? { rejectUnauthorized: false } : false;
  return {
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: parseInt(configService.getOrThrow('POSTGRES_PORT'), 10),
    user: configService.getOrThrow('POSTGRES_USER'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    database: configService.getOrThrow('POSTGRES_DB'),
    ssl: ssl,
  };
};
