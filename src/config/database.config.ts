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
  const sslEnv = configService.get('POSTGRES_SSL')?.toLowerCase();

  let ssl: boolean | { rejectUnauthorized: boolean } = false;
  if (sslEnv === 'true') {
    ssl = { rejectUnauthorized: false }; // RDS in VPC
  } else if (sslEnv === 'false') {
    ssl = false; // local dev
  }

  return {
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: parseInt(configService.getOrThrow('POSTGRES_PORT'), 10),
    user: configService.getOrThrow('POSTGRES_USER'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    database: configService.getOrThrow('POSTGRES_DB'),
    ssl,
  };
};
