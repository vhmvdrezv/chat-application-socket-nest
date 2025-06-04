import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS for your frontend
  app.enableCors({
    origin: '*', // In production, specify your frontend URL
  });
  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Chat server running on http://localhost:3000');
}
bootstrap();
