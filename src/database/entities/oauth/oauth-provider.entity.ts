import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOAuthAccount } from './user-oauth-account.entity';
import { Role } from '../core/role.entity';

@Entity('oauth_providers')
export class OAuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string; // google, hemis, oneid, github, student_portal...

  @Column({ 
    type: 'enum', 
    enum: ['oauth', 'api'], 
    default: 'oauth',
    comment: 'Authentication type: oauth (OAuth 2.0) or api (Direct API call)'
  })
  auth_type: 'oauth' | 'api';

  @Column({ nullable: true, type: 'text' })
  url_login: string; // For API type: Direct login endpoint (e.g., https://student.uzswlu.uz/rest/v1/auth/login)

  @Column({ nullable: true })
  client_id: string;

  @Column({ nullable: true })
  client_secret: string;

  @Column({ nullable: true })
  redirect_uri: string;

  @Column({ nullable: true, type: 'text' })
  url_authorize: string;

  @Column({ nullable: true, type: 'text' })
  url_access_token: string;

  @Column({ nullable: true, type: 'text' })
  url_resource_owner_details: string;

  @Column({ nullable: true, type: 'text' })
  front_redirect: string; // Frontend URL to redirect after successful OAuth login

  @ManyToOne(() => Role, { nullable: true, eager: true })
  @JoinColumn({ name: 'default_role_id' })
  default_role: Role; // Default role assigned to new OAuth users

  @Column({ nullable: true })
  default_role_id: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserOAuthAccount, (account) => account.provider)
  accounts: UserOAuthAccount[];
}
