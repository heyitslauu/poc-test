import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe, UnprocessableEntityException } from '@nestjs/common';
import helmet from 'helmet';
import { Logger } from 'pino-nestjs';
import { AppModule } from './app.module';
import { getCorsConfig } from './config/cors.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponse } from './common/utils/api-response.util';
import { formatValidationErrors } from './common/utils/validation.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = app.get(Logger);

  const cognitoDomain = configService.get<string>('AWS_COGNITO_DOMAIN')?.replace(/(^https?:\/\/)|(\/$)/g, '') ?? '';
  const port = process.env.PORT ?? '3000';
  const appUrl = configService.get<string>('APP_URL') ?? `http://localhost:${port}`;

  app.useLogger(logger);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'validator.swagger.io'],
          connectSrc: ["'self'", ...(cognitoDomain ? [`https://${cognitoDomain}`] : [])],
        },
      },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    }),
  );

  const corsOptions = getCorsConfig(configService);
  app.enableCors(corsOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = formatValidationErrors(errors);
        const errorResponse = ApiResponse.validationError(formattedErrors);
        throw new UnprocessableEntityException(errorResponse);
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('EMPOWERX FSDS API')
    .setDescription('API documentation for EMPOWERX FSDS (Financial Services Database System).')
    .setVersion('1.0')
    .addBearerAuth()
    .addOAuth2(
      {
        type: 'oauth2',
        flows: {
          authorizationCode: {
            authorizationUrl: `https://${cognitoDomain}/oauth2/authorize`,
            tokenUrl: `https://${cognitoDomain}/oauth2/token`,
            scopes: {
              openid: 'OpenID',
              profile: 'Profile',
              email: 'Email',
            },
          },
        },
      },
      'cognito',
    )
    .build();
  const documentFactory = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory, {
    swaggerOptions: {
      oauth: {
        appName: 'EMPOWERX FSDS API',
        scopes: ['openid', 'profile', 'email'],
        usePkceWithAuthorizationCodeGrant: true,
        useBasicAuthenticationWithAccessCodeGrant: true,
      },
      persistAuthorization: true,
      oauth2RedirectUrl: `${appUrl}/docs/oauth2-redirect.html`,
    },
  });

  logger.log(`Swagger UI is available at ${appUrl}/docs`);
  logger.log(
    `Ensure this Return URL is added to your Cognito App Client settings: ${appUrl}/docs/oauth2-redirect.html`,
  );

  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation available at: http://localhost:${port}/docs`);
}
void bootstrap();
