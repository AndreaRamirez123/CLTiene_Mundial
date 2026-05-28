import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

const DEFAULT_CORS_ORIGINS = [
  'https://mundial-2.web.app',
  'https://mundial-2026-app.web.app',
  'https://cltiene-mundial-backend-293865702055.us-central1.run.app',
];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  const allowedOrigins = (corsOrigin || DEFAULT_CORS_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`Origen no permitido por CORS: ${origin}`),
        false,
      );
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Servir archivos estaticos de uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const port = Number(process.env.PORT) || configService.get<number>('PORT') || 3000;
  console.log(`Backend arrancando en puerto ${port}`);
  console.log(`CORS permitido para: ${allowedOrigins.join(', ')}`);
  await app.listen(port, '0.0.0.0');
}
bootstrap();
