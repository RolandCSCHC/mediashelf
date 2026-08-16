import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AUTH_COOKIE_NAME } from './modules/auth/auth.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Library JSON backups can exceed Express's default ~100kb body limit.
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MediaShelf API')
    .setDescription(
      [
        'REST API for MediaShelf — a personal media library.',
        '',
        'Most endpoints require authentication via an HTTP-only JWT cookie',
        `(\`${AUTH_COOKIE_NAME}\`). Use **Authorize** after signing in through`,
        '`GET /auth/google` or `GET /auth/microsoft` in the browser, then paste',
        'the cookie value here to try protected routes from this UI.',
      ].join('\n'),
    )
    .setVersion('1.0')
    .addCookieAuth(AUTH_COOKIE_NAME)
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}

void bootstrap();
