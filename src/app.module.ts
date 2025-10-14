import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // ✅ .env uchun
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ✅ .env faylni global qilish
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
