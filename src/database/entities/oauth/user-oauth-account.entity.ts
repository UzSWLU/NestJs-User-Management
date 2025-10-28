import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, Unique } from 'typeorm';
import { User } from '../core/user.entity';
import { OAuthProvider } from './oauth-provider.entity';

@Entity('user_oauth_accounts')
@Unique(['provider', 'provider_user_id'])
export class UserOAuthAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.oauth_accounts, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => OAuthProvider, (provider) => provider.accounts, { eager: true, onDelete: 'CASCADE' })
  provider: OAuthProvider;

  @Column({ length: 255 })
  provider_user_id: string; // masalan: Google ID, HEMIS ID

  @Column({ nullable: true })
  access_token: string;

  @Column({ nullable: true })
  refresh_token: string;

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ type: 'json', nullable: true })
  oauth_data: any; // Raw OAuth user data from provider

  // Link to provider-specific profile (hemis_employees.id, hemis_students.id, etc.)
  // Provider orqali qaysi jadval ekanligini aniqlash mumkin
  @Column({ name: 'profile_id', type: 'int', nullable: true })
  profileId: number | null; // Foreign key: hemis_employees.id (hemis provider), hemis_students.id (student provider), etc.

  @Column({ nullable: true })
  last_login: Date; // Last time user logged in via this OAuth provider

  @CreateDateColumn()
  linked_at: Date;
}
