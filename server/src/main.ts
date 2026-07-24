import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import Helmet from 'helmet';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';

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
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(Helmet({ contentSecurityPolicy: false }));
  app.enableCors({ origin: configService.getOrThrow<string>('CLIENT_URL') });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
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
    .setVersion('1.0')
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
bootstrap();
