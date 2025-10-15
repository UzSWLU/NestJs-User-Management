import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
export class UserRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Role, (role) => role.users, { eager: true, onDelete: 'CASCADE' })
  role: Role;

  @CreateDateColumn()
  assigned_at: Date;
}
