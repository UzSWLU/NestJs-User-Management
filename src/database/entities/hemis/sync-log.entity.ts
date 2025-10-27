import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('hemis_sync_logs')
export class HemisSyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type: string; // 'student' or 'employee'

  @Column({ name: 'hemis_id', type: 'bigint', nullable: true })
  hemisId: number | null;

  @Column({ type: 'varchar', length: 50 })
  status: string; // 'error', 'retry'

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ name: 'data_snapshot', type: 'json', nullable: true })
  dataSnapshot: any;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @Column({ name: 'page_number', type: 'int', nullable: true })
  pageNumber: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
