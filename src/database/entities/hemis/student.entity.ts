import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hemis_students')
export class HemisStudent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', unique: true })
  hemis_id: number;

  @Column({ type: 'bigint', nullable: true })
  meta_id: number;

  // Basic Info
  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  short_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  second_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  third_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  student_id_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birth_date: string;

  // University Info
  @Column({ type: 'varchar', length: 50, nullable: true })
  university_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  university_name: string;

  // Gender
  @Column({ type: 'varchar', length: 10, nullable: true })
  gender_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender_name: string;

  // Location
  @Column({ type: 'varchar', length: 10, nullable: true })
  country_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  province_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  province_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  district_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  district_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  terrain_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  terrain_name: string;

  // Status
  @Column({ type: 'varchar', length: 20, nullable: true })
  citizenship_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  citizenship_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  student_status_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  student_status_name: string;

  // Education Info
  @Column({ type: 'bigint', nullable: true })
  curriculum_id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  education_form_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  education_form_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  education_type_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  education_type_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  payment_form_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  payment_form_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  student_type_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  student_type_name: string;

  // Department & Specialty
  @Column({ type: 'bigint', nullable: true })
  department_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  department_code: string;

  @Column({ type: 'bigint', nullable: true })
  specialty_id: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  specialty_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialty_name: string;

  // Group Info
  @Column({ type: 'bigint', nullable: true })
  group_id: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  group_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  education_lang_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  education_lang_name: string;

  // Academic
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  avg_gpa: number;

  @Column({ type: 'int', default: 0 })
  avg_grade: number;

  @Column({ type: 'int', default: 0 })
  total_credit: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  level_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  level_name: string;

  @Column({ type: 'bigint', nullable: true })
  semester_id: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  semester_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  semester_name: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  education_year_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  education_year_name: string;

  @Column({ type: 'boolean', default: false })
  education_year_current: boolean;

  @Column({ type: 'int', nullable: true })
  year_of_enter: number;

  // Social & Living
  @Column({ type: 'varchar', length: 20, nullable: true })
  social_category_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  social_category_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  accommodation_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accommodation_name: string;

  @Column({ type: 'int', nullable: true })
  roommate_count: number;

  // Additional
  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_full: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  other: string;

  @Column({ type: 'boolean', default: false })
  is_graduate: boolean;

  @Column({ type: 'int', nullable: true })
  poverty_level: number;

  @Column({ type: 'int', nullable: true })
  total_acload: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hash: string;

  @Column({ type: 'text', nullable: true })
  validate_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  last_synced_at: number;
}

