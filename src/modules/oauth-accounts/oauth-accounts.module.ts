import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OAuthAccountsService } from './oauth-accounts.service';
import { OAuthAccountsController } from './oauth-accounts.controller';
import { UserOAuthAccount } from '../../database/entities/oauth/user-oauth-account.entity';
import { User } from '../../database/entities/core/user.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserOAuthAccount, User, OAuthProvider])],
  controllers: [OAuthAccountsController],
  providers: [OAuthAccountsService],
  exports: [OAuthAccountsService],
})
export class OAuthAccountsModule {}


