import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HemisController } from './hemis.controller';
import { HemisService } from './hemis.service';
import { HemisApiService } from './services/hemis-api.service';
import { HemisProgressService } from './services/hemis-progress.service';
import { HemisSyncService } from './services/hemis-sync.service';
import { OAuthAccountSyncService } from './services/oauth-account-sync.service';
import { HemisScheduler } from './hemis.scheduler';

// Main entities
import { HemisStudent } from '../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../database/entities/hemis/employee.entity';
import { HemisSyncLog } from '../../database/entities/hemis/sync-log.entity';

// Lookup entities
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

// OAuth entities
import { UserOAuthAccount } from '../../database/entities/oauth/user-oauth-account.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';
// User entities for OAuthAccountSyncService
import { User } from '../../database/entities/core/user.entity';
import { UserRole } from '../../database/entities/core/user-role.entity';
import { Role } from '../../database/entities/core/role.entity';
import { Company } from '../../database/entities/core/company.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Main entities
      HemisStudent,
      HemisEmployee,
      HemisSyncLog,
      // Lookup entities
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
      // OAuth entities for OAuthAccountSyncService
      UserOAuthAccount,
      OAuthProvider,
      UserMergeHistory,
      // User entities for OAuthAccountSyncService
      User,
      UserRole,
      Role,
      Company,
    ]),
  ],
  controllers: [HemisController],
  providers: [
    HemisService,
    HemisApiService,
    HemisProgressService,
    HemisSyncService,
    OAuthAccountSyncService,
    HemisScheduler,
  ],
  exports: [HemisService, HemisApiService, HemisSyncService],
})
export class HemisModule {}

