import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';

@Entity('permission_groups')
export class PermissionGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @OneToMany(() => Permission, (permission) => permission.group)
  permissions: Permission[];
}
