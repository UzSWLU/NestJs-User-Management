import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HemisStudent } from '../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../database/entities/hemis/employee.entity';
import { HemisApiService } from './hemis-api.service';
import { HemisProgressService } from './hemis-progress.service';

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
    
    student.hemis_id = studentData.id;
    student.meta_id = studentData.meta_id;
    student.full_name = studentData.full_name;
    student.short_name = studentData.short_name;
    student.first_name = studentData.first_name;
    student.second_name = studentData.second_name;
    student.third_name = studentData.third_name;
    student.student_id_number = studentData.student_id_number;
    student.birth_date = studentData.birth_date ? new Date(studentData.birth_date * 1000).toISOString().split('T')[0] : '';

    // University
    student.university_code = studentData.university?.code;
    student.university_name = studentData.university?.name;

    // Gender
    student.gender_code = studentData.gender?.code;
    student.gender_name = studentData.gender?.name;

    // Location
    student.country_code = studentData.country?.code;
    student.country_name = studentData.country?.name;
    student.province_code = studentData.province?.code;
    student.province_name = studentData.province?.name;
    student.district_code = studentData.district?.code;
    student.district_name = studentData.district?.name;
    student.terrain_code = studentData.terrain?.code;
    student.terrain_name = studentData.terrain?.name;

    // Status
    student.citizenship_code = studentData.citizenship?.code;
    student.citizenship_name = studentData.citizenship?.name;
    student.student_status_code = studentData.studentStatus?.code;
    student.student_status_name = studentData.studentStatus?.name;

    // Education
    student.curriculum_id = studentData._curriculum;
    student.education_form_code = studentData.educationForm?.code;
    student.education_form_name = studentData.educationForm?.name;
    student.education_type_code = studentData.educationType?.code;
    student.education_type_name = studentData.educationType?.name;
    student.payment_form_code = studentData.paymentForm?.code;
    student.payment_form_name = studentData.paymentForm?.name;
    student.student_type_code = studentData.studentType?.code;
    student.student_type_name = studentData.studentType?.name;

    // Department & Specialty
    student.department_id = studentData.department?.id;
    student.department_name = studentData.department?.name;
    student.department_code = studentData.department?.code;
    student.specialty_id = studentData.specialty?.id;
    student.specialty_code = studentData.specialty?.code;
    student.specialty_name = studentData.specialty?.name;

    // Group
    student.group_id = studentData.group?.id;
    student.group_name = studentData.group?.name;
    student.education_lang_code = studentData.group?.educationLang?.code;
    student.education_lang_name = studentData.group?.educationLang?.name;

    // Academic
    student.avg_gpa = studentData.avg_gpa || 0;
    student.avg_grade = studentData.avg_grade || 0;
    student.total_credit = studentData.total_credit || 0;
    student.level_code = studentData.level?.code;
    student.level_name = studentData.level?.name;
    student.semester_id = studentData.semester?.id;
    student.semester_code = studentData.semester?.code;
    student.semester_name = studentData.semester?.name;
    student.education_year_code = studentData.educationYear?.code;
    student.education_year_name = studentData.educationYear?.name;
    student.education_year_current = studentData.educationYear?.current || false;
    student.year_of_enter = studentData.year_of_enter;

    // Social
    student.social_category_code = studentData.socialCategory?.code;
    student.social_category_name = studentData.socialCategory?.name;
    student.accommodation_code = studentData.accommodation?.code;
    student.accommodation_name = studentData.accommodation?.name;
    student.roommate_count = studentData.roommate_count;
    student.poverty_level = studentData.povertyLevel;

    // Additional
    student.image = studentData.image;
    student.image_full = studentData.image_full;
    student.email = studentData.email;
    student.other = studentData.other;
    student.is_graduate = studentData.is_graduate;
    student.total_acload = studentData.total_acload;
    student.hash = studentData.hash;
    student.validate_url = studentData.validateUrl;

    student.last_synced_at = Math.floor(Date.now() / 1000);

    return await this.studentRepository.save(student);
  }

  /**
   * Sync single employee data
   */
  async syncEmployee(employeeData: any): Promise<HemisEmployee> {
    const employee = new HemisEmployee();

    employee.hemis_id = employeeData.id;
    employee.meta_id = employeeData.meta_id;
    employee.full_name = employeeData.full_name;
    employee.short_name = employeeData.short_name;
    employee.first_name = employeeData.first_name;
    employee.second_name = employeeData.second_name;
    employee.third_name = employeeData.third_name;
    employee.employee_id_number = employeeData.employee_id_number;
    employee.birth_date = employeeData.birth_date ? new Date(employeeData.birth_date * 1000).toISOString().split('T')[0] : '';

    // Gender
    employee.gender_code = employeeData.gender?.code;
    employee.gender_name = employeeData.gender?.name;
    employee.year_of_enter = employeeData.year_of_enter;
    employee.specialty = employeeData.specialty;

    // Academic
    employee.academic_degree_code = employeeData.academicDegree?.code;
    employee.academic_degree_name = employeeData.academicDegree?.name;
    employee.academic_rank_code = employeeData.academicRank?.code;
    employee.academic_rank_name = employeeData.academicRank?.name;

    // Department
    employee.department_id = employeeData.department?.id;
    employee.department_name = employeeData.department?.name;
    employee.department_code = employeeData.department?.code;
    employee.department_structure_type_code = employeeData.department?.structureType?.code;
    employee.department_structure_type_name = employeeData.department?.structureType?.name;
    employee.department_locality_type_code = employeeData.department?.localityType?.code;
    employee.department_locality_type_name = employeeData.department?.localityType?.name;
    employee.department_active = employeeData.department?.active;

    // Employment
    employee.employment_form_code = employeeData.employmentForm?.code;
    employee.employment_form_name = employeeData.employmentForm?.name;
    employee.employment_staff_code = employeeData.employmentStaff?.code;
    employee.employment_staff_name = employeeData.employmentStaff?.name;
    employee.staff_position_code = employeeData.staffPosition?.code;
    employee.staff_position_name = employeeData.staffPosition?.name;
    employee.employee_status_code = employeeData.employeeStatus?.code;
    employee.employee_status_name = employeeData.employeeStatus?.name;
    employee.employee_type_code = employeeData.employeeType?.code;
    employee.employee_type_name = employeeData.employeeType?.name;

    // Contract
    employee.contract_number = employeeData.contract_number;
    employee.decree_number = employeeData.decree_number;
    employee.contract_date = employeeData.contract_date;
    employee.decree_date = employeeData.decree_date;

    // Additional
    employee.image = employeeData.image;
    employee.image_full = employeeData.image_full;
    employee.active = employeeData.active;
    employee.hash = employeeData.hash;
    employee.tutor_groups = employeeData.tutorGroups ? JSON.stringify(employeeData.tutorGroups) : null;

    employee.last_synced_at = Math.floor(Date.now() / 1000);

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
    this.progressService.updateStudentsProgress({
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
                where: { hemis_id: item.id } 
              });

              const student = await this.syncStudent(item);
              syncedIds.add(item.id);
              total++;

              if (existing) {
                this.logger.debug(`✅ Updated student: ${student.full_name} (ID: ${student.hemis_id})`);
              } else {
                this.logger.debug(`🆕 Created student: ${student.full_name} (ID: ${student.hemis_id})`);
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
          this.progressService.updateStudentsProgress({
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
      this.progressService.updateStudentsProgress({
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
      this.progressService.updateStudentsProgress({
        status: 'failed',
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
    this.progressService.updateEmployeesProgress({
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
                where: { hemis_id: item.id } 
              });

              const employee = await this.syncEmployee(item);
              syncedIds.add(item.id);
              total++;

              if (existing) {
                this.logger.debug(`✅ Updated employee: ${employee.full_name} (ID: ${employee.hemis_id})`);
              } else {
                this.logger.debug(`🆕 Created employee: ${employee.full_name} (ID: ${employee.hemis_id})`);
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
          this.progressService.updateEmployeesProgress({
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
      this.progressService.updateEmployeesProgress({
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
      this.progressService.updateEmployeesProgress({
        status: 'failed',
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

