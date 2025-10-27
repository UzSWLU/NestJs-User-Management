import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('hemis_employees')
export class HemisEmployee {
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
  @Index()
  employee_id_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  birth_date: string;

  // Gender
  @Column({ type: 'varchar', length: 10, nullable: true })
  gender_code: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  gender_name: string;

  @Column({ type: 'int', nullable: true })
  year_of_enter: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  specialty: string;

  // Academic Info
  @Column({ type: 'varchar', length: 20, nullable: true })
  academic_degree_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  academic_degree_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  academic_rank_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  academic_rank_name: string;

  // Department
  @Column({ type: 'bigint', nullable: true })
  department_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  department_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  department_code: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  department_structure_type_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department_structure_type_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  department_locality_type_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department_locality_type_name: string;

  @Column({ type: 'boolean', default: true })
  department_active: boolean;

  // Employment Info
  @Column({ type: 'varchar', length: 20, nullable: true })
  employment_form_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employment_form_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  employment_staff_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employment_staff_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  staff_position_code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  staff_position_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  employee_status_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employee_status_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  employee_type_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employee_type_name: string;

  // Contract
  @Column({ type: 'varchar', length: 50, nullable: true })
  contract_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  decree_number: string;

  @Column({ type: 'bigint', nullable: true })
  contract_date: number;

  @Column({ type: 'bigint', nullable: true })
  decree_date: number;

  // Additional
  @Column({ type: 'varchar', length: 500, nullable: true })
  image: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_full: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  hash: string;

  @Column({ type: 'text', nullable: true })
  tutor_groups: string | null; // JSON string for tutor groups array

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'bigint', nullable: true })
  last_synced_at: number;
}

