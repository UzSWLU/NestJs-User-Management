import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  name: string; // 'admin', 'user', 'employee'...

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'tinyint', default: 0 })
  is_system: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RolePermission, (rp) => rp.role)
  permissions: RolePermission[];

  @OneToMany(() => UserRole, (ur) => ur.role)
  users: UserRole[];
}
