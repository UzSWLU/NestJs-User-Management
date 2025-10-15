import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Role } from './role.entity';
import { Permission } from './permission.entity';

@Entity('role_permissions')
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  role: Role;

  @ManyToOne(() => Permission, { eager: true, onDelete: 'CASCADE' })
  permission: Permission;
}
