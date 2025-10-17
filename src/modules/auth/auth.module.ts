import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { OAuthService } from './services/oauth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../database/entities/core/user.entity';
import { UserRefreshToken } from '../../database/entities/auth/user-refresh-token.entity';
import { UserSession } from '../../database/entities/auth/user-session.entity';
import { UserAuditLog } from '../../database/entities/auth/user-audit-log.entity';
import { UserPasswordHistory } from '../../database/entities/auth/user-password-history.entity';
import { Role } from '../../database/entities/core/role.entity';
import { UserRole } from '../../database/entities/core/user-role.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { UserOAuthAccount } from '../../database/entities/oauth/user-oauth-account.entity';
import { UserAutoRoleRule } from '../../database/entities/oauth/user-auto-role-rule.entity';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';
import { UserProfile } from '../../database/entities/oauth/user-profile.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expires = config.get<number>('JWT_ACCESS_EXPIRES_SECONDS', 900);
        return {
          secret: config.get<string>('JWT_SECRET', 'defaultSecret'),
          signOptions: { expiresIn: expires },
        };
      },
    }),
    TypeOrmModule.forFeature([
      User,
      UserRefreshToken,
      UserSession,
      UserAuditLog,
      UserPasswordHistory,
      Role,
      UserRole,
      OAuthProvider,
      UserOAuthAccount,
      UserAutoRoleRule,
      UserMergeHistory,
      UserProfile,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OAuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService, OAuthService],
})
export class AuthModule {}
