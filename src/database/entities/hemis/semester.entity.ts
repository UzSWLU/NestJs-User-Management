import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HemisLevel } from './level.entity';
import { HemisEducationYear } from './education-year.entity';

@Entity('hemis_semesters')
export class HemisSemester {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hemis_id', type: 'int', unique: true, nullable: true })
  hemisId: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  code: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  // Curriculum reference (lookup by ID)
  @Column({ name: '_curriculum', type: 'bigint', nullable: true })
  curriculum: number | null;

  // Education Year
  @ManyToOne(() => HemisEducationYear, { nullable: true })
  @JoinColumn({ name: 'education_year_id' })
  educationYear: HemisEducationYear;

  @Column({ name: 'education_year_id', nullable: true })
  educationYearId: number | null;

  @Column({ name: '_education_year', type: 'varchar', length: 255, nullable: true })
  educationYearCode: string | null;

  // Level
  @ManyToOne(() => HemisLevel, { nullable: true })
  @JoinColumn({ name: 'level_id' })
  level: HemisLevel;

  @Column({ name: 'level_id', nullable: true })
  levelId: number | null;

  // Dates (stored as Unix timestamp from API, converted to Date)
  @Column({ name: 'start_date', type: 'bigint', nullable: true })
  startDate: number | null;

  @Column({ name: 'end_date', type: 'bigint', nullable: true })
  endDate: number | null;

  // Position in curriculum
  @Column({ type: 'int', nullable: true })
  position: number | null;

  // Active status
  @Column({ type: 'boolean', nullable: true })
  active: boolean | null;

  // Current semester flag
  @Column({ type: 'boolean', nullable: true })
  current: boolean | null;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
