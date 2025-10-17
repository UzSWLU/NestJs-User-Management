import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthProvidersService } from './oauth-providers.service';
import { OAuthProvidersController } from './oauth-providers.controller';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OAuthProvider])],
  controllers: [OAuthProvidersController],
  providers: [OAuthProvidersService],
  exports: [OAuthProvidersService],
})
export class OAuthProvidersModule {}


