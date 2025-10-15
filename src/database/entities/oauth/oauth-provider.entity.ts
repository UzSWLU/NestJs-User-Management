import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserOAuthAccount } from './user-oauth-account.entity';

@Entity('oauth_providers')
export class OAuthProvider {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string; // google, hemis, oneid, github...

  @Column({ nullable: true })
  client_id: string;

  @Column({ nullable: true })
  client_secret: string;

  @Column({ nullable: true })
  redirect_uri: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => UserOAuthAccount, (account) => account.provider)
  accounts: UserOAuthAccount[];
}
