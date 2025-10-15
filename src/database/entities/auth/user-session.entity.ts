import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../core/user.entity';
import { UserRefreshToken } from './user-refresh-token.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => UserRefreshToken, { onDelete: 'CASCADE', nullable: true })
  refresh_token: UserRefreshToken | null;

  @Column({ length: 45, nullable: true })
  ip_address: string;

  @Column({ length: 255, nullable: true })
  user_agent: string;

  @Column({ length: 128, nullable: true })
  device_hash: string;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ type: 'datetime', nullable: true })
  login_at: Date;

  @Column({ type: 'datetime', nullable: true })
  logout_at: Date;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'terminated'],
    default: 'active',
  })
  status: 'active' | 'expired' | 'terminated';

  @Column({
    type: 'enum',
    enum: ['web', 'mobile', 'desktop', 'api'],
    default: 'web',
  })
  platform: 'web' | 'mobile' | 'desktop' | 'api';
}
