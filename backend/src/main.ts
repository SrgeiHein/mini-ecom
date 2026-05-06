import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT') ?? 4000;
  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:3000';

  app.enableCors({ origin: corsOrigin, credentials: true });
  app.enableShutdownHooks();

  await app.listen(port);
  console.log(`Backend listening on http://localhost:${port}`);
}
bootstrap();
