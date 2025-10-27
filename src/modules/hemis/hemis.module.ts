import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HemisController } from './controllers/hemis.controller';
import { HemisSyncService } from './services/hemis-sync.service';
import { HemisApiService } from './services/hemis-api.service';
import { HemisProgressService } from './services/hemis-progress.service';
import { HemisScheduledSyncService } from './services/hemis-scheduled-sync.service';

// Entities
import { HemisSyncLog } from '../../database/entities/hemis/sync-log.entity';
import { HemisStudent } from '../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../database/entities/hemis/employee.entity';
import { HemisGender } from '../../database/entities/hemis/gender.entity';
import { HemisUniversity } from '../../database/entities/hemis/university.entity';
import { HemisDepartment } from '../../database/entities/hemis/department.entity';
import { HemisSpecialty } from '../../database/entities/hemis/specialty.entity';
import { HemisGroup } from '../../database/entities/hemis/group.entity';
import { HemisEducationYear } from '../../database/entities/hemis/education-year.entity';
import { HemisCountry } from '../../database/entities/hemis/country.entity';
import { HemisTerritory } from '../../database/entities/hemis/territory.entity';
import { HemisCitizenship } from '../../database/entities/hemis/citizenship.entity';
import { HemisSemester } from '../../database/entities/hemis/semester.entity';
import { HemisLevel } from '../../database/entities/hemis/level.entity';
import { HemisEducationForm } from '../../database/entities/hemis/education-form.entity';
import { HemisEducationType } from '../../database/entities/hemis/education-type.entity';
import { HemisPaymentForm } from '../../database/entities/hemis/payment-form.entity';
import { HemisStudentType } from '../../database/entities/hemis/student-type.entity';
import { HemisSocialCategory } from '../../database/entities/hemis/social-category.entity';
import { HemisAccommodation } from '../../database/entities/hemis/accommodation.entity';
import { HemisStudentStatus } from '../../database/entities/hemis/student-status.entity';
import { HemisAcademicDegree } from '../../database/entities/hemis/academic-degree.entity';
import { HemisAcademicRank } from '../../database/entities/hemis/academic-rank.entity';
import { HemisEmploymentForm } from '../../database/entities/hemis/employment-form.entity';
import { HemisEmploymentStaff } from '../../database/entities/hemis/employment-staff.entity';
import { HemisStaffPosition } from '../../database/entities/hemis/staff-position.entity';
import { HemisEmployeeStatus } from '../../database/entities/hemis/employee-status.entity';
import { HemisEmployeeType } from '../../database/entities/hemis/employee-type.entity';
import { HemisDepartmentStructureType } from '../../database/entities/hemis/department-structure-type.entity';
import { HemisDepartmentLocalityType } from '../../database/entities/hemis/department-locality-type.entity';
import { HemisEducationLang } from '../../database/entities/hemis/education-lang.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      HemisSyncLog,
      HemisStudent,
      HemisEmployee,
      HemisGender,
      HemisUniversity,
      HemisDepartment,
      HemisSpecialty,
      HemisGroup,
      HemisEducationYear,
      HemisCountry,
      HemisTerritory,
      HemisCitizenship,
      HemisSemester,
      HemisLevel,
      HemisEducationForm,
      HemisEducationType,
      HemisPaymentForm,
      HemisStudentType,
      HemisSocialCategory,
      HemisAccommodation,
      HemisStudentStatus,
      HemisAcademicDegree,
      HemisAcademicRank,
      HemisEmploymentForm,
      HemisEmploymentStaff,
      HemisStaffPosition,
      HemisEmployeeStatus,
      HemisEmployeeType,
      HemisDepartmentStructureType,
      HemisDepartmentLocalityType,
      HemisEducationLang,
    ]),
  ],
  controllers: [HemisController],
  providers: [HemisSyncService, HemisApiService, HemisProgressService, HemisScheduledSyncService],
  exports: [HemisSyncService, HemisApiService, HemisProgressService, HemisScheduledSyncService],
})
export class HemisModule {}

