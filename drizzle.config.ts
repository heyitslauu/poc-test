import { defineConfig } from 'drizzle-kit';
import fs from 'fs';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schemas/*.schema.ts',
  out: './src/database/migrations',
  dbCredentials: {
    host: process.env.POSTGRES_HOST as string,
    port: Number(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER as string,
    password: process.env.POSTGRES_PASSWORD as string,
    database: process.env.POSTGRES_DB as string,
    ssl: {
      rejectUnauthorized: true,
      ca: fs.readFileSync('/app/certs/global-bundle.pem', 'utf-8'),
    },
  },
});
