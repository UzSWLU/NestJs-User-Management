import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_refresh_tokens')
export class UserRefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ unique: true })
  token: string;

  @Column({ length: 100, nullable: true })
  device: string;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 255, nullable: true })
  user_agent: string;

  @Column({ nullable: true })
  rotated_from: number;

  @Column({ type: 'datetime', nullable: true })
  rotated_at: Date;

  @Column({ type: 'datetime', nullable: true })
  expires_at: Date;

  @Column({ type: 'tinyint', default: 0 })
  revoked: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'enum', enum: ['web', 'mobile', 'desktop', 'api'], default: 'web' })
  platform: 'web' | 'mobile' | 'desktop' | 'api';
}
