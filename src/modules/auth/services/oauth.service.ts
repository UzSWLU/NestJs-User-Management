import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { OAuthProvider } from '../../../database/entities/oauth/oauth-provider.entity';
import { UserOAuthAccount } from '../../../database/entities/oauth/user-oauth-account.entity';
import { User } from '../../../database/entities/core/user.entity';
import { UserAutoRoleRule } from '../../../database/entities/oauth/user-auto-role-rule.entity';
import { UserRole } from '../../../database/entities/core/user-role.entity';
import { Role } from '../../../database/entities/core/role.entity';
import { UserMergeHistory } from '../../../database/entities/oauth/user-merge-history.entity';
import { UserAuditLog } from '../../../database/entities/auth/user-audit-log.entity';
import { UserProfile } from '../../../database/entities/oauth/user-profile.entity';
import { UserProfilePreference } from '../../../database/entities/oauth/user-profile-preference.entity';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class OAuthService {
  constructor(
    @InjectRepository(OAuthProvider)
    private readonly providerRepo: Repository<OAuthProvider>,
    @InjectRepository(UserOAuthAccount)
    private readonly oauthAccountRepo: Repository<UserOAuthAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserAutoRoleRule)
    private readonly autoRoleRuleRepo: Repository<UserAutoRoleRule>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserMergeHistory)
    private readonly mergeHistoryRepo: Repository<UserMergeHistory>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
    @InjectRepository(UserProfilePreference)
    private readonly preferenceRepo: Repository<UserProfilePreference>,
    @InjectRepository(UserAuditLog)
    private readonly auditLogRepo: Repository<UserAuditLog>,
  ) {}

  /**
   * Get OAuth authorization URL for user to visit
   */
  async getAuthorizationUrl(
    providerName: string,
    redirectUri: string,
    stateData?: any,
  ): Promise<string> {
    const provider = await this.providerRepo.findOne({
      where: { name: providerName, is_active: true },
    });

    if (!provider) {
      throw new NotFoundException(
        `OAuth provider "${providerName}" not found or inactive`,
      );
    }

    if (!provider.client_id || !provider.url_authorize) {
      throw new BadRequestException(
        `OAuth provider "${providerName}" is not properly configured`,
      );
    }

    // Build authorization URL based on provider
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: provider.client_id,
      redirect_uri: redirectUri,
    });

    // Add state parameter if provided (for returnUrl, CSRF protection, etc.)
    if (stateData) {
      const stateString = Buffer.from(JSON.stringify(stateData)).toString('base64');
      params.append('state', stateString);
    }

    // Add scope only for providers that require it
    if (providerName === 'google') {
      params.append('scope', 'openid email profile');
    } else if (providerName === 'github') {
      params.append('scope', 'user:email');
    }
    // Note: HEMIS and OneID don't require scope parameter

    return `${provider.url_authorize}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    providerName: string,
    code: string,
    redirectUri: string,
  ): Promise<any> {
    const provider = await this.providerRepo.findOne({
      where: { name: providerName, is_active: true },
    });

    if (!provider) {
      throw new NotFoundException(`OAuth provider "${providerName}" not found`);
    }

    try {
      console.log(`🔄 Exchanging OAuth code for token...`);
      console.log(`   Provider: ${providerName}`);
      console.log(`   URL: ${provider.url_access_token}`);
      console.log(`   Client ID: ${provider.client_id}`);

      let response;

      // HEMIS and OneID use different authentication methods
      if (providerName === 'hemis' || providerName === 'oneid') {
        // HEMIS requires Basic Authentication
        const credentials = Buffer.from(
          `${provider.client_id}:${provider.client_secret}`,
        ).toString('base64');

        const params = new URLSearchParams({
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        });

        console.log(`   Using Basic Authentication`);
        console.log(`   Redirect URI: ${redirectUri}`);

        response = await axios.post(
          provider.url_access_token,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Authorization: `Basic ${credentials}`,
              Accept: 'application/json',
            },
          },
        );
      } else {
        // Standard OAuth flow (Google, GitHub, etc.)
        const params = new URLSearchParams({
          client_id: provider.client_id,
          client_secret: provider.client_secret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        });

        response = await axios.post(
          provider.url_access_token,
          params.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
          },
        );
      }

      console.log(`✅ Token exchange successful!`);
      return response.data;
    } catch (error) {
      console.error(
        `❌ Token exchange failed:`,
        error.response?.data || error.message,
      );
      const errorDetail = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      throw new BadRequestException(
        `Failed to exchange code for token: ${errorDetail}`,
      );
    }
  }

  /**
   * Get user info from OAuth provider
   */
  async getUserInfo(providerName: string, accessToken: string): Promise<any> {
    const provider = await this.providerRepo.findOne({
      where: { name: providerName, is_active: true },
    });

    if (!provider) {
      throw new NotFoundException(`OAuth provider "${providerName}" not found`);
    }

    try {
      console.log(`🔄 Fetching user info from ${providerName}...`);
      console.log(`   URL: ${provider.url_resource_owner_details}`);

      const response = await axios.get(provider.url_resource_owner_details, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
        },
      });

      console.log(`✅ User info fetched successfully!`);
      console.log(
        `   User ID: ${response.data.id || response.data.uuid || 'N/A'}`,
      );
      console.log(`   Email: ${response.data.email || 'N/A'}`);

      return response.data;
    } catch (error) {
      console.error(
        `❌ Failed to fetch user info:`,
        error.response?.data || error.message,
      );
      const errorDetail = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      throw new BadRequestException(`Failed to get user info: ${errorDetail}`);
    }
  }

  /**
   * Find or create user from OAuth data
   */
  async findOrCreateUser(
    provider: OAuthProvider,
    oauthUserData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<User> {
    // Extract user data from provider response
    const providerUserId = this.extractProviderUserId(
      provider.name,
      oauthUserData,
    );
    const email = this.extractEmail(provider.name, oauthUserData);
    const username = this.extractUsername(provider.name, oauthUserData);
    const fullName = this.extractFullName(provider.name, oauthUserData);
    const phone = this.extractPhone(provider.name, oauthUserData);
    const avatar = this.extractAvatar(provider.name, oauthUserData);

    // Check if OAuth account already exists
    const existingOAuthAccount = await this.oauthAccountRepo.findOne({
      where: {
        provider: { id: provider.id },
        provider_user_id: providerUserId,
      },
      relations: ['user'],
    });

    if (existingOAuthAccount) {
      let user = existingOAuthAccount.user;

      // Check if user is blocked (merged user)
      if (user.status === 'blocked') {
        console.log(
          `⚠️  User ${user.id} (${user.username}) is blocked, checking for merge...`,
        );

        // Check if this user was merged to another user
        const mergeHistory = await this.mergeHistoryRepo.findOne({
          where: { merged_user: { id: user.id } },
          relations: ['main_user'],
        });

        if (mergeHistory && mergeHistory.main_user) {
          // User was merged, use the main user instead
          user = mergeHistory.main_user;
          console.log(
            `✅ Found merge: redirecting to main user ${user.id} (${user.username})`,
          );

          // Update OAuth account to point to main user (if not already)
          if (existingOAuthAccount.user.id !== user.id) {
            existingOAuthAccount.user = user;
            await this.oauthAccountRepo.save(existingOAuthAccount);
            console.log(`✅ OAuth account updated to main user`);
          }

          // Check if main user is also blocked
          if (user.status === 'blocked') {
            throw new BadRequestException(
              'Your account has been blocked. Please contact support.',
            );
          }
        } else {
          // User is blocked but not merged
          throw new BadRequestException(
            'Your account has been blocked. Please contact support.',
          );
        }
      }

      // Update last_login and OAuth data
      existingOAuthAccount.oauth_data = oauthUserData;
      existingOAuthAccount.last_login = new Date();
      await this.oauthAccountRepo.save(existingOAuthAccount);

      // Update user profile with latest data from provider (skip duplicates)
      let userUpdated = false;
      
      // Check email before updating
      if (email && email !== user.email) {
        const emailExists = await this.userRepo.findOne({
          where: { email, deleted_at: IsNull() },
        });
        if (!emailExists || emailExists.id === user.id) {
          user.email = email;
          userUpdated = true;
        }
      }
      
      // Update other fields
      if (fullName && fullName !== user.full_name) {
        user.full_name = fullName;
        userUpdated = true;
      }
      if (phone && phone !== user.phone) {
        const phoneExists = await this.userRepo.findOne({
          where: { phone, deleted_at: IsNull() },
        });
        if (!phoneExists || phoneExists.id === user.id) {
          user.phone = phone;
          userUpdated = true;
        }
      }
      if (avatar && avatar !== user.avatar) {
        user.avatar = avatar;
        userUpdated = true;
      }
      if (phone && !user.phone_verified) {
        user.phone_verified = true;
        userUpdated = true;
      }
      
      if (userUpdated) {
        await this.userRepo.save(user);
      }

      // Update/Create UserProfile with detailed info from provider
      await this.upsertUserProfile(user, provider.name, oauthUserData);

      // Apply auto-role rules for existing users too (in case new rules were added)
      console.log(`   🔄 Checking auto-role rules for existing user...`);
      await this.assignAutoRoles(user, provider, oauthUserData);

      return user;
    }

    // Check if user exists by email (exclude soft deleted)
    let user = email
      ? await this.userRepo.findOne({ where: { email, deleted_at: IsNull() } })
      : null;

    if (!user) {
      // Create new user with random password hash (OAuth users don't use password login)
      const randomPassword =
        Math.random().toString(36).slice(-12) +
        Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      // Check if this is the first user
      const userCount = await this.userRepo.count();
      const isFirstUser = userCount === 0;

      user = this.userRepo.create({
        username: username || `${provider.name}_${providerUserId}`,
        email: email || `${providerUserId}@${provider.name}.oauth`,
        full_name: fullName || username || undefined,
        phone: phone || undefined,
        avatar: avatar || undefined,
        password_hash: passwordHash, // Random password hash for OAuth users
        status: 'active',
        email_verified: !!email, // If email is provided, consider it verified
        phone_verified: !!phone, // If phone is provided, consider it verified
        companyId: 1, // Default company
      });
      user = await this.userRepo.save(user);

      // Create UserProfile with detailed info from provider
      await this.upsertUserProfile(user, provider.name, oauthUserData);

      // If first user, assign creator role directly
      if (isFirstUser) {
        const creatorRole = await this.roleRepo.findOne({
          where: { name: 'creator' },
        });
        if (creatorRole) {
          const userRole = this.userRoleRepo.create({
            user: user,
            role: creatorRole,
          });
          await this.userRoleRepo.save(userRole);
          console.log(`✅ First user (${user.username}) assigned as "creator"`);
        }
      } else {
        // Assign auto-roles based on rules for other users
        await this.assignAutoRoles(user, provider, oauthUserData);
      }
    }

    // Create OAuth account link
    const oauthAccount = this.oauthAccountRepo.create({
      user: user,
      provider: provider,
      provider_user_id: providerUserId,
      oauth_data: oauthUserData,
      last_login: new Date(),
    });
    await this.oauthAccountRepo.save(oauthAccount);

    return user;
  }

  /**
   * Link OAuth account to existing user
   */
  async linkOAuthToUser(
    userId: number,
    provider: OAuthProvider,
    oauthUserData: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const providerUserId = this.extractProviderUserId(
      provider.name,
      oauthUserData,
    );

    // Check if this OAuth account is already linked to another user
    const existingOAuthAccount = await this.oauthAccountRepo.findOne({
      where: {
        provider: { id: provider.id },
        provider_user_id: providerUserId,
      },
      relations: ['user'],
    });

    if (existingOAuthAccount) {
      if (existingOAuthAccount.user.id === userId) {
        // Already linked to this user - just update the data
        existingOAuthAccount.oauth_data = oauthUserData;
        existingOAuthAccount.last_login = new Date();
        await this.oauthAccountRepo.save(existingOAuthAccount);
        console.log(
          `✅ OAuth account already linked to user ${userId}, updated data`,
        );
        return;
      } else {
        // OAuth account linked to different user - MERGE accounts
        const targetUser = await this.userRepo.findOne({
          where: { id: userId, deleted_at: IsNull() },
        });
        const oldUser = existingOAuthAccount.user;

        if (!targetUser) {
          throw new NotFoundException(
            `Target user with ID ${userId} not found`,
          );
        }

        console.log(`🔄 Merging accounts:`);
        console.log(
          `   From: User ${oldUser.id} (${oldUser.username}, ${oldUser.email})`,
        );
        console.log(
          `   To: User ${targetUser.id} (${targetUser.username}, ${targetUser.email})`,
        );

        // Transfer OAuth account to target user
        existingOAuthAccount.user = targetUser;
        existingOAuthAccount.oauth_data = oauthUserData;
        existingOAuthAccount.last_login = new Date();
        await this.oauthAccountRepo.save(existingOAuthAccount);

        console.log(
          `   ✅ OAuth account transferred from user ${oldUser.id} to user ${targetUser.id}`,
        );

        // Transfer ALL OAuth accounts from old user to target user
        const allOldOAuthAccounts = await this.oauthAccountRepo.find({
          where: { user: { id: oldUser.id } },
          relations: ['provider'],
        });

        let transferredCount = 0;
        for (const account of allOldOAuthAccounts) {
          if (account.id !== existingOAuthAccount.id) {
            account.user = targetUser;
            await this.oauthAccountRepo.save(account);
            transferredCount++;
            console.log(`   ✅ Transferred ${account.provider.name} account`);
          }
        }

        if (transferredCount > 0) {
          console.log(
            `   📊 Total OAuth accounts transferred: ${transferredCount + 1}`,
          );
        }

        // Transfer roles from old user to target user (if not duplicate)
        const oldUserRoles = await this.userRoleRepo.find({
          where: { user: { id: oldUser.id } },
          relations: ['role'],
        });

        for (const oldRole of oldUserRoles) {
          // Check if target user already has this role
          const existingRole = await this.userRoleRepo.findOne({
            where: {
              user: { id: targetUser.id },
              role: { id: oldRole.role.id },
            },
          });

          if (!existingRole) {
            // Assign role to target user
            const newUserRole = this.userRoleRepo.create({
              user: targetUser,
              role: oldRole.role,
            });
            await this.userRoleRepo.save(newUserRole);
            console.log(`   ✅ Transferred role: ${oldRole.role.name}`);
          }

          // Delete old role assignment
          await this.userRoleRepo.remove(oldRole);
        }

        // Create merge history record
        const mergeHistory = this.mergeHistoryRepo.create({
          main_user: targetUser,
          merged_user: oldUser,
        });
        await this.mergeHistoryRepo.save(mergeHistory);
        console.log(`   📝 Merge history recorded (ID: ${mergeHistory.id})`);

        // Block old user (NO soft delete - user saqlanadi!)
        oldUser.status = 'blocked'; // Block the merged user
        await this.userRepo.save(oldUser);
        console.log(
          `   🔒 Blocked old user ${oldUser.id} (${oldUser.username}) - user saqlanadi`,
        );

        // Log merge events to audit logs
        await this.logAudit(
          targetUser,
          'user_merge',
          `Merged user ${oldUser.id} (${oldUser.username}) into this account via OAuth`,
          ipAddress,
          userAgent,
        );
        await this.logAudit(
          oldUser,
          'user_merged',
          `This account was merged into user ${targetUser.id} (${targetUser.username}) via OAuth`,
          ipAddress,
          userAgent,
        );

        console.log(`✅ Account merge completed successfully!`);
        console.log(`   Main User: ${targetUser.id} (${targetUser.username})`);
        console.log(
          `   Merged User: ${oldUser.id} (${oldUser.username}) - blocked`,
        );
        return;
      }
    }

    // Get the user (exclude soft deleted)
    const user = await this.userRepo.findOne({
      where: { id: userId, deleted_at: IsNull() },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${userId} not found or has been deleted`,
      );
    }

    // Create new OAuth account link
    const oauthAccount = this.oauthAccountRepo.create({
      user: user,
      provider: provider,
      provider_user_id: providerUserId,
      oauth_data: oauthUserData,
      last_login: new Date(),
    });
    await this.oauthAccountRepo.save(oauthAccount);

    // Apply auto-role rules when linking OAuth account
    console.log(`   🔄 Checking auto-role rules for ${provider.name}...`);
    await this.assignAutoRoles(user, provider, oauthUserData);

    console.log(
      `✅ Successfully linked ${provider.name} account (${providerUserId}) to user ${userId} (${user.username})`,
    );
  }

  /**
   * Assign roles to user based on auto-role rules
   */
  private async assignAutoRoles(
    user: User,
    provider: OAuthProvider,
    oauthData: any,
  ): Promise<void> {
    const rules = await this.autoRoleRuleRepo.find({
      where: { provider: { id: provider.id }, is_active: true },
      relations: ['role'],
    });

    for (const rule of rules) {
      if (this.matchesRule(rule, oauthData)) {
        // Check if user already has this role
        const existingUserRole = await this.userRoleRepo.findOne({
          where: { user: { id: user.id }, role: { id: rule.role.id } },
        });

        if (!existingUserRole) {
          const userRole = this.userRoleRepo.create({
            user: user,
            role: rule.role,
          });
          await this.userRoleRepo.save(userRole);
          console.log(
            `✅ Auto-assigned role "${rule.role.name}" to user "${user.username}" via rule "${rule.rule_name}"`,
          );
        }
      }
    }

    // If no rules matched, assign provider's default role or fallback to "user" role
    const userRoleCount = await this.userRoleRepo.count({
      where: { user: { id: user.id } },
    });

    if (userRoleCount === 0) {
      let defaultRole: Role | null = null;

      // First, check if provider has a default role configured
      if (provider.default_role_id) {
        defaultRole =
          provider.default_role ||
          (await this.roleRepo.findOne({
            where: { id: provider.default_role_id },
          }));
        if (defaultRole) {
          console.log(
            `   Using provider's default role: "${defaultRole.name}"`,
          );
        }
      }

      // Fallback to "user" role if no provider default
      if (!defaultRole) {
        defaultRole = await this.roleRepo.findOne({
          where: { name: 'user' },
        });
        if (defaultRole) {
          console.log(`   Using system default role: "user"`);
        }
      }

      if (defaultRole) {
        const userRole = this.userRoleRepo.create({
          user: user,
          role: defaultRole,
        });
        await this.userRoleRepo.save(userRole);
        console.log(
          `✅ Assigned default role "${defaultRole.name}" to "${user.username}"`,
        );
      }
    }
  }

  /**
   * Check if OAuth data matches the rule conditions
   */
  private matchesRule(rule: UserAutoRoleRule, oauthData: any): boolean {
    if (!rule.condition_field) {
      return false;
    }

    // Empty condition_value means "always match" (default role)
    if (!rule.condition_value || rule.condition_value === '') {
      console.log(
        `   ℹ️  Rule "${rule.rule_name}": Always match (default role)`,
      );
      return true;
    }

    const fieldValue = this.getNestedValue(oauthData, rule.condition_field);

    switch (rule.condition_operator) {
      case 'equals':
        return String(fieldValue) === String(rule.condition_value);
      case 'contains':
        return String(fieldValue).includes(String(rule.condition_value));
      case 'starts_with':
        return String(fieldValue).startsWith(String(rule.condition_value));
      case 'ends_with':
        return String(fieldValue).endsWith(String(rule.condition_value));
      case 'in':
        const values = rule.condition_value.split(',').map((v) => v.trim());
        return values.includes(String(fieldValue));
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Provider-specific data extractors
  private extractProviderUserId(providerName: string, data: any): string {
    switch (providerName) {
      case 'hemis':
        return data.id || data.uuid || data.user_id;
      case 'student_portal':
        return data.student_id || data.id || data.user_id;
      case 'google':
        return data.sub || data.id;
      case 'github':
        return data.id;
      case 'oneid':
        return data.tin || data.pin || data.sub;
      default:
        return data.id || data.sub || data.user_id || data.student_id;
    }
  }

  private extractEmail(providerName: string, data: any): string | null {
    if (providerName === 'student' || providerName === 'student_portal') {
      return data.email || null;
    }
    return data.email || null;
  }

  private extractUsername(providerName: string, data: any): string | null {
    switch (providerName) {
      case 'hemis':
        return data.login || data.username || data.name;
      case 'student':
      case 'student_portal':
        return data.student_id_number || data.student_id || data.id?.toString();
      case 'google':
        return data.email?.split('@')[0] || data.name;
      case 'github':
        return data.login || data.username;
      default:
        return data.username || data.login || data.name || data.student_id;
    }
  }

  private extractFullName(providerName: string, data: any): string | null {
    if (providerName === 'student' || providerName === 'student_portal') {
      return data.full_name || data.short_name || null;
    }
    return data.name || data.full_name || data.fullname || null;
  }

  private extractPhone(providerName: string, data: any): string | null {
    if (providerName === 'student' || providerName === 'student_portal') {
      return data.phone || null;
    }
    return data.phone || data.phone_number || null;
  }

  private extractAvatar(providerName: string, data: any): string | null {
    if (providerName === 'student' || providerName === 'student_portal') {
      return data.image || data.avatar || null;
    }
    return data.avatar || data.picture || data.photo || data.image || null;
  }

  /**
   * Login via External API provider (non-OAuth)
   */
  async loginViaExternalApi(
    providerName: string,
    login: string,
    password: string,
    device?: string,
    ipAddress?: string,
    userAgent?: string,
    platform: 'web' | 'mobile' | 'desktop' | 'api' = 'web',
  ): Promise<any> {
    const provider = await this.providerRepo.findOne({
      where: { name: providerName, is_active: true, auth_type: 'api' },
    });

    if (!provider) {
      throw new NotFoundException(
        `API provider "${providerName}" not found or not configured as API type`,
      );
    }

    if (!provider.url_login) {
      throw new BadRequestException(
        `API provider "${providerName}" does not have login URL configured`,
      );
    }

    try {
      console.log(`🔄 Authenticating with external API: ${provider.name}`);
      console.log(`   URL: ${provider.url_login}`);
      console.log(`   Login: ${login}`);

      // Call external API to authenticate
      const response = await axios.post(
        provider.url_login,
        {
          login: login,
          password: password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      console.log(`✅ External API authentication successful!`);
      const externalUserData = response.data;

      // Get or fetch user info from external API if available
      let userInfo =
        externalUserData.data || externalUserData.user || externalUserData;

      // Extract access token (support different response formats)
      const accessToken =
        externalUserData.access_token ||
        externalUserData.token ||
        externalUserData.data?.token ||
        null;

      // If external API provides a token and user info endpoint
      if (accessToken && provider.url_resource_owner_details) {
        try {
          const userInfoResponse = await axios.get(
            provider.url_resource_owner_details,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
              },
            },
          );
          // Extract user info (support nested data structure like {success, data: {...}})
          userInfo = userInfoResponse.data.data || userInfoResponse.data;
          console.log(`✅ User info fetched from API endpoint`);
        } catch (error) {
          console.warn(
            `⚠️  Failed to fetch user info from API, decoding JWT token instead`,
          );
          // If user info endpoint fails, try to decode JWT token
          try {
            const decoded = jwt.decode(accessToken) as any;
            if (decoded) {
              // Extract user info from JWT claims
              userInfo = {
                id: decoded.sub || decoded.jti || decoded.student_id,
                student_id: decoded.sub || decoded.jti,
                email: decoded.email || null,
                username: decoded.username || decoded.login || decoded.jti,
                name: decoded.name || null,
              };
              console.log(`✅ User info extracted from JWT token`);
            }
          } catch (jwtError) {
            console.error(`❌ Failed to decode JWT:`, jwtError.message);
          }
        }
      }

      // Find or create user
      const user = await this.findOrCreateUser(
        provider,
        userInfo,
        ipAddress,
        userAgent,
      );

      // Return user object (JWT tokens will be generated in controller)
      return {
        user: user,
        provider: providerName,
      };
    } catch (error) {
      console.error(
        `❌ External API authentication failed:`,
        error.response?.data || error.message,
      );

      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException(
          'Invalid login credentials for ' + providerName,
        );
      }

      const errorDetail = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
      throw new BadRequestException(
        `Failed to authenticate with ${providerName}: ${errorDetail}`,
      );
    }
  }

  /**
   * Create or Update UserProfile from OAuth provider data
   */
  private async upsertUserProfile(
    user: User,
    providerName: string,
    oauthData: any,
  ): Promise<void> {
    try {
      // Check if profile already exists
      let profile = await this.userProfileRepo.findOne({
        where: { user: { id: user.id } },
      });

      // Extract profile data based on provider
      console.log(
        `   📦 Raw oauthData for ${providerName}:`,
        JSON.stringify(oauthData),
      );
      const profileData = this.extractProfileData(providerName, oauthData);

      console.log(`   📦 Profile data extracted:`, JSON.stringify(profileData));

      if (!profileData || Object.keys(profileData).length === 0) {
        console.log(`   ⚠️  No profile data to save`);
        return; // No profile data to save
      }

      // Filter out undefined values to avoid database errors
      const cleanedData = Object.fromEntries(
        Object.entries(profileData).filter(([_, v]) => v !== undefined),
      );

      console.log(`   📦 Cleaned profile data:`, JSON.stringify(cleanedData));

      if (Object.keys(cleanedData).length === 0) {
        console.log(`   ⚠️  No valid data after cleaning`);
        return; // No valid data to save
      }

      if (profile) {
        // Update existing profile
        Object.assign(profile, cleanedData);
        await this.userProfileRepo.save(profile);
        console.log(`   ✅ Updated UserProfile for user ${user.username}`);
      } else {
        // Create new profile
        profile = this.userProfileRepo.create({
          user: user,
          ...cleanedData,
        });
        await this.userProfileRepo.save(profile);
        console.log(`   ✅ Created UserProfile for user ${user.username}`);
      }

      // Save to user_profile_preferences (provider profile ustunlik qiladi)
      await this.savePrimaryProfilePreference(user.id, profile.id);
    } catch (error) {
      console.error(
        `   ⚠️  Failed to save UserProfile for user ${user.username}:`,
        error.message,
      );
      // Don't throw - allow login to continue even if profile save fails
    }
  }

  /**
   * Save primary profile preference (provider login - ALWAYS update to provider profile)
   */
  private async savePrimaryProfilePreference(
    userId: number,
    profileId: number,
  ): Promise<void> {
    try {
      // Check if preference exists
      let preference = await this.preferenceRepo.findOne({
        where: { user: { id: userId }, key: 'primary_profile_id' },
      });

      if (preference) {
        // ALWAYS update to provider profile (provider ustunlik qiladi)
        preference.value = profileId.toString();
        await this.preferenceRepo.save(preference);
        console.log(`   🥇 Updated primary_profile_id = ${profileId} (PROVIDER PROFILE USTUNLIK!) for user ${userId}`);
      } else {
        // Create new preference
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (user) {
          preference = this.preferenceRepo.create({
            user: user,
            key: 'primary_profile_id',
            value: profileId.toString(),
          });
          await this.preferenceRepo.save(preference);
          console.log(`   🥇 Created primary_profile_id = ${profileId} (PROVIDER PROFILE) for user ${userId}`);
        }
      }
    } catch (error) {
      console.error(`   ⚠️  Failed to save preference for user ${userId}:`, error.message);
    }
  }

  /**
   * Extract profile data from OAuth provider response
   */
  private extractProfileData(
    providerName: string,
    data: any,
  ): Partial<UserProfile> | null {
    if (providerName === 'student' || providerName === 'student_portal') {
      // Parse birth_date safely
      let birthDate: Date | undefined = undefined;
      if (data.birth_date) {
        const parsedDate =
          typeof data.birth_date === 'number'
            ? new Date(data.birth_date * 1000)
            : new Date(data.birth_date);
        birthDate = !isNaN(parsedDate.getTime()) ? parsedDate : undefined;
      }

      return {
        first_name: data.first_name || data.second_name || undefined,
        last_name: data.second_name || undefined,
        middle_name: data.third_name || undefined,
        avatar_url: data.image || undefined,
        birth_date: birthDate,
        gender: data.gender?.name || data.gender?.code || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
      };
    }

    if (providerName === 'hemis') {
      // Parse birth_date safely (HEMIS uses DD-MM-YYYY format)
      let birthDate: Date | undefined = undefined;
      if (data.birth_date) {
        if (typeof data.birth_date === 'string') {
          // Parse DD-MM-YYYY format
          const parts = data.birth_date.split('-');
          if (parts.length === 3) {
            const [day, month, year] = parts;
            birthDate = new Date(`${year}-${month}-${day}`);
            if (isNaN(birthDate.getTime())) birthDate = undefined;
          }
        } else if (typeof data.birth_date === 'number') {
          birthDate = new Date(data.birth_date * 1000);
          if (isNaN(birthDate.getTime())) birthDate = undefined;
        }
      }

      return {
        first_name: data.firstname || data.first_name || undefined,
        last_name: data.surname || data.last_name || undefined,
        middle_name: data.patronymic || data.middle_name || undefined,
        avatar_url: data.picture || data.image || data.avatar || undefined,
        birth_date: birthDate,
        gender: data.gender?.name || data.gender || undefined,
        phone: data.phone || data.phone_number || undefined,
        address: data.address || undefined,
      };
    }

    // For other providers (Google, GitHub, etc.), extract basic info
    return {
      avatar_url: data.avatar || data.picture || data.image || undefined,
    };
  }

  /**
   * Log audit event
   */
  private async logAudit(
    user: User,
    eventType: 'user_merge' | 'user_merged',
    description: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    console.log(`\n🔍 === AUDIT LOG DEBUG === `);
    console.log(`   Event Type: ${eventType}`);
    console.log(`   User ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   IP Address: ${ipAddress || 'NULL'}`);
    console.log(`   User Agent: ${userAgent || 'NULL'}`);
    console.log(`   Description: ${description}`);
    
    const auditLog = this.auditLogRepo.create({
      user,
      event_type: eventType,
      description,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    
    console.log(`   Audit Log Object:`, JSON.stringify({
      userId: user.id,
      event_type: eventType,
      ip_address: ipAddress,
      user_agent: userAgent,
      description,
    }));
    
    await this.auditLogRepo.save(auditLog);
    console.log(`   ✅ Audit log saved to database!`);
    console.log(`=== END AUDIT LOG DEBUG ===\n`);
  }
}
