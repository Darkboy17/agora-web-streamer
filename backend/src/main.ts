import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({

    origin: 'http://localhost:5173', // Frontend URL (change if your React app uses a different port)

    //origin: true, // Or use this to allow any frontend (for development only)

    credentials: true, // If you use cookies/sessions

  });
  await app.listen(5000);
  console.log(`Server running on port 5000`);
}
bootstrap();