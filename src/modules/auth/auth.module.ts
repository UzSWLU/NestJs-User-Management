import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
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
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
