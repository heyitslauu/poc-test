import { ConfigService } from '@nestjs/config';

export interface AwsConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  s3: {
    bucketName: string;
    presignedUrlExpiration: number;
    maxFileSize: number;
    basePath: string;
    subFolder: string;
  };
}

export const getAwsConfig = (configService: ConfigService<Record<string, string>>): AwsConfig => {
  const region = configService.get<string>('AWS_REGION') ?? 'ap-southeast-1';
  const accessKeyId = configService.get<string>('AWS_ACCESS_KEY_ID');
  const secretAccessKey = configService.get<string>('AWS_SECRET_ACCESS_KEY');

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('AWS credentials are required');
  }

  return {
    region,
    accessKeyId,
    secretAccessKey,
    s3: {
      bucketName: configService.get<string>('AWS_S3_BUCKET_NAME') ?? 'dev-empowerx',
      presignedUrlExpiration: configService.get<number>('AWS_S3_PRESIGNED_URL_EXPIRATION') ?? 3600,
      maxFileSize: configService.get<number>('AWS_S3_MAX_FILE_SIZE') ?? 10 * 1024 * 1024,
      basePath: configService.get<string>('AWS_S3_BASE_PATH') ?? 'fsds',
      subFolder: configService.get<string>('AWS_S3_SUB_FOLDER') ?? 'imports',
    },
  };
};
