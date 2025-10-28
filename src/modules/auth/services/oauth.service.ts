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
import { HemisEmployee } from '../../../database/entities/hemis/employee.entity';
import { HemisStudent } from '../../../database/entities/hemis/student.entity';
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
    @InjectRepository(HemisEmployee)
    private readonly hemisEmployeeRepo: Repository<HemisEmployee>,
    @InjectRepository(HemisStudent)
    private readonly hemisStudentRepo: Repository<HemisStudent>,
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
    console.log(`🔵 findOrCreateUser called for provider: ${provider.name}`);
    console.log(`🔵 OAuth data keys: ${Object.keys(oauthUserData || {}).join(', ')}`);
    console.log(`🔵 OAuth data sample: ${JSON.stringify(oauthUserData || {}).substring(0, 500)}`);
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
    console.log(`[DEBUG] Searching for existing OAuth account - provider: ${provider.name}, provider.id: ${provider.id}, providerUserId: ${providerUserId}`);
    const existingOAuthAccount = await this.oauthAccountRepo.findOne({
      where: {
        provider: { id: provider.id },
        provider_user_id: providerUserId,
      },
      relations: ['user'],
    });
    console.log(`[DEBUG] Existing OAuth account search result: ${existingOAuthAccount ? `FOUND (ID: ${existingOAuthAccount.id}, userId: ${existingOAuthAccount.user?.id})` : 'NOT FOUND'}`);

    if (existingOAuthAccount) {
      console.log(`[DEBUG] Existing OAuth account found - ID: ${existingOAuthAccount.id}, provider_user_id: ${existingOAuthAccount.provider_user_id}, profileId: ${existingOAuthAccount.profileId}`);
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

      // Try to link with HEMIS sync data (always try to update if needed)
      let profileId: number | null = existingOAuthAccount.profileId;
      let enrichedOAuthData = { ...oauthUserData };

      // Always try to link HEMIS employee (will update profileId if found, even if already set)
      if (provider.name === 'hemis') {
        try {
          // HEMIS OAuth data'da employee_id mavjud bo'lsa, uni ishlatamiz
          // employee_id hemis_employees.hemis_id ga mos keladi
          // id esa boshqa ID (masalan, OAuth ID yoki user ID)
          console.log(`🔍 Searching existing HEMIS employee - OAuth data keys: ${Object.keys(oauthUserData || {}).join(', ')}`);
          console.log(`🔍 employee_id: ${oauthUserData.employee_id}, id: ${oauthUserData.id}, providerUserId: ${providerUserId}`);
          
          // employee_id ustunlik beriladi, chunki u hemis_employees.hemis_id ga mos keladi
          let searchHemisId: number | null = null;
          if (oauthUserData.employee_id !== undefined && oauthUserData.employee_id !== null) {
            searchHemisId = parseInt(oauthUserData.employee_id.toString(), 10);
            console.log(`🔍 Using employee_id as searchHemisId: ${searchHemisId}`);
          } else {
            console.log(`⚠️  employee_id not found in OAuth data, falling back to providerUserId`);
            searchHemisId = parseInt(providerUserId, 10);
          }
          
          console.log(`🔍 Existing search hemisId: ${searchHemisId} (valid: ${!isNaN(searchHemisId)})`);
          
          if (!isNaN(searchHemisId) && searchHemisId !== null) {
            let hemisEmployee: any = null;
            
            // First, try to find WITHOUT relations to avoid TypeORM relation errors
            try {
              hemisEmployee = await this.hemisEmployeeRepo.findOne({
                where: { hemisId: searchHemisId } as any,
                // No relations first - avoid errors
              });
              console.log(`[DEBUG] Found employee WITHOUT relations: ${hemisEmployee ? `DB ID ${hemisEmployee.id}, hemisId ${hemisEmployee.hemisId}` : 'NOT FOUND'}`);
            } catch (findError: any) {
              console.error(`[ERROR] Error finding employee WITHOUT relations: ${findError?.message || String(findError)}`);
              hemisEmployee = null;
            }
            
            // If found, try to load relations separately (optional)
            if (hemisEmployee) {
              try {
                // Try to reload with relations if needed
                const employeeWithRelations = await this.hemisEmployeeRepo.findOne({
                  where: { hemisId: searchHemisId } as any,
                  relations: ['department', 'gender'],
                });
                if (employeeWithRelations) {
                  hemisEmployee = employeeWithRelations;
                  console.log(`[DEBUG] Successfully loaded employee WITH relations`);
                }
              } catch (relError: any) {
                console.error(`[WARN] Could not load relations, using employee without relations: ${relError?.message || String(relError)}`);
                // Keep hemisEmployee without relations - that's fine
              }
            }
            
            console.log(`[DEBUG] Final employee result: ${hemisEmployee ? `DB ID ${hemisEmployee.id}, hemisId ${hemisEmployee.hemisId}` : 'NOT FOUND'}`);

            if (hemisEmployee) {
              profileId = hemisEmployee.id;
              enrichedOAuthData = {
                ...oauthUserData,
                hemis_sync_data: {
                  employee: {
                    id: hemisEmployee.id,
                    hemisId: hemisEmployee.hemisId,
                    fullName: hemisEmployee.fullName,
                    firstName: hemisEmployee.firstName,
                    secondName: hemisEmployee.secondName,
                    thirdName: hemisEmployee.thirdName,
                    employeeIdNumber: hemisEmployee.employeeIdNumber,
                    birthDate: hemisEmployee.birthDate,
                    email: oauthUserData.email || null,
                    phone: oauthUserData.phone || null,
                    image: hemisEmployee.image,
                    imageFull: hemisEmployee.imageFull,
                  },
                },
              };
              console.log(`✅ Linked existing HEMIS OAuth account to employee ${hemisEmployee.id} (hemisId: ${searchHemisId})`);
            } else {
              console.log(`⚠️  Existing employee not found for hemisId: ${searchHemisId}`);
            }
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error || '');
          console.error(`⚠️  Error linking existing HEMIS employee: ${errorMsg}`);
          console.error(`⚠️  Error stack: ${error?.stack || 'No stack trace'}`);
          console.error(`⚠️  Error message includes 'university': ${errorMsg.includes('university')}`);
          console.error(`⚠️  Error message includes 'Property': ${errorMsg.includes('Property')}`);
          
          // Try to find employee without relations if relations caused the error
          if (errorMsg.includes('university') || errorMsg.includes('Property') || errorMsg.includes('not found')) {
            console.log(`⚠️  Trying to find employee without relations...`);
            try {
              const searchHemisId = oauthUserData.employee_id 
                ? parseInt(oauthUserData.employee_id.toString(), 10)
                : parseInt(providerUserId, 10);
              
              if (!isNaN(searchHemisId)) {
                const hemisEmployeeWithoutRelations = await this.hemisEmployeeRepo.findOne({
                  where: { hemisId: searchHemisId } as any,
                  // No relations - just get the ID
                });

                if (hemisEmployeeWithoutRelations) {
                  profileId = hemisEmployeeWithoutRelations.id;
                  console.log(`✅ Found employee without relations - profileId: ${profileId}`);
                  
                  // Build enriched data manually without accessing relations
                  enrichedOAuthData = {
                    ...oauthUserData,
                    hemis_sync_data: {
                      employee: {
                        id: hemisEmployeeWithoutRelations.id,
                        hemisId: hemisEmployeeWithoutRelations.hemisId,
                        fullName: hemisEmployeeWithoutRelations.fullName,
                        firstName: hemisEmployeeWithoutRelations.firstName,
                        secondName: hemisEmployeeWithoutRelations.secondName,
                        thirdName: hemisEmployeeWithoutRelations.thirdName,
                        employeeIdNumber: hemisEmployeeWithoutRelations.employeeIdNumber,
                        birthDate: hemisEmployeeWithoutRelations.birthDate,
                        email: oauthUserData.email || null,
                        phone: oauthUserData.phone || null,
                        image: hemisEmployeeWithoutRelations.image,
                        imageFull: hemisEmployeeWithoutRelations.imageFull,
                      },
                    },
                  };
                } else {
                  console.log(`⚠️  Employee not found even without relations`);
                }
              }
            } catch (retryError: any) {
              console.error(`⚠️  Error in retry (without relations): ${retryError.message}`);
            }
          }
          
          console.error(`⚠️  This error is caught and will not block login. ProfileId will remain: ${profileId}`);
          // Continue - don't block login even if linking fails
        }
      } else if (provider.name === 'student' || provider.name === 'student_portal') {
        try {
          // Student OAuth data'da id to'g'ridan-to'g'ri hemis_students.hemis_id ga mos keladi
          const searchHemisId = oauthUserData.id 
            ? parseInt(oauthUserData.id.toString(), 10)
            : parseInt(providerUserId, 10);
          
          if (!isNaN(searchHemisId)) {
            const hemisStudent = await this.hemisStudentRepo.findOne({
              where: { hemisId: searchHemisId } as any,
              relations: ['department', 'specialty', 'group', 'university', 'gender', 'semester'],
            });

            if (hemisStudent) {
              profileId = hemisStudent.id;
              enrichedOAuthData = {
                ...oauthUserData,
                hemis_sync_data: {
                  student: {
                    id: hemisStudent.id,
                    hemisId: hemisStudent.hemisId,
                    fullName: hemisStudent.fullName,
                    firstName: hemisStudent.firstName,
                    secondName: hemisStudent.secondName,
                    thirdName: hemisStudent.thirdName,
                    studentIdNumber: hemisStudent.studentIdNumber,
                    birthDate: hemisStudent.birthDate,
                    email: oauthUserData.email || null,
                    phone: oauthUserData.phone || null,
                    image: hemisStudent.image,
                    imageFull: hemisStudent.imageFull,
                    avgGpa: hemisStudent.avgGpa,
                    avgGrade: hemisStudent.avgGrade,
                    totalCredit: hemisStudent.totalCredit,
                  },
                },
              };
              console.log(`✅ Linked existing Student OAuth account to student ${hemisStudent.id} (hemisId: ${searchHemisId})`);
            }
          }
        } catch (error) {
          console.error(`⚠️  Error linking HEMIS student: ${error.message}`);
        }
      } else if (profileId) {
        // Update existing sync data if already linked
        enrichedOAuthData = {
          ...oauthUserData,
          hemis_sync_data: existingOAuthAccount.oauth_data?.hemis_sync_data || null,
        };
      }

      // Update last_login, OAuth data, and profile link
      console.log(`💾 Updating existing OAuth account - Current profileId: ${existingOAuthAccount.profileId}, New profileId: ${profileId}`);
      console.log(`💾 OAuth data keys before update: ${Object.keys(existingOAuthAccount.oauth_data || {}).join(', ')}`);
      existingOAuthAccount.oauth_data = enrichedOAuthData;
      existingOAuthAccount.profileId = profileId;
      existingOAuthAccount.last_login = new Date();
      console.log(`💾 Before save - profileId in memory: ${existingOAuthAccount.profileId}, oauth_data exists: ${!!existingOAuthAccount.oauth_data}`);
      
      // Force save all fields explicitly
      await this.oauthAccountRepo.update(existingOAuthAccount.id, {
        oauth_data: enrichedOAuthData,
        profileId: profileId,
        last_login: new Date(),
      });
      
      // Reload to verify
      const savedAccount = await this.oauthAccountRepo.findOne({ where: { id: existingOAuthAccount.id } });
      console.log(`💾 Saved OAuth account - profileId: ${savedAccount?.profileId}, id: ${savedAccount?.id}, last_login: ${savedAccount?.last_login}`);

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

    // Try to link with HEMIS sync data (for hemis and student providers)
    console.log(`[DEBUG] New user path - trying to link HEMIS data for provider: ${provider.name}`);
    let profileId: number | null = null;
    let enrichedOAuthData = { ...oauthUserData };

    if (provider.name === 'hemis') {
      // Find employee in hemis_employees by hemisId (employee_id ustunlik beriladi)
      try {
        // HEMIS OAuth data'da employee_id mavjud bo'lsa, uni ishlatamiz (bu hemis_employees.hemis_id ga mos keladi)
        // Aks holda provider_user_id (id) ni ishlatamiz
        console.log(`🔍 Searching HEMIS employee - OAuth data keys: ${Object.keys(oauthUserData).join(', ')}`);
        console.log(`🔍 employee_id: ${oauthUserData.employee_id}, providerUserId: ${providerUserId}`);
        
        const searchHemisId = oauthUserData.employee_id 
          ? parseInt(oauthUserData.employee_id.toString(), 10)
          : parseInt(providerUserId, 10);
        
        console.log(`🔍 Search hemisId: ${searchHemisId} (from ${oauthUserData.employee_id ? 'employee_id' : 'id'})`);
        
        if (!isNaN(searchHemisId)) {
          let hemisEmployee: any = null;
          
          // First, try to find WITHOUT relations to avoid TypeORM relation errors
          try {
            hemisEmployee = await this.hemisEmployeeRepo.findOne({
              where: { hemisId: searchHemisId } as any,
              // No relations first - avoid errors
            });
            console.log(`[DEBUG] Found employee WITHOUT relations (new user): ${hemisEmployee ? `DB ID ${hemisEmployee.id}, hemisId ${hemisEmployee.hemisId}` : 'NOT FOUND'}`);
          } catch (findError: any) {
            console.error(`[ERROR] Error finding employee WITHOUT relations (new user): ${findError?.message || String(findError)}`);
            hemisEmployee = null;
          }
          
          // If found, try to load relations separately (optional)
          if (hemisEmployee) {
            try {
              const employeeWithRelations = await this.hemisEmployeeRepo.findOne({
                where: { hemisId: searchHemisId } as any,
                relations: ['department', 'gender'],
              });
              if (employeeWithRelations) {
                hemisEmployee = employeeWithRelations;
                console.log(`[DEBUG] Successfully loaded employee WITH relations (new user)`);
              }
            } catch (relError: any) {
              console.error(`[WARN] Could not load relations (new user), using without: ${relError?.message || String(relError)}`);
              // Keep hemisEmployee without relations - that's fine
            }
          }

          console.log(`🔍 Found employee: ${hemisEmployee ? `ID ${hemisEmployee.id}, hemisId ${hemisEmployee.hemisId}` : 'NOT FOUND'}`);

          if (hemisEmployee) {
            profileId = hemisEmployee.id;
            // Enrich oauth_data with full employee data from sync
            enrichedOAuthData = {
              ...oauthUserData,
              hemis_sync_data: {
                employee: {
                  id: hemisEmployee.id,
                  hemisId: hemisEmployee.hemisId,
                  fullName: hemisEmployee.fullName,
                  firstName: hemisEmployee.firstName,
                  secondName: hemisEmployee.secondName,
                  thirdName: hemisEmployee.thirdName,
                  employeeIdNumber: hemisEmployee.employeeIdNumber,
                  birthDate: hemisEmployee.birthDate,
                  email: oauthUserData.email || null,
                  phone: oauthUserData.phone || null,
                  image: hemisEmployee.image,
                  imageFull: hemisEmployee.imageFull,
                  // Include relation data if available
                  department: hemisEmployee.department ? {
                    id: hemisEmployee.department.id,
                    code: hemisEmployee.department.code,
                    name: hemisEmployee.department.name,
                  } : null,
                },
              },
            };
            console.log(`✅ Linked HEMIS OAuth account to employee ${hemisEmployee.id} (hemisId: ${searchHemisId}, provider_user_id: ${providerUserId})`);
          } else {
            console.log(`⚠️  HEMIS employee not found in sync data for hemisId: ${searchHemisId} (searched via ${oauthUserData.employee_id ? 'employee_id' : 'id'})`);
          }
        } else {
          console.log(`⚠️  Invalid hemisId for search: ${searchHemisId} (employee_id: ${oauthUserData.employee_id}, providerUserId: ${providerUserId})`);
        }
      } catch (error: any) {
        const errorMsg = error?.message || String(error || '');
        console.error(`⚠️  Error linking HEMIS employee: ${errorMsg}`);
        console.error(`⚠️  Error stack: ${error?.stack || 'No stack trace'}`);
        console.error(`[DEBUG] Error message includes 'university': ${errorMsg.includes('university')}`);
        console.error(`[DEBUG] Error message includes 'Property': ${errorMsg.includes('Property')}`);
        
        // Try to find employee without relations if relations caused the error
        if (errorMsg.includes('university') || errorMsg.includes('Property') || errorMsg.includes('not found')) {
          console.log(`[DEBUG] Trying to find employee without relations (new user path)...`);
          try {
            const searchHemisId = oauthUserData.employee_id 
              ? parseInt(oauthUserData.employee_id.toString(), 10)
              : parseInt(providerUserId, 10);
            
            if (!isNaN(searchHemisId)) {
              const hemisEmployeeWithoutRelations = await this.hemisEmployeeRepo.findOne({
                where: { hemisId: searchHemisId } as any,
                // No relations - just get the ID
              });

              if (hemisEmployeeWithoutRelations) {
                profileId = hemisEmployeeWithoutRelations.id;
                console.log(`[DEBUG] Found employee without relations (new user) - profileId: ${profileId}`);
                
                // Build enriched data manually without accessing relations
                enrichedOAuthData = {
                  ...oauthUserData,
                  hemis_sync_data: {
                    employee: {
                      id: hemisEmployeeWithoutRelations.id,
                      hemisId: hemisEmployeeWithoutRelations.hemisId,
                      fullName: hemisEmployeeWithoutRelations.fullName,
                      firstName: hemisEmployeeWithoutRelations.firstName,
                      secondName: hemisEmployeeWithoutRelations.secondName,
                      thirdName: hemisEmployeeWithoutRelations.thirdName,
                      employeeIdNumber: hemisEmployeeWithoutRelations.employeeIdNumber,
                      birthDate: hemisEmployeeWithoutRelations.birthDate,
                      email: oauthUserData.email || null,
                      phone: oauthUserData.phone || null,
                      image: hemisEmployeeWithoutRelations.image,
                      imageFull: hemisEmployeeWithoutRelations.imageFull,
                    },
                  },
                };
              } else {
                console.log(`[DEBUG] Employee not found even without relations (new user)`);
              }
            }
          } catch (retryError: any) {
            console.error(`[ERROR] Error in retry (without relations, new user): ${retryError?.message || String(retryError)}`);
          }
        }
        console.log(`[DEBUG] New user path - Final profileId after error handling: ${profileId}`);
      }
    } else if (provider.name === 'student' || provider.name === 'student_portal') {
      // Find student in hemis_students by hemisId
      // Student provider'da id to'g'ridan-to'g'ri hemis_students.hemis_id ga mos keladi
      try {
        // Student OAuth data'da id field'i hemis_students.hemis_id ga to'g'ri keladi
        const searchHemisId = oauthUserData.id 
          ? parseInt(oauthUserData.id.toString(), 10)
          : parseInt(providerUserId, 10);
        
        if (!isNaN(searchHemisId)) {
          const hemisStudent = await this.hemisStudentRepo.findOne({
            where: { hemisId: searchHemisId } as any,
            relations: ['department', 'specialty', 'group', 'university', 'gender', 'semester'],
          });

          if (hemisStudent) {
            profileId = hemisStudent.id;
            // Enrich oauth_data with full student data from sync
            enrichedOAuthData = {
              ...oauthUserData,
              hemis_sync_data: {
                student: {
                  id: hemisStudent.id,
                  hemisId: hemisStudent.hemisId,
                  fullName: hemisStudent.fullName,
                  firstName: hemisStudent.firstName,
                  secondName: hemisStudent.secondName,
                  thirdName: hemisStudent.thirdName,
                  studentIdNumber: hemisStudent.studentIdNumber,
                  birthDate: hemisStudent.birthDate,
                  email: oauthUserData.email || null,
                  phone: oauthUserData.phone || null,
                  image: hemisStudent.image,
                  imageFull: hemisStudent.imageFull,
                  avgGpa: hemisStudent.avgGpa,
                  avgGrade: hemisStudent.avgGrade,
                  totalCredit: hemisStudent.totalCredit,
                  // Include relation data if available
                  department: hemisStudent.department ? {
                    id: hemisStudent.department.id,
                    code: hemisStudent.department.code,
                    name: hemisStudent.department.name,
                  } : null,
                  specialty: hemisStudent.specialty ? {
                    id: hemisStudent.specialty.id,
                    code: hemisStudent.specialty.code,
                    name: hemisStudent.specialty.name,
                  } : null,
                  group: hemisStudent.group ? {
                    id: hemisStudent.group.id,
                    name: hemisStudent.group.name,
                  } : null,
                  university: hemisStudent.university ? {
                    id: hemisStudent.university.id,
                    code: hemisStudent.university.code,
                    name: hemisStudent.university.name,
                  } : null,
                  semester: hemisStudent.semester ? {
                    id: hemisStudent.semester.id,
                    hemisId: hemisStudent.semester.hemisId,
                    code: hemisStudent.semester.code,
                    name: hemisStudent.semester.name,
                  } : null,
                },
              },
            };
            console.log(`✅ Linked Student OAuth account to student ${hemisStudent.id} (hemisId: ${searchHemisId}, provider_user_id: ${providerUserId})`);
          } else {
            console.log(`⚠️  HEMIS student not found in sync data for hemisId: ${searchHemisId} (searched via id)`);
          }
        }
      } catch (error) {
        console.error(`⚠️  Error linking HEMIS student: ${error.message}`);
      }
    }

    // Create OAuth account link
    console.log(`[DEBUG] Creating new OAuth account - profileId: ${profileId}, provider_user_id: ${providerUserId}`);
    const oauthAccount = this.oauthAccountRepo.create({
      user: user,
      provider: provider,
      provider_user_id: providerUserId,
      oauth_data: enrichedOAuthData, // Use enriched data with HEMIS sync info
      profileId: profileId, // Single profile_id field (hemis_employees.id or hemis_students.id)
      last_login: new Date(),
    });
    await this.oauthAccountRepo.save(oauthAccount);
    console.log(`[DEBUG] Created new OAuth account - ID: ${oauthAccount.id}, profileId: ${oauthAccount.profileId}`);

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
        let oldUser = existingOAuthAccount.user;

        if (!targetUser) {
          throw new NotFoundException(
            `Target user with ID ${userId} not found`,
          );
        }

        // IMPORTANT: Check if oldUser is already merged to another user
        // If so, we should merge to the main user of that merge chain
        if (oldUser.status === 'blocked') {
          const existingMerge = await this.mergeHistoryRepo.findOne({
            where: { merged_user: { id: oldUser.id } },
            relations: ['main_user'],
          });
          
          if (existingMerge && existingMerge.main_user) {
            // oldUser already merged to another user - use that main user instead
            const previousMainUser = existingMerge.main_user;
            console.warn(
              `⚠️  User ${oldUser.id} is already merged to user ${previousMainUser.id}. ` +
              `Transferring OAuth account directly to target user ${targetUser.id} instead.`,
            );
            // If targetUser is the same as previousMainUser, no merge needed
            if (previousMainUser.id === targetUser.id) {
              console.log(`   ℹ️  Target user is already the main user - just updating OAuth account`);
              existingOAuthAccount.user = targetUser;
              existingOAuthAccount.oauth_data = oauthUserData;
              existingOAuthAccount.last_login = new Date();
              await this.oauthAccountRepo.save(existingOAuthAccount);
              console.log(`✅ OAuth account updated (already merged to this user)`);
              return;
            }
            // Otherwise, we'll merge previousMainUser to targetUser
            oldUser = previousMainUser;
            console.log(`   🔄 Will merge previous main user ${oldUser.id} to target user ${targetUser.id}`);
          }
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

        // Check if merge history already exists (to prevent duplicates)
        let mergeHistory = await this.mergeHistoryRepo.findOne({
          where: {
            main_user: { id: targetUser.id },
            merged_user: { id: oldUser.id },
          },
        });

        if (!mergeHistory) {
          // Create merge history record only if it doesn't exist
          mergeHistory = this.mergeHistoryRepo.create({
            main_user: targetUser,
            merged_user: oldUser,
          });
          await this.mergeHistoryRepo.save(mergeHistory);
          console.log(`   📝 Merge history recorded (ID: ${mergeHistory.id})`);
        } else {
          console.log(`   ℹ️  Merge history already exists (ID: ${mergeHistory.id}) - skipping duplicate creation`);
        }

        // Block old user (NO soft delete - user saqlanadi!)
        // IMPORTANT: Only change status, keep deleted_at as NULL!
        oldUser.status = 'blocked'; // Block the merged user
        // Explicitly ensure deleted_at remains NULL (don't modify it)
        // Note: TypeORM nullable fields can be null even if TypeScript type is Date
        if (oldUser.deleted_at != null) {
          (oldUser as any).deleted_at = null;
        }
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
