import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Swagger konfiguratsiyasi
  const config = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription('Management-as-a-Service platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // createDocument qaytaradigan obyekt turi -> OpenAPIObject
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  await app.listen(3000);
  console.log('🚀 Swagger running at: http://localhost:3000/');
}

// eslint xatosiz, xavfsiz usulda ishga tushirish
void bootstrap().catch((err) => {
  console.error('❌ NestJS bootstrap failed:', err);
  process.exit(1);
});
