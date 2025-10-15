import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/core/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRefreshToken } from '../../database/entities/auth/user-refresh-token.entity';
import { UserSession } from '../../database/entities/auth/user-session.entity';
import { UserAuditLog } from '../../database/entities/auth/user-audit-log.entity';
import { UserPasswordHistory } from '../../database/entities/auth/user-password-history.entity';
import { Role } from '../../database/entities/core/role.entity';
import { UserRole } from '../../database/entities/core/user-role.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(UserRefreshToken)
    private readonly refreshTokenRepo: Repository<UserRefreshToken>,

    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,

    @InjectRepository(UserAuditLog)
    private readonly auditLogRepo: Repository<UserAuditLog>,

    @InjectRepository(UserPasswordHistory)
    private readonly passwordHistoryRepo: Repository<UserPasswordHistory>,

    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,

    private readonly jwtService: JwtService,
  ) {}

  // Login
  async validateUser(usernameOrEmail: string, password: string) {
    const user = await this.userRepo.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      relations: ['roles', 'roles.role'],
    });

    if (user && (await bcrypt.compare(password, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(
    user: User,
    device?: string,
    ipAddress?: string,
    userAgent?: string,
    platform: 'web' | 'mobile' | 'desktop' | 'api' = 'web',
  ) {
    const payload = { sub: user.id, username: user.username };
    const accessToken = this.jwtService.sign(payload);
    const refreshTokenString = await this.generateRefreshToken(
      user,
      device,
      ipAddress,
      userAgent,
      platform,
    );

    // Find the refresh token record we just created
    const refreshTokenRecord = await this.refreshTokenRepo.findOne({
      where: { token: refreshTokenString },
    });

    // Create user session
    const session = this.sessionRepo.create({
      user,
      refresh_token: refreshTokenRecord,
      ip_address: ipAddress,
      user_agent: userAgent,
      device_hash: this.generateDeviceHash(device, userAgent),
      login_at: new Date(),
      status: 'active',
      platform,
    });
    await this.sessionRepo.save(session);

    // Log audit event
    await this.logAudit(user, 'login', ipAddress, userAgent);

    // Update last login timestamp
    user.last_login_at = new Date();
    await this.userRepo.save(user);

    // Reload user with full role information
    const userWithRoles = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.role'],
    });

    // Remove sensitive data
    const {
      password_hash,
      reset_token,
      verification_token,
      auth_key,
      ...safeUser
    } = userWithRoles || user;

    return {
      accessToken,
      refreshToken: refreshTokenString,
      user: safeUser,
    };
  }

  // Register
  async register(
    username: string,
    email: string,
    password: string,
    device?: string,
    ipAddress?: string,
    userAgent?: string,
    platform: 'web' | 'mobile' | 'desktop' | 'api' = 'web',
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user
    const userCount = await this.userRepo.count();
    const isFirstUser = userCount === 0;

    const user = this.userRepo.create({
      username,
      email,
      password_hash: hashedPassword,
      status: 'active',
    });
    await this.userRepo.save(user);

    // Assign role: creator for first user, user for others
    const roleName = isFirstUser ? 'creator' : 'user';
    let role = await this.roleRepo.findOne({ where: { name: roleName } });

    // Create default roles if they don't exist
    if (!role) {
      role = this.roleRepo.create({
        name: roleName,
        description: isFirstUser
          ? 'System creator with full access'
          : 'Regular user with limited access',
        is_system: true,
      });
      await this.roleRepo.save(role);
    }

    // Assign role to user
    const userRole = this.userRoleRepo.create({
      user,
      role,
    });
    await this.userRoleRepo.save(userRole);

    console.log(`✅ User registered as "${roleName}": ${username}`);

    return this.login(user, device, ipAddress, userAgent, platform);
  }

  // Refresh token
  async generateRefreshToken(
    user: User,
    device?: string,
    ipAddress?: string,
    userAgent?: string,
    platform: 'web' | 'mobile' | 'desktop' | 'api' = 'web',
  ) {
    const expiresInSeconds = Number(
      process.env.JWT_REFRESH_EXPIRES_SECONDS || 7 * 24 * 60 * 60,
    );
    const token = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: expiresInSeconds },
    );

    const refreshToken = this.refreshTokenRepo.create({
      user,
      token,
      expires_at: new Date(Date.now() + expiresInSeconds * 1000),
      device: device || 'Unknown Device',
      ip_address: ipAddress,
      user_agent: userAgent,
      platform,
    });

    await this.refreshTokenRepo.save(refreshToken);
    return token;
  }

  // Verify refresh token
  async refreshToken(
    token: string,
    device?: string,
    ipAddress?: string,
    userAgent?: string,
    platform: 'web' | 'mobile' | 'desktop' | 'api' = 'web',
  ) {
    const stored = await this.refreshTokenRepo.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!stored || stored.revoked || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token and mark rotation
    stored.revoked = true;
    stored.rotated_at = new Date();
    await this.refreshTokenRepo.save(stored);

    // Generate new token with rotation tracking
    const expiresInSeconds = Number(
      process.env.JWT_REFRESH_EXPIRES_SECONDS || 7 * 24 * 60 * 60,
    );
    const newTokenString = this.jwtService.sign(
      { sub: stored.user.id },
      { expiresIn: expiresInSeconds },
    );

    const newRefreshToken = this.refreshTokenRepo.create({
      user: stored.user,
      token: newTokenString,
      expires_at: new Date(Date.now() + expiresInSeconds * 1000),
      device: device || stored.device || 'Unknown Device',
      ip_address: ipAddress || stored.ip_address,
      user_agent: userAgent || stored.user_agent,
      platform: platform || stored.platform,
      rotated_from: stored.id,
    });

    await this.refreshTokenRepo.save(newRefreshToken);

    // Create new session for the refreshed token
    const session = this.sessionRepo.create({
      user: stored.user,
      refresh_token: newRefreshToken,
      ip_address: ipAddress || stored.ip_address,
      user_agent: userAgent || stored.user_agent,
      device_hash: this.generateDeviceHash(
        device,
        userAgent || stored.user_agent,
      ),
      login_at: new Date(),
      status: 'active',
      platform: platform || stored.platform,
    });
    await this.sessionRepo.save(session);

    // Log token refresh in audit log
    await this.logAudit(stored.user, 'token_revoke', ipAddress, userAgent);

    // Generate new access token
    const payload = { sub: stored.user.id, username: stored.user.username };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: newTokenString,
      message: 'Token refreshed successfully',
    };
  }

  private parseExpires(exp: string) {
    const match = exp.match(/(\d+)([smhd])/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const [, value, unit] = match;
    const num = Number(value);
    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        return num;
    }
  }

  /**
   * Get current user with roles and permissions
   */
  async getCurrentUser(userId: number): Promise<any> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: [
        'roles',
        'roles.role',
        'roles.role.permissions',
        'roles.role.permissions.permission',
      ],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Remove sensitive data
    const {
      password_hash,
      reset_token,
      verification_token,
      auth_key,
      ...safeUser
    } = user;

    return safeUser;
  }

  /**
   * Logout user - terminate session and revoke refresh token
   */
  async logout(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    const stored = await this.refreshTokenRepo.findOne({
      where: { token: refreshToken },
      relations: ['user'],
    });

    if (stored && !stored.revoked) {
      // Revoke the refresh token
      stored.revoked = true;
      await this.refreshTokenRepo.save(stored);

      // Find and terminate active session
      const session = await this.sessionRepo.findOne({
        where: { refresh_token: { id: stored.id }, status: 'active' },
      });

      if (session) {
        session.logout_at = new Date();
        session.status = 'terminated';
        await this.sessionRepo.save(session);
      }

      // Log logout event
      await this.logAudit(stored.user, 'logout', ipAddress, userAgent);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{ message: string }> {
    // Find user
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(
      oldPassword,
      user.password_hash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is same as old password
    const isSamePassword = await bcrypt.compare(
      newPassword,
      user.password_hash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Save old password to history
    const passwordHistory = this.passwordHistoryRepo.create({
      user,
      password_hash: user.password_hash,
    });
    await this.passwordHistoryRepo.save(passwordHistory);

    // Update user with new password
    user.password_hash = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    // Log password change event
    await this.logAudit(user, 'password_change', ipAddress, userAgent);

    console.log(`✅ Password changed for user: ${user.username}`);

    return { message: 'Password changed successfully' };
  }

  /**
   * Create audit log entry
   */
  private async logAudit(
    user: User,
    eventType:
      | 'login'
      | 'logout'
      | 'password_change'
      | '2fa_enable'
      | '2fa_disable'
      | 'token_revoke',
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepo.create({
      user,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    await this.auditLogRepo.save(auditLog);
  }

  /**
   * Generate device hash from device name and user agent
   */
  private generateDeviceHash(device?: string, userAgent?: string): string {
    const crypto = require('crypto');
    const input = `${device || 'unknown'}-${userAgent || 'unknown'}`;
    return crypto
      .createHash('sha256')
      .update(input)
      .digest('hex')
      .substring(0, 64);
  }
}
