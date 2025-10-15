import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_password_history')
export class UserPasswordHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  password_hash: string;

  @CreateDateColumn()
  created_at: Date;
}
