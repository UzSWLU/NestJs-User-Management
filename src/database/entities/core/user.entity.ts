import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Company } from './company.entity';
import { UserRole } from './user-role.entity';
import { UserOAuthAccount } from '../oauth/user-oauth-account.entity';
import { UserProfile } from '../oauth/user-profile.entity';
import { UserProfilePreference } from '../oauth/user-profile-preference.entity';
import { UserRefreshToken } from '../auth/user-refresh-token.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  companyId: number;

  @ManyToOne(() => Company, (company) => company.users)
  company: Company;

  @Column({ unique: true, length: 100 })
  username: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ nullable: true, length: 255 })
  full_name: string;

  @Column({ unique: true, length: 30, nullable: true })
  phone: string;

  @Column({ type: 'tinyint', default: 0 })
  email_verified: boolean;

  @Column({ type: 'tinyint', default: 0 })
  phone_verified: boolean;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  primary_profile_id: number;

  @Column({ name: 'password_hash', length: 255 })
  password_hash: string;

  @Column({ nullable: true, length: 64 })
  reset_token: string;

  @Column({ nullable: true, length: 64 })
  verification_token: string;

  @Column({ nullable: true, length: 64 })
  auth_key: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'active', 'blocked'],
    default: 'pending',
  })
  status: 'pending' | 'active' | 'blocked';

  @Column({ type: 'datetime', nullable: true })
  last_login_at: Date;

  @Column({ type: 'int', default: 0 })
  failed_attempts: number;

  @Column({ type: 'datetime', nullable: true })
  last_failed_at: Date;

  @Column({ type: 'tinyint', default: 0 })
  is_2fa_enabled: boolean;

  @Column({ type: 'datetime', nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // 🔹 Aloqalar
  @OneToMany(() => UserRole, (ur) => ur.user)
  roles: UserRole[];

  @OneToMany(() => UserOAuthAccount, (account) => account.user)
  oauth_accounts: UserOAuthAccount[];

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile: UserProfile;

  @OneToMany(() => UserProfilePreference, (pref) => pref.user)
  preferences: UserProfilePreference[];

  @OneToMany(() => UserRefreshToken, (token) => token.user)
  refreshTokens: UserRefreshToken[];
}
