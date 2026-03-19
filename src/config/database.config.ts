import fs from 'fs';
import { ConfigService } from '@nestjs/config';

export interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: boolean | { rejectUnauthorized: boolean; ca?: string };
}

export const DATABASE_CONNECTION = 'database_connection';

export const getDatabaseConfig = (configService: ConfigService<Record<string, string>>) => {
  const sslEnv = configService.get('POSTGRES_SSL')?.toLowerCase();

  let ssl: boolean | { rejectUnauthorized: boolean; ca?: string } = false;

  if (sslEnv === 'true') {
    const caPath = '/certs/rds-ca.pem';
    const isRuntime = process.env.RUNTIME_ENV === 'true';

    if (fs.existsSync(caPath)) {
      ssl = {
        rejectUnauthorized: true,
        ca: fs.readFileSync(caPath, 'utf-8'),
      };
    } else if (isRuntime) {
      throw new Error(`RDS CA cert not found at ${caPath} in runtime environment`);
    } else {
      ssl = false;
    }
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
