import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HemisGender } from './gender.entity';
import { HemisDepartment } from './department.entity';
import { HemisAcademicDegree } from './academic-degree.entity';
import { HemisAcademicRank } from './academic-rank.entity';
import { HemisEmploymentForm } from './employment-form.entity';
import { HemisEmploymentStaff } from './employment-staff.entity';
import { HemisStaffPosition } from './staff-position.entity';
import { HemisEmployeeStatus } from './employee-status.entity';
import { HemisEmployeeType } from './employee-type.entity';

@Entity('hemis_employees')
export class HemisEmployee {
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

  @Column({ name: 'year_of_enter', type: 'varchar', length: 10, nullable: true })
  yearOfEnter: string;

  @Column({ name: 'employee_id_number', type: 'bigint' })
  employeeIdNumber: number;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

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

  // Academic Degree
  @ManyToOne(() => HemisAcademicDegree)
  @JoinColumn({ name: 'academic_degree_id' })
  academicDegree: HemisAcademicDegree;

  @Column({ name: 'academic_degree_id', nullable: true })
  academicDegreeId: number;

  // Academic Rank
  @ManyToOne(() => HemisAcademicRank)
  @JoinColumn({ name: 'academic_rank_id' })
  academicRank: HemisAcademicRank;

  @Column({ name: 'academic_rank_id', nullable: true })
  academicRankId: number;

  // Employment Form
  @ManyToOne(() => HemisEmploymentForm)
  @JoinColumn({ name: 'employment_form_id' })
  employmentForm: HemisEmploymentForm;

  @Column({ name: 'employment_form_id', nullable: true })
  employmentFormId: number;

  // Employment Staff
  @ManyToOne(() => HemisEmploymentStaff)
  @JoinColumn({ name: 'employment_staff_id' })
  employmentStaff: HemisEmploymentStaff;

  @Column({ name: 'employment_staff_id', nullable: true })
  employmentStaffId: number;

  // Staff Position
  @ManyToOne(() => HemisStaffPosition)
  @JoinColumn({ name: 'staff_position_id' })
  staffPosition: HemisStaffPosition;

  @Column({ name: 'staff_position_id', nullable: true })
  staffPositionId: number;

  // Employee Status
  @ManyToOne(() => HemisEmployeeStatus)
  @JoinColumn({ name: 'employee_status_id' })
  employeeStatus: HemisEmployeeStatus;

  @Column({ name: 'employee_status_id', nullable: true })
  employeeStatusId: number;

  // Employee Type
  @ManyToOne(() => HemisEmployeeType)
  @JoinColumn({ name: 'employee_type_id' })
  employeeType: HemisEmployeeType;

  @Column({ name: 'employee_type_id', nullable: true })
  employeeTypeId: number;

  // Text fields
  @Column({ type: 'text', nullable: true })
  specialty: string;

  @Column({ name: 'contract_number', type: 'varchar', length: 100, nullable: true })
  contractNumber: string;

  @Column({ name: 'decree_number', type: 'varchar', length: 100, nullable: true })
  decreeNumber: string;

  @Column({ name: 'contract_date', type: 'bigint', nullable: true })
  contractDate: number;

  @Column({ name: 'decree_date', type: 'bigint', nullable: true })
  decreeDate: number;

  @Column({ type: 'text', nullable: true })
  hash: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @Column({ name: 'created_at', type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ name: 'update_at', type: 'timestamp', nullable: true })
  updateAt: Date;
}

