import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hemis_semesters')
export class HemisSemester {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'hemis_id', type: 'int', unique: true, nullable: true })
  hemisId: number;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
