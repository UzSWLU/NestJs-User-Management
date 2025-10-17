import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { User } from './entities/core/user.entity';
import { Company } from './entities/core/company.entity';
import { Role } from './entities/core/role.entity';
import { Permission } from './entities/core/permission.entity';
import { PermissionGroup } from './entities/core/permission-group.entity';
import { RolePermission } from './entities/core/role-permission.entity';
import { UserRole } from './entities/core/user-role.entity';
import { JwtSecretVersion } from './entities/auth/jwt-secret-version.entity';
import { UserRefreshToken } from './entities/auth/user-refresh-token.entity';
import { UserSession } from './entities/auth/user-session.entity';
import { UserPasswordHistory } from './entities/auth/user-password-history.entity';
import { User2FA } from './entities/auth/user-2fa.entity';
import { UserAuditLog } from './entities/auth/user-audit-log.entity';
import { OAuthProvider } from './entities/oauth/oauth-provider.entity';
import { UserOAuthAccount } from './entities/oauth/user-oauth-account.entity';
import { UserProfile } from './entities/oauth/user-profile.entity';
import { UserAutoRoleRule } from './entities/oauth/user-auto-role-rule.entity';
import { UserMergeHistory } from './entities/oauth/user-merge-history.entity';
import { UserProfilePreference } from './entities/oauth/user-profile-preference.entity';

config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
});
