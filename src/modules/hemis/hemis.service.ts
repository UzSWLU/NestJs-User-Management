import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HemisStudent } from '../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../database/entities/hemis/employee.entity';
import { HemisApiService } from './services/hemis-api.service';
import { HemisProgressService } from './services/hemis-progress.service';

@Injectable()
export class HemisService {
  private readonly logger = new Logger(HemisService.name);

  constructor(
    @InjectRepository(HemisStudent)
    private studentRepository: Repository<HemisStudent>,
    @InjectRepository(HemisEmployee)
    private employeeRepository: Repository<HemisEmployee>,
    private hemisApiService: HemisApiService,
    private progressService: HemisProgressService,
  ) {}

  /**
   * Sync single student data
   */
  async syncStudent(studentData: any): Promise<HemisStudent> {
    const student = new HemisStudent();
    
    student.hemisId = studentData.id;
    student.metaId = studentData.meta_id;
    student.fullName = studentData.full_name;
    student.shortName = studentData.short_name;
    student.firstName = studentData.first_name;
    student.secondName = studentData.second_name;
    student.thirdName = studentData.third_name;
    student.studentIdNumber = studentData.student_id_number;
    if (studentData.birth_date) {
      student.birthDate = new Date(studentData.birth_date * 1000);
    }

    // Handle relationships - use entity IDs instead of codes
    if (studentData.university) {
      // University relationship would need to be set via universityId
    }

    if (studentData.gender) {
      // Gender relationship via genderId - would need lookup
    }

    // Location relationships via IDs
    if (studentData.country) {
      // countryId would need lookup
    }
    if (studentData.province) {
      // provinceId would need lookup  
    }
    if (studentData.district) {
      // districtId would need lookup
    }
    if (studentData.terrain) {
      // terrainId would need lookup
    }
    if (studentData.citizenship) {
      // citizenshipId would need lookup
    }
    if (studentData.studentStatus) {
      // studentStatusId would need lookup
    }
    if (studentData.educationForm) {
      // educationFormId would need lookup
    }
    if (studentData.educationType) {
      // educationTypeId would need lookup
    }
    if (studentData.paymentForm) {
      // paymentFormId would need lookup
    }
    if (studentData.studentType) {
      // studentTypeId would need lookup
    }
    if (studentData.department) {
      student.departmentId = studentData.department?.id;
    }
    if (studentData.specialty) {
      student.specialtyId = studentData.specialty?.id;
    }
    if (studentData.group) {
      student.groupId = studentData.group?.id;
    }
    if (studentData.educationYear) {
      // educationYearId would need lookup
    }
    if (studentData.level) {
      // levelId would need lookup
    }
    if (studentData.semester) {
      student.semesterId = studentData.semester?.id;
    }
    if (studentData.socialCategory) {
      // socialCategoryId would need lookup
    }
    if (studentData.accommodation) {
      // accommodationId would need lookup
    }

    // Academic
    student.avgGpa = studentData.avg_gpa || 0;
    student.avgGrade = studentData.avg_grade || 0;
    student.totalCredit = studentData.total_credit || 0;

    // JSON/Text fields
    if (studentData.povertyLevel) {
      student.povertyLevel = JSON.stringify(studentData.povertyLevel);
    }
    student.curriculum = studentData._curriculum;
    student.image = studentData.image;
    student.imageFull = studentData.image_full;
    student.hash = studentData.hash;

    return await this.studentRepository.save(student);
  }

  /**
   * Sync single employee data
   */
  async syncEmployee(employeeData: any): Promise<HemisEmployee> {
    const employee = new HemisEmployee();

    employee.hemisId = employeeData.id;
    employee.metaId = employeeData.meta_id;
    employee.fullName = employeeData.full_name;
    employee.shortName = employeeData.short_name;
    employee.firstName = employeeData.first_name;
    employee.secondName = employeeData.second_name;
    employee.thirdName = employeeData.third_name;
    employee.employeeIdNumber = employeeData.employee_id_number;
    if (employeeData.birth_date) {
      employee.birthDate = new Date(employeeData.birth_date * 1000);
    }

    // Handle relationships
    if (employeeData.gender) {
      // genderId would need lookup
    }
    if (employeeData.department) {
      employee.departmentId = employeeData.department?.id;
    }
    if (employeeData.academicDegree) {
      // academicDegreeId would need lookup
    }
    if (employeeData.academicRank) {
      // academicRankId would need lookup
    }
    if (employeeData.employmentForm) {
      // employmentFormId would need lookup
    }
    if (employeeData.employmentStaff) {
      // employmentStaffId would need lookup
    }
    if (employeeData.staffPosition) {
      // staffPositionId would need lookup
    }
    if (employeeData.employeeStatus) {
      // employeeStatusId would need lookup
    }
    if (employeeData.employeeType) {
      // employeeTypeId would need lookup
    }

    // Text fields
    employee.yearOfEnter = employeeData.year_of_enter;
    employee.specialty = employeeData.specialty;
    employee.contractNumber = employeeData.contract_number;
    employee.decreeNumber = employeeData.decree_number;
    employee.contractDate = employeeData.contract_date;
    employee.decreeDate = employeeData.decree_date;
    employee.image = employeeData.image;
    employee.imageFull = employeeData.image_full;
    employee.active = employeeData.active !== undefined ? employeeData.active : true;
    employee.hash = employeeData.hash;

    return await this.employeeRepository.save(employee);
  }

  /**
   * Sync all students
   */
  async syncAllStudents(): Promise<{ success: boolean; total: number; errors: string[]; deleted?: number }> {
    const errors: string[] = [];
    let total = 0;
    let offset = 0;
    const limit = 50; // Reduced from 100 to avoid overloading HEMIS
    let hasMore = true;
    const maxRetries = 3;
    const syncedIds = new Set<number>();

    this.logger.log('🚀 Starting HEMIS students sync...');
    
    // Initialize progress tracking
    this.progressService.updateStudentProgress({
      status: 'running',
      startTime: Date.now(),
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
    });

    try {
      while (hasMore) {
        let retryCount = 0;
        let response: any = null;

        // Retry logic for API calls
        while (retryCount < maxRetries) {
          try {
            this.logger.log(`📡 Fetching students (offset: ${offset}, limit: ${limit})...`);
            response = await this.hemisApiService.getStudents(limit, offset);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            this.logger.error(`❌ Error fetching students (attempt ${retryCount}/${maxRetries}): ${error.message}`);
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              this.logger.warn(`🔄 Retrying students fetch...`);
            } else {
              errors.push(`Failed to fetch students after ${maxRetries} attempts: ${error.message}`);
              hasMore = false;
              break;
            }
          }
        }

        if (!response || !hasMore) break;

        // Type guard to ensure response is valid
        if (!response || typeof response !== 'object' || !('success' in response)) {
          hasMore = false;
          break;
        }

        if (response.success && 'data' in response && response.data?.items) {
          const itemsToSync = response.data.items;
          
          this.logger.log(`📦 Processing ${itemsToSync.length} students (offset: ${offset})`);
          
          for (const item of itemsToSync) {
            try {
              // Check if student exists
              const existing = await this.studentRepository.findOne({ 
                where: { hemisId: item.id } 
              });

              const student = await this.syncStudent(item);
              syncedIds.add(item.id);
              total++;

              if (existing) {
                this.logger.debug(`✅ Updated student: ${student.fullName} (ID: ${student.hemisId})`);
              } else {
                this.logger.debug(`🆕 Created student: ${student.fullName} (ID: ${student.hemisId})`);
              }
            } catch (error) {
              const errorMsg = `❌ Error syncing student ID ${item.id}: ${error.message}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
            }
          }

          // Log progress every 100 records
          if (total % 100 === 0) {
            this.logger.log(`📊 Progress: ${total} students synced, ${errors.length} errors`);
          }
          
          // Update progress
          this.progressService.updateStudentProgress({
            processedRecords: total,
            errors,
            currentPage: Math.floor(offset / limit) + 1,
            message: `Processing page ${Math.floor(offset / limit) + 1}...`,
          });

          // Check pagination
          const pagination = response.data.pagination;
          hasMore = offset + limit < pagination.totalCount;
          
          if (hasMore) {
            // Pause before next request to avoid overwhelming HEMIS server
            this.logger.log(`⏸️  Waiting 1 second before next batch (page ${Math.floor(offset / limit) + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      this.logger.log(`✅ Students sync completed: ${total} total, ${errors.length} errors`);
      this.logger.log(`🧹 Tracking ${syncedIds.size} unique students from HEMIS...`);
      
      // Update progress as completed
      this.progressService.updateStudentProgress({
        status: 'completed',
        endTime: Date.now(),
        totalRecords: total,
        processedRecords: total,
        errors,
      });
      
      // Keep all records (don't delete obsolete ones)
      // If you want to delete records not in HEMIS, uncomment:
      // const allSyncIds = Array.from(syncedIds);
      // const deleted = await this.studentRepository
      //   .createQueryBuilder()
      //   .delete()
      //   .where('hemis_id NOT IN (:...ids)', { ids: allSyncIds.length > 0 ? allSyncIds : [-1] })
      //   .execute();
      // this.logger.log(`🗑️  Deleted ${deleted.affected || 0} obsolete students`);
      
      return { success: true, total, errors, deleted: 0 };
    } catch (error) {
      // Update progress as failed
      this.progressService.updateStudentProgress({
        status: 'error',
        endTime: Date.now(),
        totalRecords: total,
        processedRecords: total,
        errors,
        message: `Failed: ${error.message}`,
      });
      
      this.logger.error(`💥 Fatal error in syncAllStudents: ${error.message}`);
      this.logger.error(`📊 Final stats: ${total} synced, ${errors.length} errors before fatal crash`);
      throw error;
    }
  }

  /**
   * Sync all employees
   */
  async syncAllEmployees(): Promise<{ success: boolean; total: number; errors: string[]; deleted?: number }> {
    const errors: string[] = [];
    let total = 0;
    let offset = 0;
    const limit = 50; // Reduced from 100 to avoid overloading HEMIS
    let hasMore = true;
    const maxRetries = 3;
    const syncedIds = new Set<number>();

    this.logger.log('🚀 Starting HEMIS employees sync...');
    
    // Initialize progress tracking
    this.progressService.updateEmployeeProgress({
      status: 'running',
      startTime: Date.now(),
      totalRecords: 0,
      processedRecords: 0,
      errors: [],
    });

    try {
      while (hasMore) {
        let retryCount = 0;
        let response: any = null;

        // Retry logic for API calls
        while (retryCount < maxRetries) {
          try {
            this.logger.log(`📡 Fetching employees (offset: ${offset}, limit: ${limit})...`);
            response = await this.hemisApiService.getEmployees('all', undefined, limit, offset);
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            this.logger.error(`❌ Error fetching employees (attempt ${retryCount}/${maxRetries}): ${error.message}`);
            
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              this.logger.warn(`🔄 Retrying employees fetch...`);
            } else {
              errors.push(`Failed to fetch employees after ${maxRetries} attempts: ${error.message}`);
              hasMore = false;
              break;
            }
          }
        }

        if (!response || !hasMore) break;

        // Type guard to ensure response is valid
        if (!response || typeof response !== 'object' || !('success' in response)) {
          hasMore = false;
          break;
        }

        if (response.success && 'data' in response && response.data?.items) {
          const itemsToSync = response.data.items;
          this.logger.log(`📦 Processing ${itemsToSync.length} employees (offset: ${offset})`);
          
          for (const item of itemsToSync) {
            try {
              // Check if employee exists
              const existing = await this.employeeRepository.findOne({ 
                where: { hemisId: item.id } 
              });

              const employee = await this.syncEmployee(item);
              syncedIds.add(item.id);
              total++;

              if (existing) {
                this.logger.debug(`✅ Updated employee: ${employee.fullName} (ID: ${employee.hemisId})`);
              } else {
                this.logger.debug(`🆕 Created employee: ${employee.fullName} (ID: ${employee.hemisId})`);
              }
            } catch (error) {
              const errorMsg = `❌ Error syncing employee ID ${item.id}: ${error.message}`;
              errors.push(errorMsg);
              this.logger.error(errorMsg);
            }
          }

          // Log progress every 100 records
          if (total % 100 === 0) {
            this.logger.log(`📊 Progress: ${total} employees synced, ${errors.length} errors`);
          }
          
          // Update progress
          this.progressService.updateEmployeeProgress({
            processedRecords: total,
            errors,
            currentPage: Math.floor(offset / limit) + 1,
            message: `Processing page ${Math.floor(offset / limit) + 1}...`,
          });

          // Check pagination
          const pagination = response.data.pagination;
          hasMore = offset + limit < pagination.totalCount;
          
          if (hasMore) {
            // Pause before next request to avoid overwhelming HEMIS server
            this.logger.log(`⏸️  Waiting 1 second before next batch (page ${Math.floor(offset / limit) + 1})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
          
          offset += limit;
        } else {
          hasMore = false;
        }
      }

      this.logger.log(`✅ Employees sync completed: ${total} total, ${errors.length} errors`);
      this.logger.log(`🧹 Tracking ${syncedIds.size} unique employees from HEMIS...`);
      
      // Update progress as completed
      this.progressService.updateEmployeeProgress({
        status: 'completed',
        endTime: Date.now(),
        totalRecords: total,
        processedRecords: total,
        errors,
      });
      
      // Keep all records (don't delete obsolete ones)
      // If you want to delete records not in HEMIS, uncomment:
      // const allSyncIds = Array.from(syncedIds);
      // const deleted = await this.employeeRepository
      //   .createQueryBuilder()
      //   .delete()
      //   .where('hemis_id NOT IN (:...ids)', { ids: allSyncIds.length > 0 ? allSyncIds : [-1] })
      //   .execute();
      // this.logger.log(`🗑️  Deleted ${deleted.affected || 0} obsolete employees`);
      
      return { success: true, total, errors, deleted: 0 };
    } catch (error) {
      // Update progress as failed
      this.progressService.updateEmployeeProgress({
        status: 'error',
        endTime: Date.now(),
        totalRecords: total,
        processedRecords: total,
        errors,
        message: `Failed: ${error.message}`,
      });
      
      this.logger.error(`💥 Fatal error in syncAllEmployees: ${error.message}`);
      this.logger.error(`📊 Final stats: ${total} synced, ${errors.length} errors before fatal crash`);
      throw error;
    }
  }

  /**
   * Sync single student by ID or student_id_number
   */
  async syncStudentById(hemisId: number, studentIdNumber?: string): Promise<HemisStudent> {
    try {
      const studentData = await this.hemisApiService.getStudentById(hemisId);
      if (!studentData) {
        throw new Error(`Student not found: ${hemisId}`);
      }

      return await this.syncStudent(studentData);
    } catch (error) {
      this.logger.error(`Error syncing student: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sync single employee by ID or employee_id_number
   */
  async syncEmployeeById(hemisId?: number, employeeIdNumber?: string): Promise<HemisEmployee> {
    try {
      const employeeData = await this.hemisApiService.getEmployeeById(hemisId, employeeIdNumber);
      if (!employeeData) {
        throw new Error(`Employee not found`);
      }

      return await this.syncEmployee(employeeData);
    } catch (error) {
      this.logger.error(`Error syncing employee: ${error.message}`);
      throw error;
    }
  }
}

