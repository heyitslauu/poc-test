import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getAwsConfig, AwsConfig } from '../../config/aws.config';

export interface UploadResult {
  key: string;
  bucket: string;
  url: string;
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly awsConfig: AwsConfig;

  constructor(private readonly configService: ConfigService) {
    this.awsConfig = getAwsConfig(configService);
    this.s3Client = new S3Client({
      region: this.awsConfig.region,
      credentials: {
        accessKeyId: this.awsConfig.accessKeyId,
        secretAccessKey: this.awsConfig.secretAccessKey,
      },
    });
  }

  /**
   * Upload a file to S3
   */
  async upload(file: Express.Multer.File, customKey?: string): Promise<UploadResult> {
    const { bucketName, basePath, subFolder } = this.awsConfig.s3;
    const timestamp = Date.now();
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = customKey ?? `${basePath}/${subFolder}/${timestamp.toString()}-${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    return {
      key,
      bucket: bucketName,
      url: `https://${bucketName}.s3.${this.awsConfig.region}.amazonaws.com/${key}`,
    };
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async getSignedUrl(key: string, expiresIn?: number): Promise<string> {
    const { bucketName, presignedUrlExpiration } = this.awsConfig.s3;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn ?? presignedUrlExpiration,
    });
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getUploadSignedUrl(key: string, contentType: string, expiresIn?: number): Promise<string> {
    const { bucketName, presignedUrlExpiration } = this.awsConfig.s3;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresIn ?? presignedUrlExpiration,
    });
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(key: string): Promise<void> {
    const { bucketName } = this.awsConfig.s3;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * Generate the full S3 key path for imports
   */
  generateImportKey(filename: string): string {
    const { basePath, subFolder } = this.awsConfig.s3;
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `${basePath}/${subFolder}/${timestamp.toString()}-${sanitizedFilename}`;
  }
}
