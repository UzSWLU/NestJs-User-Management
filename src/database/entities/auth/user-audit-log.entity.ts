import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_audit_logs')
export class UserAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({
    type: 'enum',
    enum: ['login', 'logout', 'password_change', '2fa_enable', '2fa_disable', 'token_revoke'],
  })
  event_type:
    | 'login'
    | 'logout'
    | 'password_change'
    | '2fa_enable'
    | '2fa_disable'
    | 'token_revoke';

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 255, nullable: true })
  user_agent: string;

  @CreateDateColumn()
  created_at: Date;
}
