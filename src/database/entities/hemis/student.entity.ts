import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HemisUniversity } from './university.entity';
import { HemisGender } from './gender.entity';
import { HemisDepartment } from './department.entity';
import { HemisSpecialty } from './specialty.entity';
import { HemisGroup } from './group.entity';
import { HemisEducationYear } from './education-year.entity';
import { HemisCountry } from './country.entity';
import { HemisTerritory } from './territory.entity';
import { HemisCitizenship } from './citizenship.entity';
import { HemisSemester } from './semester.entity';
import { HemisLevel } from './level.entity';
import { HemisEducationForm } from './education-form.entity';
import { HemisEducationType } from './education-type.entity';
import { HemisPaymentForm } from './payment-form.entity';
import { HemisStudentType } from './student-type.entity';
import { HemisSocialCategory } from './social-category.entity';
import { HemisAccommodation } from './accommodation.entity';
import { HemisStudentStatus } from './student-status.entity';

@Entity('hemis_students')
export class HemisStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hemis_id', type: 'bigint', unique: true })
  hemisId: number;

  @Column({ name: 'meta_id', type: 'bigint', nullable: true })
  metaId: number;

  @Column({ name: 'full_name', type: 'text' })
  fullName: string;

  @Column({ name: 'short_name', type: 'varchar', length: 100, nullable: true })
  shortName: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'second_name', type: 'varchar', length: 100 })
  secondName: string;

  @Column({ name: 'third_name', type: 'varchar', length: 100, nullable: true })
  thirdName: string;

  @Column({ type: 'text', nullable: true })
  image: string;

  @Column({ name: 'image_full', type: 'text', nullable: true })
  imageFull: string;

  @Column({ name: 'student_id_number', type: 'varchar', length: 50 })
  studentIdNumber: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({ name: 'avg_gpa', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgGpa: number;

  @Column({ name: 'avg_grade', type: 'decimal', precision: 5, scale: 2, nullable: true })
  avgGrade: number;

  @Column({ name: 'total_credit', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalCredit: number;

  // University
  @ManyToOne(() => HemisUniversity)
  @JoinColumn({ name: 'university_id' })
  university: HemisUniversity;

  @Column({ name: 'university_id', nullable: true })
  universityId: number;

  // Gender
  @ManyToOne(() => HemisGender)
  @JoinColumn({ name: 'gender_id' })
  gender: HemisGender;

  @Column({ name: 'gender_id', nullable: true })
  genderId: number;

  // Department
  @ManyToOne(() => HemisDepartment)
  @JoinColumn({ name: 'department_id' })
  department: HemisDepartment;

  @Column({ name: 'department_id', nullable: true })
  departmentId: number;

  // Specialty
  @ManyToOne(() => HemisSpecialty)
  @JoinColumn({ name: 'specialty_id' })
  specialty: HemisSpecialty;

  @Column({ name: 'specialty_id', nullable: true })
  specialtyId: number;

  // Group
  @ManyToOne(() => HemisGroup)
  @JoinColumn({ name: 'group_id' })
  group: HemisGroup;

  @Column({ name: 'group_id', nullable: true })
  groupId: number;

  // Education Year
  @ManyToOne(() => HemisEducationYear)
  @JoinColumn({ name: 'education_year_id' })
  educationYear: HemisEducationYear;

  @Column({ name: 'education_year_id', nullable: true })
  educationYearId: number;

  // Country
  @ManyToOne(() => HemisCountry)
  @JoinColumn({ name: 'country_id' })
  country: HemisCountry;

  @Column({ name: 'country_id', nullable: true })
  countryId: number;

  // Province (Territory)
  @ManyToOne(() => HemisTerritory)
  @JoinColumn({ name: 'province_id' })
  province: HemisTerritory;

  @Column({ name: 'province_id', nullable: true })
  provinceId: number;

  // District (Territory)
  @ManyToOne(() => HemisTerritory)
  @JoinColumn({ name: 'district_id' })
  district: HemisTerritory;

  @Column({ name: 'district_id', nullable: true })
  districtId: number;

  // Terrain (Territory)
  @ManyToOne(() => HemisTerritory)
  @JoinColumn({ name: 'terrain_id' })
  terrain: HemisTerritory;

  @Column({ name: 'terrain_id', nullable: true })
  terrainId: number;

  // Citizenship
  @ManyToOne(() => HemisCitizenship)
  @JoinColumn({ name: 'citizenship_id' })
  citizenship: HemisCitizenship;

  @Column({ name: 'citizenship_id', nullable: true })
  citizenshipId: number;

  // Semester
  @ManyToOne(() => HemisSemester)
  @JoinColumn({ name: 'semester_id' })
  semester: HemisSemester;

  @Column({ name: 'semester_id', nullable: true })
  semesterId: number;

  // Level
  @ManyToOne(() => HemisLevel)
  @JoinColumn({ name: 'level_id' })
  level: HemisLevel;

  @Column({ name: 'level_id', nullable: true })
  levelId: number;

  // Education Form
  @ManyToOne(() => HemisEducationForm)
  @JoinColumn({ name: 'education_form_id' })
  educationForm: HemisEducationForm;

  @Column({ name: 'education_form_id', nullable: true })
  educationFormId: number;

  // Education Type
  @ManyToOne(() => HemisEducationType)
  @JoinColumn({ name: 'education_type_id' })
  educationType: HemisEducationType;

  @Column({ name: 'education_type_id', nullable: true })
  educationTypeId: number;

  // Payment Form
  @ManyToOne(() => HemisPaymentForm)
  @JoinColumn({ name: 'payment_form_id' })
  paymentForm: HemisPaymentForm;

  @Column({ name: 'payment_form_id', nullable: true })
  paymentFormId: number;

  // Student Type
  @ManyToOne(() => HemisStudentType)
  @JoinColumn({ name: 'student_type_id' })
  studentType: HemisStudentType;

  @Column({ name: 'student_type_id', nullable: true })
  studentTypeId: number;

  // Social Category
  @ManyToOne(() => HemisSocialCategory)
  @JoinColumn({ name: 'social_category_id' })
  socialCategory: HemisSocialCategory;

  @Column({ name: 'social_category_id', nullable: true })
  socialCategoryId: number;

  // Accommodation
  @ManyToOne(() => HemisAccommodation)
  @JoinColumn({ name: 'accommodation_id' })
  accommodation: HemisAccommodation;

  @Column({ name: 'accommodation_id', nullable: true })
  accommodationId: number;

  // Student Status
  @ManyToOne(() => HemisStudentStatus)
  @JoinColumn({ name: 'student_status_id' })
  studentStatus: HemisStudentStatus;

  @Column({ name: 'student_status_id', nullable: true })
  studentStatusId: number;

  // JSON fields
  @Column({ name: 'poverty_level', type: 'text', nullable: true })
  povertyLevel: string;

  @Column({ name: '_curriculum', type: 'bigint', nullable: true })
  curriculum: number;

  @Column({ type: 'text', nullable: true })
  hash: string;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;
}
