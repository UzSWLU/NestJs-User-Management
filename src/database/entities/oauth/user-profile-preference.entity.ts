import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_profile_preferences')
export class UserProfilePreference {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.preferences, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 100 })
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
