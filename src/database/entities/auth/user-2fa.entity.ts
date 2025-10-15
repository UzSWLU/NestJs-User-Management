import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_2fa')
export class User2FA {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 64 })
  secret_key: string;

  @Column({ type: 'text', nullable: true })
  backup_codes: string;

  @Column({ type: 'datetime', nullable: true })
  verified_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'enum', enum: ['totp', 'sms', 'email'], default: 'totp' })
  type: 'totp' | 'sms' | 'email';
}
