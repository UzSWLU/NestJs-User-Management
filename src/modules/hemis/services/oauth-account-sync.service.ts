import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { UserOAuthAccount } from '../../../database/entities/oauth/user-oauth-account.entity';
import { OAuthProvider } from '../../../database/entities/oauth/oauth-provider.entity';
import { UserMergeHistory } from '../../../database/entities/oauth/user-merge-history.entity';
import { HemisEmployee } from '../../../database/entities/hemis/employee.entity';
import { HemisStudent } from '../../../database/entities/hemis/student.entity';
import { User } from '../../../database/entities/core/user.entity';
import { UserRole } from '../../../database/entities/core/user-role.entity';
import { Role } from '../../../database/entities/core/role.entity';
import { Company } from '../../../database/entities/core/company.entity';
import * as bcrypt from 'bcrypt';

/**
 * Service to sync OAuth accounts with HEMIS sync data
 * This ensures that user_oauth_accounts.profileId and oauth_data are always up-to-date
 * even when HEMIS data is synced via scheduled jobs
 */
@Injectable()
export class OAuthAccountSyncService {
  private readonly logger = new Logger(OAuthAccountSyncService.name);

  constructor(
    @InjectRepository(UserOAuthAccount)
    private readonly oauthAccountRepo: Repository<UserOAuthAccount>,
    @InjectRepository(OAuthProvider)
    private readonly providerRepo: Repository<OAuthProvider>,
    @InjectRepository(UserMergeHistory)
    private readonly mergeHistoryRepo: Repository<UserMergeHistory>,
    @InjectRepository(HemisEmployee)
    private readonly employeeRepo: Repository<HemisEmployee>,
    @InjectRepository(HemisStudent)
    private readonly studentRepo: Repository<HemisStudent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  /**
   * Update OAuth accounts for employees after sync
   * Links user_oauth_accounts with hemis_employees based on hemisId
   */
  async syncEmployeeOAuthAccounts(employeeIds: number[]): Promise<void> {
    if (!employeeIds || employeeIds.length === 0) {
      return;
    }

    try {
      // Get hemis provider
      const hemisProvider = await this.providerRepo.findOne({
        where: { name: 'hemis' },
      });

      if (!hemisProvider) {
        this.logger.warn('⚠️  HEMIS provider not found, skipping OAuth account sync');
        return;
      }

      // Get all employees that were synced
      const employees = await this.employeeRepo.find({
        where: { id: In(employeeIds) },
        relations: ['department', 'gender'],
      });

      this.logger.log(`🔄 Syncing OAuth accounts for ${employees.length} employees...`);

      let updatedCount = 0;
      let linkedCount = 0;
      let createdCount = 0;

      for (const employee of employees) {
        try {
          // Find OAuth account by provider_user_id (which should match employee_id from OAuth)
          // For HEMIS provider, we need to find accounts where provider_user_id matches
          // either the OAuth user's id (2204) or employee_id (1826)
          // We'll search by hemisId first, then try employee_id_number as fallback
          
          // Search strategy:
          // 1. Search by provider_user_id = employee.hemisId (direct match)
          // 2. Search by provider_user_id = employee.employeeIdNumber (fallback)
          const oauthAccounts = await this.oauthAccountRepo.find({
            where: {
              provider: { id: hemisProvider.id },
              provider_user_id: In([
                employee.hemisId.toString(),
                employee.employeeIdNumber.toString(),
              ]),
            },
            relations: ['user', 'provider'],
          });

          if (oauthAccounts.length > 0) {
            // OAuth account mavjud - update qilish
            for (const account of oauthAccounts) {
              // IMPORTANT: Check if user is merged - if so, OAuth account should be linked to main user
              // This handles cases where sync runs after merge but OAuth account wasn't yet transferred
              let targetUser = account.user;
              
              if (targetUser.status === 'blocked') {
                // Check if this user was merged
                const mergeHistory = await this.mergeHistoryRepo.findOne({
                  where: { merged_user: { id: targetUser.id } },
                  relations: ['main_user'],
                });
                
                if (mergeHistory && mergeHistory.main_user) {
                  // User was merged, update OAuth account to point to main user
                  targetUser = mergeHistory.main_user;
                  this.logger.log(
                    `🔄 Merged user detected: OAuth account ${account.id} will be updated for main user ${targetUser.id} instead of merged user ${account.user.id}`,
                  );
                  
                  // Transfer OAuth account to main user
                  account.user = targetUser;
                  await this.oauthAccountRepo.save(account);
                  this.logger.log(`✅ OAuth account ${account.id} transferred to main user ${targetUser.id}`);
                }
              }
              
              // Update profileId and enrich oauth_data
              const updatedOAuthData = {
                ...(account.oauth_data || {}),
                hemis_sync_data: {
                  employee: {
                    id: employee.id,
                    hemisId: employee.hemisId,
                    fullName: employee.fullName,
                    firstName: employee.firstName,
                    secondName: employee.secondName,
                    thirdName: employee.thirdName,
                    employeeIdNumber: employee.employeeIdNumber,
                    birthDate: employee.birthDate,
                    email: account.oauth_data?.email || null,
                    phone: account.oauth_data?.phone || null,
                    image: employee.image,
                    imageFull: employee.imageFull,
                    department: employee.department ? {
                      id: employee.department.id,
                      code: employee.department.code,
                      name: employee.department.name,
                    } : null,
                  },
                },
              };

              // Update account
              await this.oauthAccountRepo.update(account.id, {
                profileId: employee.id,
                oauth_data: updatedOAuthData,
              });

              if (!account.profileId) {
                linkedCount++; // Newly linked
              }
              updatedCount++;
            }
          } else {
            // OAuth account mavjud emas - yangi user va OAuth account yaratish
            this.logger.log(
              `📝 No OAuth account found for employee ${employee.id} (hemisId: ${employee.hemisId}), creating new user...`,
            );
            
            try {
              await this.createUserAndOAuthAccountForEmployee(employee, hemisProvider);
              createdCount++;
            } catch (createError: any) {
              this.logger.error(
                `⚠️  Error creating user/OAuth account for employee ${employee.id}: ${createError.message}`,
              );
              // Continue with next employee
            }
          }
        } catch (error: any) {
          this.logger.error(
            `⚠️  Error syncing OAuth account for employee ${employee.id}: ${error.message}`,
          );
          // Continue with next employee
        }
      }

      this.logger.log(
        `✅ OAuth account sync completed: ${updatedCount} updated, ${linkedCount} newly linked, ${createdCount} created`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Error in OAuth account sync for employees: ${error.message}`);
      // Don't throw - allow sync to continue
    }
  }

  /**
   * Update OAuth accounts for students after sync
   * Links user_oauth_accounts with hemis_students based on hemisId
   */
  async syncStudentOAuthAccounts(studentIds: number[]): Promise<void> {
    if (!studentIds || studentIds.length === 0) {
      return;
    }

    try {
      // Get student provider (could be 'student' or 'student_portal')
      const studentProvider = await this.providerRepo.findOne({
        where: { name: 'student' },
      });

      if (!studentProvider) {
        this.logger.warn('⚠️  Student provider not found, skipping OAuth account sync');
        return;
      }

      // Get all students that were synced
      const students = await this.studentRepo.find({
        where: { id: In(studentIds) },
        relations: ['department', 'specialty', 'group', 'university', 'gender', 'semester'],
      });

      this.logger.log(`🔄 Syncing OAuth accounts for ${students.length} students...`);

      let updatedCount = 0;
      let linkedCount = 0;
      let createdCount = 0;

      for (const student of students) {
        try {
          // For student provider, provider_user_id should match student.hemisId
          const oauthAccounts = await this.oauthAccountRepo.find({
            where: {
              provider: { id: studentProvider.id },
              provider_user_id: student.hemisId.toString(),
            },
            relations: ['user', 'provider'],
          });

          if (oauthAccounts.length > 0) {
            // OAuth account mavjud - update qilish
            for (const account of oauthAccounts) {
              // IMPORTANT: Check if user is merged - if so, OAuth account should be linked to main user
              // This handles cases where sync runs after merge but OAuth account wasn't yet transferred
              let targetUser = account.user;
              
              if (targetUser.status === 'blocked') {
                // Check if this user was merged
                const mergeHistory = await this.mergeHistoryRepo.findOne({
                  where: { merged_user: { id: targetUser.id } },
                  relations: ['main_user'],
                });
                
                if (mergeHistory && mergeHistory.main_user) {
                  // User was merged, update OAuth account to point to main user
                  targetUser = mergeHistory.main_user;
                  this.logger.log(
                    `🔄 Merged user detected: OAuth account ${account.id} will be updated for main user ${targetUser.id} instead of merged user ${account.user.id}`,
                  );
                  
                  // Transfer OAuth account to main user
                  account.user = targetUser;
                  await this.oauthAccountRepo.save(account);
                  this.logger.log(`✅ OAuth account ${account.id} transferred to main user ${targetUser.id}`);
                }
              }
              
              // Update profileId and enrich oauth_data
              const updatedOAuthData = {
                ...(account.oauth_data || {}),
                hemis_sync_data: {
                  student: {
                    id: student.id,
                    hemisId: student.hemisId,
                    fullName: student.fullName,
                    firstName: student.firstName,
                    secondName: student.secondName,
                    thirdName: student.thirdName,
                    studentIdNumber: student.studentIdNumber,
                    birthDate: student.birthDate,
                    email: account.oauth_data?.email || null,
                    phone: account.oauth_data?.phone || null,
                    image: student.image,
                    imageFull: student.imageFull,
                    avgGpa: student.avgGpa,
                    avgGrade: student.avgGrade,
                    totalCredit: student.totalCredit,
                    department: student.department ? {
                      id: student.department.id,
                      code: student.department.code,
                      name: student.department.name,
                    } : null,
                    specialty: student.specialty ? {
                      id: student.specialty.id,
                      code: student.specialty.code,
                      name: student.specialty.name,
                    } : null,
                    group: student.group ? {
                      id: student.group.id,
                      name: student.group.name,
                    } : null,
                    university: student.university ? {
                      id: student.university.id,
                      code: student.university.code,
                      name: student.university.name,
                    } : null,
                    semester: student.semester ? {
                      id: student.semester.id,
                      hemisId: student.semester.hemisId,
                      code: student.semester.code,
                      name: student.semester.name,
                    } : null,
                  },
                },
              };

              // Update account
              await this.oauthAccountRepo.update(account.id, {
                profileId: student.id,
                oauth_data: updatedOAuthData,
              });

              if (!account.profileId) {
                linkedCount++; // Newly linked
              }
              updatedCount++;
            }
          } else {
            // OAuth account mavjud emas - yangi user va OAuth account yaratish
            this.logger.log(
              `📝 No OAuth account found for student ${student.id} (hemisId: ${student.hemisId}), creating new user...`,
            );
            
            try {
              await this.createUserAndOAuthAccountForStudent(student, studentProvider);
              createdCount++;
            } catch (createError: any) {
              this.logger.error(
                `⚠️  Error creating user/OAuth account for student ${student.id}: ${createError.message}`,
              );
              // Continue with next student
            }
          }
        } catch (error: any) {
          this.logger.error(
            `⚠️  Error syncing OAuth account for student ${student.id}: ${error.message}`,
          );
          // Continue with next student
        }
      }

      this.logger.log(
        `✅ OAuth account sync completed: ${updatedCount} updated, ${linkedCount} newly linked, ${createdCount} created`,
      );
    } catch (error: any) {
      this.logger.error(`❌ Error in OAuth account sync for students: ${error.message}`);
      // Don't throw - allow sync to continue
    }
  }

  /**
   * Create new user and OAuth account for employee
   */
  private async createUserAndOAuthAccountForEmployee(
    employee: HemisEmployee,
    provider: OAuthProvider,
  ): Promise<void> {
    // Check if default company exists
    const defaultCompany = await this.companyRepo.findOne({ where: { id: 1 } });
    if (!defaultCompany) {
      this.logger.error('⚠️  Default company (ID: 1) not found, cannot create user');
      throw new Error('Default company not found');
    }

    // Check if OAuth account already exists for this provider_user_id (avoid duplicate)
    // IMPORTANT: Search by both hemisId AND employeeIdNumber (same as in syncEmployeeOAuthAccounts)
    // Also check if it belongs to a merged user - if so, use main user
    const existingOAuthAccounts = await this.oauthAccountRepo.find({
      where: {
        provider: { id: provider.id },
        provider_user_id: In([
          employee.hemisId.toString(),
          employee.employeeIdNumber.toString(),
        ]),
      },
      relations: ['user'],
    });

    if (existingOAuthAccounts.length > 0) {
      // Check all found accounts and transfer blocked ones to main user
      for (const account of existingOAuthAccounts) {
        // Check if OAuth account user is blocked (merged)
        if (account.user.status === 'blocked') {
          const mergeHistory = await this.mergeHistoryRepo.findOne({
            where: { merged_user: { id: account.user.id } },
            relations: ['main_user'],
          });
          
          if (mergeHistory && mergeHistory.main_user) {
            this.logger.log(
              `🔄 OAuth account exists for merged user ${account.user.id}, will update for main user ${mergeHistory.main_user.id}`,
            );
            // Transfer OAuth account to main user
            account.user = mergeHistory.main_user;
            await this.oauthAccountRepo.save(account);
            this.logger.log(`✅ OAuth account ${account.id} transferred to main user ${mergeHistory.main_user.id}`);
          }
        }
      }
      
      // After transfers, check again if any active account exists
      const finalOAuthAccounts = await this.oauthAccountRepo.find({
        where: {
          provider: { id: provider.id },
          provider_user_id: In([
            employee.hemisId.toString(),
            employee.employeeIdNumber.toString(),
          ]),
        },
        relations: ['user'],
      });
      
      // Check if any account exists for active user
      const activeAccount = finalOAuthAccounts.find(acc => acc.user.status === 'active');
      
      if (activeAccount) {
        this.logger.warn(
          `⚠️  OAuth account already exists for employee ${employee.id} (hemisId: ${employee.hemisId}, employeeIdNumber: ${employee.employeeIdNumber}), skipping creation`,
        );
        return;
      }
    }

    // Generate unique username
    const baseUsername = `employee_${employee.employeeIdNumber}`;
    let username = baseUsername;
    let usernameCounter = 1;
    
    // Check if username already exists (with limit to avoid infinite loop)
    // IMPORTANT: Skip blocked users (merged users) - don't create duplicates for them
    let existingUser = await this.userRepo.findOne({ 
      where: { username, deleted_at: IsNull() },
    });
    
    while (existingUser && existingUser.status !== 'blocked' && usernameCounter < 100) {
      username = `${baseUsername}_${usernameCounter}`;
      usernameCounter++;
      existingUser = await this.userRepo.findOne({ 
        where: { username, deleted_at: IsNull() },
      });
    }

    if (usernameCounter >= 100) {
      // Fallback to timestamp-based username
      username = `employee_${employee.employeeIdNumber}_${Date.now()}`;
    }

    // Generate unique email
    const baseEmail = `employee_${employee.hemisId}@hemis.oauth`;
    let email = baseEmail;
    let emailCounter = 1;
    
    // Check if email already exists (with limit to avoid infinite loop)
    // IMPORTANT: Skip blocked users (merged users) - don't create duplicates for them
    let existingUserByEmail = await this.userRepo.findOne({ 
      where: { email, deleted_at: IsNull() },
    });
    
    while (existingUserByEmail && existingUserByEmail.status !== 'blocked' && emailCounter < 100) {
      email = `employee_${employee.hemisId}_${emailCounter}@hemis.oauth`;
      emailCounter++;
      existingUserByEmail = await this.userRepo.findOne({ 
        where: { email, deleted_at: IsNull() },
      });
    }

    if (emailCounter >= 100) {
      // Fallback to timestamp-based email
      email = `employee_${employee.hemisId}_${Date.now()}@hemis.oauth`;
    }

    // Generate random password hash (OAuth users don't use password login)
    const randomPassword =
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    try {
      // Create user
      const user = this.userRepo.create({
        username,
        email,
        full_name: employee.fullName || undefined,
        avatar: employee.image || employee.imageFull || undefined,
        password_hash: passwordHash,
        status: 'active',
        email_verified: false,
        phone_verified: false,
        companyId: 1, // Default company
      });

      const savedUser = await this.userRepo.save(user);
      this.logger.log(`✅ Created new user ${savedUser.id} (${savedUser.username}) for employee ${employee.id}`);

      // Assign default role if available
      const defaultRole = await this.roleRepo.findOne({ where: { name: 'employee' } });
      if (!defaultRole) {
        // Fallback to 'user' role if 'employee' role doesn't exist
        const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
        if (userRole) {
          const userRoleEntity = this.userRoleRepo.create({
            user: savedUser,
            role: userRole,
          });
          await this.userRoleRepo.save(userRoleEntity);
          this.logger.log(`✅ Assigned 'user' role to new employee user ${savedUser.id}`);
        }
      } else {
        const userRoleEntity = this.userRoleRepo.create({
          user: savedUser,
          role: defaultRole,
        });
        await this.userRoleRepo.save(userRoleEntity);
        this.logger.log(`✅ Assigned 'employee' role to new employee user ${savedUser.id}`);
      }

      // Create OAuth account
      const oauthData = {
        employee_id: employee.hemisId,
        id: employee.hemisId,
        full_name: employee.fullName,
        first_name: employee.firstName,
        second_name: employee.secondName,
        third_name: employee.thirdName,
        employee_id_number: employee.employeeIdNumber,
        birth_date: employee.birthDate,
        image: employee.image,
        image_full: employee.imageFull,
        hemis_sync_data: {
          employee: {
            id: employee.id,
            hemisId: employee.hemisId,
            fullName: employee.fullName,
            firstName: employee.firstName,
            secondName: employee.secondName,
            thirdName: employee.thirdName,
            employeeIdNumber: employee.employeeIdNumber,
            birthDate: employee.birthDate,
            email: null,
            phone: null,
            image: employee.image,
            imageFull: employee.imageFull,
            department: employee.department ? {
              id: employee.department.id,
              code: employee.department.code,
              name: employee.department.name,
            } : null,
          },
        },
      };

      // For HEMIS provider, provider_user_id should be hemisId (employee_id takes priority)
      const providerUserId = employee.hemisId.toString();

      // Double-check OAuth account doesn't exist (race condition prevention)
      // IMPORTANT: Check both hemisId AND employeeIdNumber to prevent duplicates
      const duplicateCheck = await this.oauthAccountRepo.findOne({
        where: {
          provider: { id: provider.id },
          provider_user_id: In([
            employee.hemisId.toString(),
            employee.employeeIdNumber.toString(),
          ]),
        },
        relations: ['user'],
      });

      if (duplicateCheck) {
        // If OAuth account exists but for blocked user, check merge history
        if (duplicateCheck.user.status === 'blocked') {
          const mergeHistory = await this.mergeHistoryRepo.findOne({
            where: { merged_user: { id: duplicateCheck.user.id } },
            relations: ['main_user'],
          });
          
          if (mergeHistory && mergeHistory.main_user) {
            // Transfer to main user and continue
            duplicateCheck.user = mergeHistory.main_user;
            await this.oauthAccountRepo.save(duplicateCheck);
            this.logger.log(`✅ OAuth account ${duplicateCheck.id} transferred to main user ${mergeHistory.main_user.id}`);
          }
        }
        
        this.logger.warn(
          `⚠️  OAuth account already exists for provider_user_id ${duplicateCheck.provider_user_id} (hemisId: ${employee.hemisId}, employeeIdNumber: ${employee.employeeIdNumber}), skipping creation`,
        );
        return;
      }

      const oauthAccount = this.oauthAccountRepo.create({
        user: savedUser,
        provider: provider,
        provider_user_id: providerUserId,
        oauth_data: oauthData,
        profileId: employee.id,
        last_login: undefined,
      });

      await this.oauthAccountRepo.save(oauthAccount);
      this.logger.log(
        `✅ Created OAuth account ${oauthAccount.id} for user ${savedUser.id} linked to employee ${employee.id}`,
      );
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        const errorMsg = error.message || '';
        if (errorMsg.includes('username') || errorMsg.includes('email') || errorMsg.includes('phone')) {
          this.logger.error(
            `⚠️  Unique constraint violation while creating user for employee ${employee.id}: ${errorMsg}`,
          );
          // Try to find existing user and skip creation
          return;
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Create new user and OAuth account for student
   */
  private async createUserAndOAuthAccountForStudent(
    student: HemisStudent,
    provider: OAuthProvider,
  ): Promise<void> {
    // Check if default company exists
    const defaultCompany = await this.companyRepo.findOne({ where: { id: 1 } });
    if (!defaultCompany) {
      this.logger.error('⚠️  Default company (ID: 1) not found, cannot create user');
      throw new Error('Default company not found');
    }

    // Check if OAuth account already exists for this provider_user_id (avoid duplicate)
    // IMPORTANT: Search by both hemisId AND studentIdNumber (same as in syncStudentOAuthAccounts)
    // Also check if it belongs to a merged user - if so, use main user
    const existingOAuthAccounts = await this.oauthAccountRepo.find({
      where: {
        provider: { id: provider.id },
        provider_user_id: In([
          student.hemisId.toString(),
          student.studentIdNumber.toString(),
        ]),
      },
      relations: ['user'],
    });

    if (existingOAuthAccounts.length > 0) {
      // Check all found accounts and transfer blocked ones to main user
      for (const account of existingOAuthAccounts) {
        // Check if OAuth account user is blocked (merged)
        if (account.user.status === 'blocked') {
          const mergeHistory = await this.mergeHistoryRepo.findOne({
            where: { merged_user: { id: account.user.id } },
            relations: ['main_user'],
          });
          
          if (mergeHistory && mergeHistory.main_user) {
            this.logger.log(
              `🔄 OAuth account exists for merged user ${account.user.id}, will update for main user ${mergeHistory.main_user.id}`,
            );
            // Transfer OAuth account to main user
            account.user = mergeHistory.main_user;
            await this.oauthAccountRepo.save(account);
            this.logger.log(`✅ OAuth account ${account.id} transferred to main user ${mergeHistory.main_user.id}`);
          }
        }
      }
      
      // After transfers, check again if any active account exists
      const finalOAuthAccounts = await this.oauthAccountRepo.find({
        where: {
          provider: { id: provider.id },
          provider_user_id: In([
            student.hemisId.toString(),
            student.studentIdNumber.toString(),
          ]),
        },
        relations: ['user'],
      });
      
      // Check if any account exists for active user
      const activeAccount = finalOAuthAccounts.find(acc => acc.user.status === 'active');
      
      if (activeAccount) {
        this.logger.warn(
          `⚠️  OAuth account already exists for student ${student.id} (hemisId: ${student.hemisId}, studentIdNumber: ${student.studentIdNumber}), skipping creation`,
        );
        return;
      }
    }

    // Generate unique username
    const baseUsername = `student_${student.studentIdNumber}`;
    let username = baseUsername;
    let usernameCounter = 1;
    
    // Check if username already exists (with limit to avoid infinite loop)
    // IMPORTANT: Skip blocked users (merged users) - don't create duplicates for them
    let existingUser = await this.userRepo.findOne({ 
      where: { username, deleted_at: IsNull() },
    });
    
    while (existingUser && existingUser.status !== 'blocked' && usernameCounter < 100) {
      username = `${baseUsername}_${usernameCounter}`;
      usernameCounter++;
      existingUser = await this.userRepo.findOne({ 
        where: { username, deleted_at: IsNull() },
      });
    }

    if (usernameCounter >= 100) {
      // Fallback to timestamp-based username
      username = `student_${student.studentIdNumber}_${Date.now()}`;
    }

    // Generate unique email
    const baseEmail = `student_${student.hemisId}@hemis.oauth`;
    let email = baseEmail;
    let emailCounter = 1;
    
    // Check if email already exists (with limit to avoid infinite loop)
    // IMPORTANT: Skip blocked users (merged users) - don't create duplicates for them
    let existingUserByEmail = await this.userRepo.findOne({ 
      where: { email, deleted_at: IsNull() },
    });
    
    while (existingUserByEmail && existingUserByEmail.status !== 'blocked' && emailCounter < 100) {
      email = `student_${student.hemisId}_${emailCounter}@hemis.oauth`;
      emailCounter++;
      existingUserByEmail = await this.userRepo.findOne({ 
        where: { email, deleted_at: IsNull() },
      });
    }

    if (emailCounter >= 100) {
      // Fallback to timestamp-based email
      email = `student_${student.hemisId}_${Date.now()}@hemis.oauth`;
    }

    // Generate random password hash (OAuth users don't use password login)
    const randomPassword =
      Math.random().toString(36).slice(-12) +
      Math.random().toString(36).slice(-12);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    try {
      // Create user
      const user = this.userRepo.create({
        username,
        email,
        full_name: student.fullName || undefined,
        avatar: student.image || student.imageFull || undefined,
        password_hash: passwordHash,
        status: 'active',
        email_verified: false,
        phone_verified: false,
        companyId: 1, // Default company
      });

      const savedUser = await this.userRepo.save(user);
      this.logger.log(`✅ Created new user ${savedUser.id} (${savedUser.username}) for student ${student.id}`);

      // Assign default role if available
      const defaultRole = await this.roleRepo.findOne({ where: { name: 'student' } });
      if (!defaultRole) {
        // Fallback to 'user' role if 'student' role doesn't exist
        const userRole = await this.roleRepo.findOne({ where: { name: 'user' } });
        if (userRole) {
          const userRoleEntity = this.userRoleRepo.create({
            user: savedUser,
            role: userRole,
          });
          await this.userRoleRepo.save(userRoleEntity);
          this.logger.log(`✅ Assigned 'user' role to new student user ${savedUser.id}`);
        }
      } else {
        const userRoleEntity = this.userRoleRepo.create({
          user: savedUser,
          role: defaultRole,
        });
        await this.userRoleRepo.save(userRoleEntity);
        this.logger.log(`✅ Assigned 'student' role to new student user ${savedUser.id}`);
      }

      // Create OAuth account
      const oauthData = {
        id: student.hemisId,
        student_id: student.studentIdNumber,
        full_name: student.fullName,
        first_name: student.firstName,
        second_name: student.secondName,
        third_name: student.thirdName,
        student_id_number: student.studentIdNumber,
        birth_date: student.birthDate,
        image: student.image,
        image_full: student.imageFull,
        hemis_sync_data: {
          student: {
            id: student.id,
            hemisId: student.hemisId,
            fullName: student.fullName,
            firstName: student.firstName,
            secondName: student.secondName,
            thirdName: student.thirdName,
            studentIdNumber: student.studentIdNumber,
            birthDate: student.birthDate,
            email: null,
            phone: null,
            image: student.image,
            imageFull: student.imageFull,
            avgGpa: student.avgGpa,
            avgGrade: student.avgGrade,
            totalCredit: student.totalCredit,
            department: student.department ? {
              id: student.department.id,
              code: student.department.code,
              name: student.department.name,
            } : null,
            specialty: student.specialty ? {
              id: student.specialty.id,
              code: student.specialty.code,
              name: student.specialty.name,
            } : null,
            group: student.group ? {
              id: student.group.id,
              name: student.group.name,
            } : null,
            university: student.university ? {
              id: student.university.id,
              code: student.university.code,
              name: student.university.name,
            } : null,
            semester: student.semester ? {
              id: student.semester.id,
              hemisId: student.semester.hemisId,
              code: student.semester.code,
              name: student.semester.name,
            } : null,
          },
        },
      };

      // For student provider, provider_user_id should be hemisId
      const providerUserId = student.hemisId.toString();

      // Double-check OAuth account doesn't exist (race condition prevention)
      // IMPORTANT: Check both hemisId AND studentIdNumber to prevent duplicates
      const duplicateCheck = await this.oauthAccountRepo.findOne({
        where: {
          provider: { id: provider.id },
          provider_user_id: In([
            student.hemisId.toString(),
            student.studentIdNumber.toString(),
          ]),
        },
        relations: ['user'],
      });

      if (duplicateCheck) {
        // If OAuth account exists but for blocked user, check merge history
        if (duplicateCheck.user.status === 'blocked') {
          const mergeHistory = await this.mergeHistoryRepo.findOne({
            where: { merged_user: { id: duplicateCheck.user.id } },
            relations: ['main_user'],
          });
          
          if (mergeHistory && mergeHistory.main_user) {
            // Transfer to main user and continue
            duplicateCheck.user = mergeHistory.main_user;
            await this.oauthAccountRepo.save(duplicateCheck);
            this.logger.log(`✅ OAuth account ${duplicateCheck.id} transferred to main user ${mergeHistory.main_user.id}`);
          }
        }
        
        this.logger.warn(
          `⚠️  OAuth account already exists for provider_user_id ${duplicateCheck.provider_user_id} (hemisId: ${student.hemisId}, studentIdNumber: ${student.studentIdNumber}), skipping creation`,
        );
        return;
      }

      const oauthAccount = this.oauthAccountRepo.create({
        user: savedUser,
        provider: provider,
        provider_user_id: providerUserId,
        oauth_data: oauthData,
        profileId: student.id,
        last_login: undefined,
      });

      await this.oauthAccountRepo.save(oauthAccount);
      this.logger.log(
        `✅ Created OAuth account ${oauthAccount.id} for user ${savedUser.id} linked to student ${student.id}`,
      );
    } catch (error: any) {
      // Handle unique constraint violations
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505') {
        const errorMsg = error.message || '';
        if (errorMsg.includes('username') || errorMsg.includes('email') || errorMsg.includes('phone')) {
          this.logger.error(
            `⚠️  Unique constraint violation while creating user for student ${student.id}: ${errorMsg}`,
          );
          // Try to find existing user and skip creation
          return;
        }
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Batch update OAuth accounts to improve performance
   * Processes accounts in batches to avoid memory issues
   */
  async batchSyncEmployeeOAuthAccounts(
    employeeIds: number[],
    batchSize: number = 100,
  ): Promise<void> {
    for (let i = 0; i < employeeIds.length; i += batchSize) {
      const batch = employeeIds.slice(i, i + batchSize);
      await this.syncEmployeeOAuthAccounts(batch);
      this.logger.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1} (${batch.length} employees)`);
    }
  }

  async batchSyncStudentOAuthAccounts(
    studentIds: number[],
    batchSize: number = 100,
  ): Promise<void> {
    for (let i = 0; i < studentIds.length; i += batchSize) {
      const batch = studentIds.slice(i, i + batchSize);
      await this.syncStudentOAuthAccounts(batch);
      this.logger.log(`📦 Processed batch ${Math.floor(i / batchSize) + 1} (${batch.length} students)`);
    }
  }
}

