import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_audit_logs')
export class UserAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number;

  @Column({
    type: 'enum',
    enum: [
      'login',
      'logout',
      'password_change',
      '2fa_enable',
      '2fa_disable',
      'token_revoke',
      'user_merge',
      'user_merged',
    ],
  })
  event_type:
    | 'login'
    | 'logout'
    | 'password_change'
    | '2fa_enable'
    | '2fa_disable'
    | 'token_revoke'
    | 'user_merge'
    | 'user_merged';

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 255, nullable: true })
  user_agent: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
