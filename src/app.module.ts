import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { User } from './database/entities/core/user.entity';
import { Company } from './database/entities/core/company.entity';
import { Role } from './database/entities/core/role.entity';
import { Permission } from './database/entities/core/permission.entity';
import { PermissionGroup } from './database/entities/core/permission-group.entity';
import { RolePermission } from './database/entities/core/role-permission.entity';
import { UserRole } from './database/entities/core/user-role.entity';
import { JwtSecretVersion } from './database/entities/auth/jwt-secret-version.entity';
import { UserRefreshToken } from './database/entities/auth/user-refresh-token.entity';
import { UserSession } from './database/entities/auth/user-session.entity';
import { UserPasswordHistory } from './database/entities/auth/user-password-history.entity';
import { User2FA } from './database/entities/auth/user-2fa.entity';
import { UserAuditLog } from './database/entities/auth/user-audit-log.entity';
import { OAuthProvider } from './database/entities/oauth/oauth-provider.entity';
import { UserOAuthAccount } from './database/entities/oauth/user-oauth-account.entity';
import { UserProfile } from './database/entities/oauth/user-profile.entity';
import { UserAutoRoleRule } from './database/entities/oauth/user-auto-role-rule.entity';
import { UserMergeHistory } from './database/entities/oauth/user-merge-history.entity';
import { UserProfilePreference } from './database/entities/oauth/user-profile-preference.entity';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { OAuthProvidersModule } from './modules/oauth-providers/oauth-providers.module';
import { OAuthAccountsModule } from './modules/oauth-accounts/oauth-accounts.module';
import { UserMergeModule } from './modules/user-merge/user-merge.module';
import { AutoRoleRulesModule } from './modules/auto-role-rules/auto-role-rules.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '3306')),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'management'),
        timezone: '+05:00',
        entities: [
          User,
          Company,
          Role,
          Permission,
          PermissionGroup,
          RolePermission,
          UserRole,
          JwtSecretVersion,
          UserRefreshToken,
          UserSession,
          UserPasswordHistory,
          User2FA,
          UserAuditLog,
          OAuthProvider,
          UserOAuthAccount,
          UserProfile,
          UserAutoRoleRule,
          UserMergeHistory,
          UserProfilePreference,
        ],
        synchronize: true,
        logging: true,
      }),
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    OAuthProvidersModule,
    OAuthAccountsModule,
    UserMergeModule,
    AutoRoleRulesModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
