import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Role } from '../core/role.entity';
import { OAuthProvider } from './oauth-provider.entity';

@Entity('user_auto_role_rules')
export class UserAutoRoleRule {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => OAuthProvider, { eager: true })
  provider: OAuthProvider;

  @ManyToOne(() => Role, { eager: true })
  role: Role;

  @Column({ length: 255 })
  condition_field: string; // masalan: 'email_domain', 'department_code'

  @Column({ length: 255 })
  condition_value: string; // masalan: '@hemis.uz'

  @CreateDateColumn()
  created_at: Date;
}
