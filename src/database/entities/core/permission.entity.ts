import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { PermissionGroup } from './permission-group.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PermissionGroup, (group) => group.permissions, { nullable: true })
  group: PermissionGroup | null;

  @Column({ length: 100, unique: true })
  name: string; // Endpoint format: 'GET /api/users', 'POST /api/users/:id'

  @Column({ length: 255, nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;
}
