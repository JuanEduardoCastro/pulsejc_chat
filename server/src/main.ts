import './instrument';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import Helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { i18nValidationExceptionFactory } from './common/pipes/i18n-validation-exception.factory';

function swaggerBasicAuth(config: ConfigService) {
  const user = config.getOrThrow<string>('SWAGGER_USER');
  const password = config.getOrThrow<string>('SWAGGER_PASSWORD');

  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Basic ')) {
      const [provideUser, providePassword] = Buffer.from(
        header.slice('Basic '.length),
        'base64',
      )
        .toString('utf8')
        .split(':');

      if (provideUser === user && providePassword === password) {
        return next();
      }
    }
    res.setHeader('WWW-Authenticate', 'Basic realm="Swagger"');
    res.status(401).send('Unauthorized');
  };
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api');
  const configService = app.get(ConfigService);
  const clientUrl = configService.getOrThrow<string>('CLIENT_URL');

  app.use(cookieParser());
  app.use(
    Helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            'data:',
            'https://pulsejc-users-uploads.s3.amazonaws.com',
            'https://lh3.googleusercontent.com',
          ],
          connectSrc: ["'self'"],
        },
      },
    }),
  );
  app.enableCors({ origin: clientUrl, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: i18nValidationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useWebSocketAdapter(new IoAdapter(app));

  app.use(['/api/docs', '/api/docs-json'], swaggerBasicAuth(configService));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulse.Jc API')
    .setDescription(
      'Pulse.Jc backend API — real-time 1-to-1 chat with an integrated AI assistant',
    )
    .setVersion('1.1.1')
    .addBearerAuth()
    .addApiKey(
      { type: 'apiKey', name: 'x-admin-api-key', in: 'header' },
      'admin-key',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
