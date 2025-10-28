import { Injectable, Logger, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HemisApiService } from './hemis-api.service';
import { HemisProgressService } from './hemis-progress.service';
import { OAuthAccountSyncService } from './oauth-account-sync.service';
import { HemisSyncLog } from '../../../database/entities/hemis/sync-log.entity';

// Main entities
import { HemisStudent } from '../../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../../database/entities/hemis/employee.entity';

// Lookup entities
import { HemisGender } from '../../../database/entities/hemis/gender.entity';
import { HemisUniversity } from '../../../database/entities/hemis/university.entity';
import { HemisDepartment } from '../../../database/entities/hemis/department.entity';
import { HemisSpecialty } from '../../../database/entities/hemis/specialty.entity';
import { HemisGroup } from '../../../database/entities/hemis/group.entity';
import { HemisEducationYear } from '../../../database/entities/hemis/education-year.entity';
import { HemisCountry } from '../../../database/entities/hemis/country.entity';
import { HemisTerritory } from '../../../database/entities/hemis/territory.entity';
import { HemisCitizenship } from '../../../database/entities/hemis/citizenship.entity';
import { HemisSemester } from '../../../database/entities/hemis/semester.entity';
import { HemisLevel } from '../../../database/entities/hemis/level.entity';
import { HemisEducationForm } from '../../../database/entities/hemis/education-form.entity';
import { HemisEducationType } from '../../../database/entities/hemis/education-type.entity';
import { HemisPaymentForm } from '../../../database/entities/hemis/payment-form.entity';
import { HemisStudentType } from '../../../database/entities/hemis/student-type.entity';
import { HemisSocialCategory } from '../../../database/entities/hemis/social-category.entity';
import { HemisAccommodation } from '../../../database/entities/hemis/accommodation.entity';
import { HemisStudentStatus } from '../../../database/entities/hemis/student-status.entity';
import { HemisAcademicDegree } from '../../../database/entities/hemis/academic-degree.entity';
import { HemisAcademicRank } from '../../../database/entities/hemis/academic-rank.entity';
import { HemisEmploymentForm } from '../../../database/entities/hemis/employment-form.entity';
import { HemisEmploymentStaff } from '../../../database/entities/hemis/employment-staff.entity';
import { HemisStaffPosition } from '../../../database/entities/hemis/staff-position.entity';
import { HemisEmployeeStatus } from '../../../database/entities/hemis/employee-status.entity';
import { HemisEmployeeType } from '../../../database/entities/hemis/employee-type.entity';
import { HemisDepartmentStructureType } from '../../../database/entities/hemis/department-structure-type.entity';
import { HemisDepartmentLocalityType } from '../../../database/entities/hemis/department-locality-type.entity';
import { HemisEducationLang } from '../../../database/entities/hemis/education-lang.entity';

@Injectable()
export class HemisSyncService {
  private readonly logger = new Logger(HemisSyncService.name);
  private readonly MAX_RETRIES = 3;
  private readonly BATCH_SIZE = 50;

  constructor(
    private readonly hemisApiService: HemisApiService,
    private readonly progressService: HemisProgressService,
    @InjectRepository(HemisStudent)
    private readonly studentRepository: Repository<HemisStudent>,
    @InjectRepository(HemisEmployee)
    private readonly employeeRepository: Repository<HemisEmployee>,
    @InjectRepository(HemisSyncLog)
    private readonly syncLogRepository: Repository<HemisSyncLog>,
    @InjectRepository(HemisGender)
    private readonly genderRepository: Repository<HemisGender>,
    @InjectRepository(HemisUniversity)
    private readonly universityRepository: Repository<HemisUniversity>,
    @InjectRepository(HemisDepartment)
    private readonly departmentRepository: Repository<HemisDepartment>,
    @InjectRepository(HemisSpecialty)
    private readonly specialtyRepository: Repository<HemisSpecialty>,
    @InjectRepository(HemisGroup)
    private readonly groupRepository: Repository<HemisGroup>,
    @InjectRepository(HemisEducationYear)
    private readonly educationYearRepository: Repository<HemisEducationYear>,
    @InjectRepository(HemisCountry)
    private readonly countryRepository: Repository<HemisCountry>,
    @InjectRepository(HemisTerritory)
    private readonly territoryRepository: Repository<HemisTerritory>,
    @InjectRepository(HemisCitizenship)
    private readonly citizenshipRepository: Repository<HemisCitizenship>,
    @InjectRepository(HemisSemester)
    private readonly semesterRepository: Repository<HemisSemester>,
    @InjectRepository(HemisLevel)
    private readonly levelRepository: Repository<HemisLevel>,
    @InjectRepository(HemisEducationForm)
    private readonly educationFormRepository: Repository<HemisEducationForm>,
    @InjectRepository(HemisEducationType)
    private readonly educationTypeRepository: Repository<HemisEducationType>,
    @InjectRepository(HemisPaymentForm)
    private readonly paymentFormRepository: Repository<HemisPaymentForm>,
    @InjectRepository(HemisStudentType)
    private readonly studentTypeRepository: Repository<HemisStudentType>,
    @InjectRepository(HemisSocialCategory)
    private readonly socialCategoryRepository: Repository<HemisSocialCategory>,
    @InjectRepository(HemisAccommodation)
    private readonly accommodationRepository: Repository<HemisAccommodation>,
    @InjectRepository(HemisStudentStatus)
    private readonly studentStatusRepository: Repository<HemisStudentStatus>,
    @InjectRepository(HemisAcademicDegree)
    private readonly academicDegreeRepository: Repository<HemisAcademicDegree>,
    @InjectRepository(HemisAcademicRank)
    private readonly academicRankRepository: Repository<HemisAcademicRank>,
    @InjectRepository(HemisEmploymentForm)
    private readonly employmentFormRepository: Repository<HemisEmploymentForm>,
    @InjectRepository(HemisEmploymentStaff)
    private readonly employmentStaffRepository: Repository<HemisEmploymentStaff>,
    @InjectRepository(HemisStaffPosition)
    private readonly staffPositionRepository: Repository<HemisStaffPosition>,
    @InjectRepository(HemisEmployeeStatus)
    private readonly employeeStatusRepository: Repository<HemisEmployeeStatus>,
    @InjectRepository(HemisEmployeeType)
    private readonly employeeTypeRepository: Repository<HemisEmployeeType>,
    @InjectRepository(HemisDepartmentStructureType)
    private readonly departmentStructureTypeRepository: Repository<HemisDepartmentStructureType>,
    @InjectRepository(HemisDepartmentLocalityType)
    private readonly departmentLocalityTypeRepository: Repository<HemisDepartmentLocalityType>,
    @InjectRepository(HemisEducationLang)
    private readonly educationLangRepository: Repository<HemisEducationLang>,
    private readonly oauthAccountSyncService: OAuthAccountSyncService,
  ) {}

  /**
   * Sync all students from HEMIS
   */
  async syncStudents(): Promise<void> {
    const startTime = Date.now();
    this.progressService.resetStudentProgress();
    this.progressService.updateStudentProgress({
      status: 'running',
      startTime,
      message: 'Student sync started',
    });

    try {
      // Fetch first page to get total count
      const firstPageResponse = await this.hemisApiService.fetchStudents(1, 200);
      
      if (!firstPageResponse.success || !firstPageResponse.data) {
        throw new Error('Failed to fetch students from HEMIS API');
      }

      const totalRecords = firstPageResponse.data.pagination.totalCount;
      const totalPages = firstPageResponse.data.pagination.pageCount;
      const limit = 200;

      this.progressService.updateStudentProgress({
        totalRecords,
        totalPages,
      });

      // Track synced student IDs (hemisId)
      const syncedStudentIds = new Set<number>();
      // Track synced student DB IDs (for OAuth account sync)
      const syncedStudentDbIds = new Set<number>();

      // Process first page
      await this.processStudentsBatch(firstPageResponse.data.items, 1, syncedStudentIds, syncedStudentDbIds);

      // Process remaining pages with retry logic
      for (let page = 2; page <= totalPages; page++) {
        if (this.progressService.isStudentSyncCancelled()) {
          this.logger.log('Student sync cancelled by user');
          this.progressService.updateStudentProgress({
            status: 'cancelled',
            message: 'Sync cancelled by user',
          });
          return;
        }

        let retries = 0;
        let success = false;

        while (retries <= this.MAX_RETRIES && !success) {
          try {
            const response = await this.hemisApiService.fetchStudents(page, limit);
            if (response.success && response.data) {
              await this.processStudentsBatch(response.data.items, page, syncedStudentIds, syncedStudentDbIds);
              this.progressService.updateStudentProgress({
                currentPage: page,
                processedRecords: syncedStudentIds.size,
              });
              success = true;
            }
          } catch (error) {
            retries++;
            this.logger.error(`Error processing students page ${page} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
            
            // Log the error
            await this.logSyncError('student', null, error.message, page);
            
            if (retries <= this.MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            } else {
              this.progressService.updateStudentProgress({
                errors: [...this.progressService.getStudentProgress().errors, `Page ${page}: ${error.message}`],
              });
            }
          }
        }
      }

      // Delete stale students
      await this.deleteStaleStudents(syncedStudentIds);

      // Sync OAuth accounts for synced students
      if (syncedStudentDbIds.size > 0) {
        this.logger.log(`🔄 Syncing OAuth accounts for ${syncedStudentDbIds.size} students...`);
        try {
          await this.oauthAccountSyncService.batchSyncStudentOAuthAccounts(
            Array.from(syncedStudentDbIds),
            100,
          );
        } catch (error: any) {
          this.logger.error(`⚠️  OAuth account sync failed (non-critical): ${error.message}`);
          this.logger.error(`⚠️  Error stack: ${error.stack}`);
          // Don't fail the main sync
        }
      } else {
        this.logger.warn('⚠️  No student DB IDs to sync OAuth accounts');
      }

      const endTime = Date.now();
      this.progressService.updateStudentProgress({
        status: 'completed',
        endTime,
        processedRecords: syncedStudentIds.size,
        message: `Student sync completed successfully. Processed ${syncedStudentIds.size} records.`,
      });

      this.logger.log(`Student sync completed in ${(endTime - startTime) / 1000}s`);
    } catch (error) {
      this.logger.error(`Student sync failed: ${error.message}`);
      this.progressService.updateStudentProgress({
        status: 'error',
        endTime: Date.now(),
        message: `Error: ${error.message}`,
        errors: [...this.progressService.getStudentProgress().errors, error.message],
      });
      throw error;
    }
  }

  /**
   * Process a batch of students with error handling
   */
  private async processStudentsBatch(
    items: any[],
    page: number,
    syncedStudentIds: Set<number>,
    syncedStudentDbIds: Set<number>,
  ): Promise<void> {
    for (const item of items) {
      let retries = 0;
      let success = false;

      while (retries <= this.MAX_RETRIES && !success) {
        try {
          const studentDbId = await this.syncStudent(item);
          syncedStudentIds.add(item.id);
          if (studentDbId) {
            syncedStudentDbIds.add(studentDbId);
          }
          success = true;
        } catch (error) {
          retries++;
          this.logger.error(`Error syncing student ${item.id} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
          
          if (retries <= this.MAX_RETRIES) {
            await this.logSyncRetry('student', item.id, error.message, retries, page, item);
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
          } else {
            await this.logSyncError('student', item.id, error.message, page, item);
            this.progressService.updateStudentProgress({
              errors: [...this.progressService.getStudentProgress().errors, `Student ${item.id}: ${error.message}`],
            });
            success = true; // Skip this record and continue
          }
        }
      }
    }
  }

  /**
   * Sync a single student with all relationships
   * @returns Database ID of the student (created or updated)
   */
  private async syncStudent(item: any): Promise<number | null> {
    const student = await this.studentRepository.findOne({
      where: { hemisId: item.id },
    });

    const studentData: Partial<HemisStudent> = {
      hemisId: item.id,
      metaId: item.meta_id || undefined,
      fullName: item.full_name || '',
      shortName: item.short_name || undefined,
      firstName: item.first_name || '',
      secondName: item.second_name || '',
      thirdName: item.third_name || undefined,
      image: item.image || undefined,
      imageFull: item.image_full || undefined,
      studentIdNumber: item.student_id_number || '',
      birthDate: item.birth_date ? new Date(item.birth_date * 1000) : undefined,
      avgGpa: item.avg_gpa || undefined,
      avgGrade: item.avg_grade || undefined,
      totalCredit: item.total_credit || undefined,
      povertyLevel: item.povertyLevel ? JSON.stringify(item.povertyLevel) : undefined,
      curriculum: item._curriculum || undefined,
      hash: item.hash || undefined,
      createdAt: item.created_at ? new Date(item.created_at * 1000) : undefined,
      updatedAt: item.updated_at ? new Date(item.updated_at * 1000) : undefined,
    };

    // Handle all relationships
    if (item.university) {
      studentData.universityId = await this.getOrCreateUniversity(item.university);
    }
    if (item.gender) {
      studentData.genderId = await this.getOrCreateGender(item.gender);
    }
    if (item.department) {
      studentData.departmentId = await this.getOrCreateDepartment(item.department);
    }
    if (item.specialty) {
      studentData.specialtyId = await this.getOrCreateSpecialty(item.specialty);
    }
    if (item.group) {
      studentData.groupId = await this.getOrCreateGroup(item.group);
    }
    if (item.educationYear) {
      studentData.educationYearId = await this.getOrCreateEducationYear(item.educationYear);
    }
    if (item.country) {
      studentData.countryId = await this.getOrCreateCountry(item.country);
    }
    if (item.province) {
      studentData.provinceId = await this.getOrCreateTerritory(item.province);
    }
    if (item.district) {
      studentData.districtId = await this.getOrCreateTerritory(item.district);
    }
    if (item.terrain) {
      studentData.terrainId = await this.getOrCreateTerritory(item.terrain);
    }
    if (item.citizenship) {
      studentData.citizenshipId = await this.getOrCreateCitizenship(item.citizenship);
    }
    if (item.semester) {
      studentData.semesterId = await this.getOrCreateSemester(item.semester);
    }
    if (item.level) {
      studentData.levelId = await this.getOrCreateLevel(item.level);
    }
    if (item.educationForm) {
      studentData.educationFormId = await this.getOrCreateEducationForm(item.educationForm);
    }
    if (item.educationType) {
      studentData.educationTypeId = await this.getOrCreateEducationType(item.educationType);
    }
    if (item.paymentForm) {
      studentData.paymentFormId = await this.getOrCreatePaymentForm(item.paymentForm);
    }
    if (item.studentType) {
      studentData.studentTypeId = await this.getOrCreateStudentType(item.studentType);
    }
    if (item.socialCategory) {
      studentData.socialCategoryId = await this.getOrCreateSocialCategory(item.socialCategory);
    }
    if (item.accommodation) {
      studentData.accommodationId = await this.getOrCreateAccommodation(item.accommodation);
    }
    if (item.studentStatus) {
      studentData.studentStatusId = await this.getOrCreateStudentStatus(item.studentStatus);
    }

    if (student) {
      await this.studentRepository.update(student.id, studentData);
      return student.id;
    } else {
      const savedStudent = await this.studentRepository.save(studentData);
      return savedStudent.id;
    }
  }

  /**
   * Sync all employees from HEMIS
   */
  async syncEmployees(): Promise<void> {
    const startTime = Date.now();
    this.progressService.resetEmployeeProgress();
    this.progressService.updateEmployeeProgress({
      status: 'running',
      startTime,
      message: 'Employee sync started',
    });

    try {
      const firstPageResponse = await this.hemisApiService.fetchEmployees('all', 1, 200);
      
      if (!firstPageResponse.success || !firstPageResponse.data) {
        throw new Error('Failed to fetch employees from HEMIS API');
      }

      const totalRecords = firstPageResponse.data.pagination.totalCount;
      const totalPages = firstPageResponse.data.pagination.pageCount;
      const limit = 200;

      this.progressService.updateEmployeeProgress({
        totalRecords,
        totalPages,
      });

      const syncedEmployeeIds = new Set<number>();
      // Track synced employee DB IDs (for OAuth account sync)
      const syncedEmployeeDbIds = new Set<number>();

      await this.processEmployeesBatch(firstPageResponse.data.items, 1, syncedEmployeeIds, syncedEmployeeDbIds);

      for (let page = 2; page <= totalPages; page++) {
        if (this.progressService.isEmployeeSyncCancelled()) {
          this.logger.log('Employee sync cancelled by user');
          this.progressService.updateEmployeeProgress({
            status: 'cancelled',
            message: 'Sync cancelled by user',
          });
          return;
        }

        let retries = 0;
        let success = false;

        while (retries <= this.MAX_RETRIES && !success) {
          try {
            const response = await this.hemisApiService.fetchEmployees('all', page, limit);
            if (response.success && response.data) {
              await this.processEmployeesBatch(response.data.items, page, syncedEmployeeIds, syncedEmployeeDbIds);
              this.progressService.updateEmployeeProgress({
                currentPage: page,
                processedRecords: syncedEmployeeIds.size,
              });
              success = true;
            }
          } catch (error) {
            retries++;
            this.logger.error(`Error processing employees page ${page} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
            
            await this.logSyncError('employee', null, error.message, page);
            
            if (retries <= this.MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            } else {
              this.progressService.updateEmployeeProgress({
                errors: [...this.progressService.getEmployeeProgress().errors, `Page ${page}: ${error.message}`],
              });
            }
          }
        }
      }

      await this.deleteStaleEmployees(syncedEmployeeIds);

      this.logger.log(`📊 Employee sync summary: ${syncedEmployeeIds.size} HEMIS IDs synced, ${syncedEmployeeDbIds.size} DB IDs collected`);

      // Sync OAuth accounts for synced employees
      if (syncedEmployeeDbIds.size > 0) {
        this.logger.log(`🔄 Syncing OAuth accounts for ${syncedEmployeeDbIds.size} employees...`);
        try {
          await this.oauthAccountSyncService.batchSyncEmployeeOAuthAccounts(
            Array.from(syncedEmployeeDbIds),
            100,
          );
        } catch (error: any) {
          this.logger.error(`⚠️  OAuth account sync failed (non-critical): ${error.message}`);
          this.logger.error(`⚠️  Error stack: ${error.stack}`);
          // Don't fail the main sync
        }
      } else {
        this.logger.warn('⚠️  No employee DB IDs to sync OAuth accounts');
      }

      const endTime = Date.now();
      this.progressService.updateEmployeeProgress({
        status: 'completed',
        endTime,
        processedRecords: syncedEmployeeIds.size,
        message: `Employee sync completed successfully. Processed ${syncedEmployeeIds.size} records.`,
      });

      this.logger.log(`Employee sync completed in ${(endTime - startTime) / 1000}s`);
    } catch (error) {
      this.logger.error(`Employee sync failed: ${error.message}`);
      this.progressService.updateEmployeeProgress({
        status: 'error',
        endTime: Date.now(),
        message: `Error: ${error.message}`,
        errors: [...this.progressService.getEmployeeProgress().errors, error.message],
      });
      throw error;
    }
  }

  /**
   * Process a batch of employees with error handling
   */
  private async processEmployeesBatch(
    items: any[],
    page: number,
    syncedEmployeeIds: Set<number>,
    syncedEmployeeDbIds: Set<number>,
  ): Promise<void> {
    for (const item of items) {
      let retries = 0;
      let success = false;

      while (retries <= this.MAX_RETRIES && !success) {
        try {
          const employeeDbId = await this.syncEmployee(item);
          syncedEmployeeIds.add(item.id);
          if (employeeDbId) {
            syncedEmployeeDbIds.add(employeeDbId);
          } else {
            this.logger.warn(`⚠️  Employee ${item.id} (hemisId: ${item.id}) returned null DB ID`);
          }
          success = true;
        } catch (error) {
          retries++;
          this.logger.error(`Error syncing employee ${item.id} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
          
          if (retries <= this.MAX_RETRIES) {
            await this.logSyncRetry('employee', item.id, error.message, retries, page, item);
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
          } else {
            await this.logSyncError('employee', item.id, error.message, page, item);
            this.progressService.updateEmployeeProgress({
              errors: [...this.progressService.getEmployeeProgress().errors, `Employee ${item.id}: ${error.message}`],
            });
            success = true;
          }
        }
      }
    }
  }

  /**
   * Sync a single employee with all relationships
   * @returns Database ID of the employee (created or updated)
   */
  private async syncEmployee(item: any): Promise<number | null> {
    const employee = await this.employeeRepository.findOne({
      where: { hemisId: item.id },
    });

    const employeeData: Partial<HemisEmployee> = {
      hemisId: item.id,
      metaId: item.meta_id || undefined,
      fullName: item.full_name || '',
      shortName: item.short_name || undefined,
      firstName: item.first_name || '',
      secondName: item.second_name || '',
      thirdName: item.third_name || undefined,
      image: item.image || undefined,
      imageFull: item.image_full || undefined,
      yearOfEnter: item.year_of_enter ? String(item.year_of_enter) : undefined,
      employeeIdNumber: item.employee_id_number || 0,
      birthDate: item.birth_date ? new Date(item.birth_date * 1000) : undefined,
      specialty: item.specialty || undefined,
      contractNumber: item.contract_number || undefined,
      decreeNumber: item.decree_number || undefined,
      contractDate: item.contract_date || undefined,
      decreeDate: item.decree_date || undefined,
      hash: item.hash || undefined,
      active: item.active !== undefined ? item.active : true,
      createdAt: item.created_at ? new Date(item.created_at * 1000) : undefined,
      updateAt: item.update_at ? new Date(item.update_at * 1000) : undefined,
    };

    // Handle all relationships
    if (item.gender) {
      employeeData.genderId = await this.getOrCreateGender(item.gender);
    }
    if (item.department) {
      employeeData.departmentId = await this.getOrCreateDepartment(item.department);
    }
    if (item.academicDegree) {
      employeeData.academicDegreeId = await this.getOrCreateAcademicDegree(item.academicDegree);
    }
    if (item.academicRank) {
      employeeData.academicRankId = await this.getOrCreateAcademicRank(item.academicRank);
    }
    if (item.employmentForm) {
      employeeData.employmentFormId = await this.getOrCreateEmploymentForm(item.employmentForm);
    }
    if (item.employmentStaff) {
      employeeData.employmentStaffId = await this.getOrCreateEmploymentStaff(item.employmentStaff);
    }
    if (item.staffPosition) {
      employeeData.staffPositionId = await this.getOrCreateStaffPosition(item.staffPosition);
    }
    if (item.employeeStatus) {
      employeeData.employeeStatusId = await this.getOrCreateEmployeeStatus(item.employeeStatus);
    }
    if (item.employeeType) {
      employeeData.employeeTypeId = await this.getOrCreateEmployeeType(item.employeeType);
    }

    if (employee) {
      await this.employeeRepository.update(employee.id, employeeData);
      return employee.id;
    } else {
      const savedEmployee = await this.employeeRepository.save(employeeData);
      return savedEmployee.id;
    }
  }

  /**
   * Sync all semesters from HEMIS
   */
  async syncSemesters(): Promise<void> {
    const startTime = Date.now();
    
    this.logger.log('🚀 Starting HEMIS semesters sync...');

    try {
      // Fetch first page to get total count
      const firstPageResponse = await this.hemisApiService.fetchSemesters(1, 200);
      
      if (!firstPageResponse.success || !firstPageResponse.data) {
        throw new Error('Failed to fetch semesters from HEMIS API');
      }

      const totalRecords = firstPageResponse.data.pagination.totalCount;
      const totalPages = firstPageResponse.data.pagination.pageCount;
      const limit = 200;

      this.logger.log(`📊 Total semesters to sync: ${totalRecords} (${totalPages} pages)`);

      // Track synced semester IDs
      const syncedSemesterIds = new Set<number>();

      // Process first page
      await this.processSemestersBatch(firstPageResponse.data.items, 1, syncedSemesterIds);

      // Process remaining pages with retry logic
      for (let page = 2; page <= totalPages; page++) {
        let retries = 0;
        let success = false;

        while (retries <= this.MAX_RETRIES && !success) {
          try {
            const response = await this.hemisApiService.fetchSemesters(page, limit);
            if (response.success && response.data) {
              await this.processSemestersBatch(response.data.items, page, syncedSemesterIds);
              this.logger.log(`✅ Processed page ${page}/${totalPages} - ${syncedSemesterIds.size} semesters synced`);
              success = true;
            }
          } catch (error) {
            retries++;
            this.logger.error(`Error processing semesters page ${page} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
            
            // Log the error
            await this.logSyncError('semester', null, error.message, page);
            
            if (retries <= this.MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
            }
          }
        }
      }

      // Delete stale semesters
      await this.deleteStaleSemesters(syncedSemesterIds);

      const endTime = Date.now();
      this.logger.log(`✅ Semesters sync completed in ${(endTime - startTime) / 1000}s. Processed ${syncedSemesterIds.size} records.`);
    } catch (error) {
      this.logger.error(`💥 Semesters sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a batch of semesters with error handling
   */
  private async processSemestersBatch(items: any[], page: number, syncedSemesterIds: Set<number>): Promise<void> {
    for (const item of items) {
      let retries = 0;
      let success = false;

      while (retries <= this.MAX_RETRIES && !success) {
        try {
          await this.syncSemester(item);
          syncedSemesterIds.add(item.id);
          success = true;
        } catch (error) {
          retries++;
          this.logger.error(`Error syncing semester ${item.id} (attempt ${retries}/${this.MAX_RETRIES}): ${error.message}`);
          
          if (retries <= this.MAX_RETRIES) {
            await this.logSyncRetry('semester', item.id, error.message, retries, page, item);
            await new Promise(resolve => setTimeout(resolve, 500 * retries));
          } else {
            await this.logSyncError('semester', item.id, error.message, page, item);
            success = true; // Skip this record and continue
          }
        }
      }
    }
  }

  /**
   * Sync a single semester
   */
  private async syncSemester(item: any): Promise<void> {
    if (!item || !item.id) {
      throw new Error('Invalid semester data: missing id');
    }

    // Find by hemisId only (unique identifier)
    let semester = await this.semesterRepository.findOne({
      where: { hemisId: item.id } as any,
    });

    // Get or create education year if provided
    let educationYearId: number | undefined;
    if (item.education_year) {
      educationYearId = await this.getOrCreateEducationYear(item.education_year);
    } else if (item._education_year) {
      // Fallback: try to find by code
      const eduYear = await this.educationYearRepository.findOne({
        where: { code: item._education_year } as any,
      });
      educationYearId = eduYear?.id;
    }

    // Get or create level if provided
    let levelId: number | undefined;
    if (item.level) {
      levelId = await this.getOrCreateLevel(item.level);
    }

    // Prepare semester data - save all fields as they come from HEMIS (including nulls)
    const semesterData: Partial<HemisSemester> = {
      hemisId: item.id,
      code: item.code ?? null,
      name: item.name ?? null,
      curriculum: item._curriculum ?? null,
      educationYearId: educationYearId ?? null,
      educationYearCode: item._education_year ?? null,
      levelId: levelId ?? null,
      startDate: item.start_date ?? null,
      endDate: item.end_date ?? null,
      position: item.position ?? null,
      active: item.active ?? null,
      current: item.current ?? null,
    };

    if (semester) {
      // Update existing semester
      await this.semesterRepository.update(semester.id, semesterData);
    } else {
      // Create new semester (code can be duplicate - no conflict check needed)
      await this.semesterRepository.save(semesterData);
    }
  }

  /**
   * Delete stale records
   */
  private async deleteStaleStudents(syncedStudentIds: Set<number>): Promise<void> {
    if (syncedStudentIds.size === 0) {
      this.logger.warn('No synced student IDs, skipping stale students deletion');
      return;
    }
    
    const result = await this.studentRepository
      .createQueryBuilder()
      .delete()
      .where('hemis_id NOT IN (:...ids)', { ids: Array.from(syncedStudentIds) })
      .execute();

    this.logger.log(`Deleted ${result.affected || 0} stale students`);
  }

  private async deleteStaleEmployees(syncedEmployeeIds: Set<number>): Promise<void> {
    if (syncedEmployeeIds.size === 0) {
      this.logger.warn('No synced employee IDs, skipping stale employees deletion');
      return;
    }
    
    const result = await this.employeeRepository
      .createQueryBuilder()
      .delete()
      .where('hemis_id NOT IN (:...ids)', { ids: Array.from(syncedEmployeeIds) })
      .execute();

    this.logger.log(`Deleted ${result.affected || 0} stale employees`);
  }

  private async deleteStaleSemesters(syncedSemesterIds: Set<number>): Promise<void> {
    if (syncedSemesterIds.size === 0) {
      // Don't delete anything if we didn't sync any semesters
      return;
    }
    
    const result = await this.semesterRepository
      .createQueryBuilder('semester')
      .delete()
      .where('semester.hemisId IS NOT NULL AND semester.hemisId NOT IN (:...ids)', { 
        ids: Array.from(syncedSemesterIds) 
      })
      .execute();

    this.logger.log(`Deleted ${result.affected || 0} stale semesters`);
  }

  /**
   * Logging methods
   */
  private async logSyncError(type: string, hemisId: number | null, error: string, pageNumber: number, dataSnapshot?: any): Promise<void> {
    try {
      await this.syncLogRepository.save({
        type,
        hemisId: hemisId ?? undefined,
        status: 'error',
        error,
        message: 'Sync failed',
        dataSnapshot,
        pageNumber,
      });
    } catch (error) {
      this.logger.error(`Failed to log sync error: ${error.message}`);
    }
  }

  private async logSyncRetry(type: string, hemisId: number, error: string, retryCount: number, pageNumber: number, dataSnapshot?: any): Promise<void> {
    try {
      await this.syncLogRepository.save({
        type,
        hemisId,
        status: 'retry',
        error,
        message: `Retry attempt ${retryCount}`,
        retryCount,
        dataSnapshot,
        pageNumber,
      });
    } catch (error) {
      this.logger.error(`Failed to log sync retry: ${error.message}`);
    }
  }

  /**
   * Helper methods for lookup entities - all return undefined instead of null
   * Generic helper for simple entities with code/name pattern
   */
  private async getOrCreateCodeNameEntity<T extends { code: string; name: string; id: number }>(
    repository: Repository<T>,
    data: any,
  ): Promise<number | undefined> {
    if (!data || !data.code) return undefined;
    const entity = await repository.findOne({ where: { code: data.code } as any });
    if (!entity) {
      const newEntity = await repository.save({ code: data.code, name: data.name || '' } as any);
      return newEntity.id;
    }
    return entity.id;
  }

  private async getOrCreateGender(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.genderRepository, data);
  }

  private async getOrCreateUniversity(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.universityRepository, data);
  }

  private async getOrCreateDepartment(data: any): Promise<number | undefined> {
    if (!data || !data.id) return undefined;
    let department = await this.departmentRepository.findOne({ where: { code: data.code } });
    
    const deptData: Partial<HemisDepartment> = {
      code: data.code || '',
      name: data.name || '',
      parent: data.parent || undefined,
      active: data.active !== undefined ? data.active : true,
    };

    if (data.structureType) {
      deptData.structureTypeId = await this.getOrCreateDepartmentStructureType(data.structureType);
    }
    if (data.localityType) {
      deptData.localityTypeId = await this.getOrCreateDepartmentLocalityType(data.localityType);
    }

    if (!department) {
      department = await this.departmentRepository.save(deptData);
    } else {
      await this.departmentRepository.update(department.id, deptData);
    }
    return department.id;
  }

  private async getOrCreateDepartmentStructureType(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.departmentStructureTypeRepository, data);
  }

  private async getOrCreateDepartmentLocalityType(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.departmentLocalityTypeRepository, data);
  }

  private async getOrCreateSpecialty(data: any): Promise<number | undefined> {
    if (!data || !data.id) return undefined;
    let specialty = await this.specialtyRepository.findOne({ where: { id: data.id } });
    if (!specialty) {
      specialty = await this.specialtyRepository.save({
        id: data.id,
        code: data.code || '',
        name: data.name || '',
      });
    }
    return specialty.id;
  }

  private async getOrCreateGroup(data: any): Promise<number | undefined> {
    if (!data || !data.id) return undefined;
    let group = await this.groupRepository.findOne({ where: { id: data.id } });
    
    const groupData: Partial<HemisGroup> = {
      id: data.id,
      name: data.name || '',
    };

    if (data.educationLang) {
      groupData.educationLangId = await this.getOrCreateEducationLang(data.educationLang);
    }

    if (!group) {
      group = await this.groupRepository.save(groupData);
    } else {
      await this.groupRepository.update(group.id, groupData);
    }
    return group.id;
  }

  private async getOrCreateEducationLang(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.educationLangRepository, data);
  }

  private async getOrCreateEducationYear(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.educationYearRepository, data);
  }

  private async getOrCreateCountry(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.countryRepository, data);
  }

  private async getOrCreateTerritory(data: any): Promise<number | undefined> {
    if (!data || !data.code) return undefined;
    let territory = await this.territoryRepository.findOne({ where: { code: data.code } });
    if (!territory) {
      const territoryData: any = { code: data.code, name: data.name || '' };
      if (data._parent) territoryData.parent = data._parent;
      territory = await this.territoryRepository.save(territoryData);
    }
    return territory ? territory.id : undefined;
  }

  private async getOrCreateCitizenship(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.citizenshipRepository, data);
  }

  private async getOrCreateSemester(data: any): Promise<number | undefined> {
    if (!data) return undefined;
    
    // Use hemisId as unique identifier (code can be duplicate for different curricula)
    if (data.id !== undefined && data.id !== null) {
      // Find by hemisId only (unique identifier)
      let semester = await this.semesterRepository.findOne({ 
        where: { hemisId: data.id } as any 
      });
      
      if (semester) {
        // Return existing semester ID
        return semester.id;
      }
      
      // Get or create education year if provided
      let educationYearId: number | undefined;
      if (data.education_year) {
        educationYearId = await this.getOrCreateEducationYear(data.education_year);
      } else if (data._education_year) {
        const eduYear = await this.educationYearRepository.findOne({
          where: { code: data._education_year } as any,
        });
        educationYearId = eduYear?.id;
      }

      // Get or create level if provided
      let levelId: number | undefined;
      if (data.level) {
        levelId = await this.getOrCreateLevel(data.level);
      }

      // Create new semester - save exactly as it comes from HEMIS (including nulls)
      const semesterData: Partial<HemisSemester> = {
        hemisId: data.id,
        code: data.code ?? null,
        name: data.name ?? null,
        curriculum: data._curriculum ?? null,
        educationYearId: educationYearId ?? undefined,
        educationYearCode: data._education_year ?? null,
        levelId: levelId ?? undefined,
        startDate: data.start_date ?? null,
        endDate: data.end_date ?? null,
        position: data.position ?? null,
        active: data.active ?? null,
        current: data.current ?? null,
      };

      const newSemester = await this.semesterRepository.save(semesterData);
      return newSemester.id;
    } else {
      // No hemisId - legacy fallback: try to find by code (but code can be duplicate now)
      // This is less reliable, but kept for backward compatibility
      if (data.code) {
        const semester = await this.semesterRepository.findOne({ 
          where: { code: data.code } as any,
          order: { id: 'DESC' } // Get the most recent one if multiple exist
        });
        
        if (semester) {
          return semester.id;
        }
      }
      
      // Create new semester without hemisId (legacy case)
      const semesterData: Partial<HemisSemester> = {
        code: data.code ?? null,
        name: data.name ?? null,
        curriculum: data._curriculum ?? null,
        educationYearCode: data._education_year ?? null,
        startDate: data.start_date ?? null,
        endDate: data.end_date ?? null,
        position: data.position ?? null,
        active: data.active ?? null,
        current: data.current ?? null,
      };

      const newSemester = await this.semesterRepository.save(semesterData);
      return newSemester.id;
    }
  }

  private async getOrCreateLevel(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.levelRepository, data);
  }

  private async getOrCreateEducationForm(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.educationFormRepository, data);
  }

  private async getOrCreateEducationType(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.educationTypeRepository, data);
  }

  private async getOrCreatePaymentForm(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.paymentFormRepository, data);
  }

  private async getOrCreateStudentType(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.studentTypeRepository, data);
  }

  private async getOrCreateSocialCategory(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.socialCategoryRepository, data);
  }

  private async getOrCreateAccommodation(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.accommodationRepository, data);
  }

  private async getOrCreateStudentStatus(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.studentStatusRepository, data);
  }

  private async getOrCreateAcademicDegree(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.academicDegreeRepository, data);
  }

  private async getOrCreateAcademicRank(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.academicRankRepository, data);
  }

  private async getOrCreateEmploymentForm(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.employmentFormRepository, data);
  }

  private async getOrCreateEmploymentStaff(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.employmentStaffRepository, data);
  }

  private async getOrCreateStaffPosition(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.staffPositionRepository, data);
  }

  private async getOrCreateEmployeeStatus(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.employeeStatusRepository, data);
  }

  private async getOrCreateEmployeeType(data: any): Promise<number | undefined> {
    return this.getOrCreateCodeNameEntity(this.employeeTypeRepository, data);
  }
}
