import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  // Create uploads directory if not exists
  if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
  }
  
  // Enable CORS
  app.enableCors();
  
  await app.listen(3000);
  console.log('Analytics service is running on http://localhost:3000');
}
bootstrap();