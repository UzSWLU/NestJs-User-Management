import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap(): Promise<void> {
  // Set timezone to Tashkent (UTC+5)
  process.env.TZ = process.env.TZ || 'Asia/Tashkent';
  
  const app = await NestFactory.create(AppModule);
  
  // Set global API prefix (exclude root path for Swagger)
  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });
  
  // Trust proxy for correct IP detection behind reverse proxy
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: true, credentials: true });
  
  // Helmet with Swagger-compatible CSP (relaxed for HTTP)
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          scriptSrc: [`'self'`, `'unsafe-inline'`, `'unsafe-eval'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          workerSrc: [`'self'`, 'blob:'],
          upgradeInsecureRequests: null, // Disable for HTTP server
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    }),
  );
  
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Swagger konfiguratsiyasi
  const config = new DocumentBuilder()
    .setTitle('User Management API')
    .setDescription('Management-as-a-Service platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  // createDocument qaytaradigan obyekt turi -> OpenAPIObject
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'User Management API',
  });

  await app.listen(3000);
  console.log('🚀 Swagger running at: http://localhost:3000/');
}

// eslint xatosiz, xavfsiz usulda ishga tushirish
void bootstrap().catch((err) => {
  console.error('❌ NestJS bootstrap failed:', err);
  process.exit(1);
});
