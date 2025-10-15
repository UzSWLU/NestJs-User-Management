import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_merge_history')
export class UserMergeHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { eager: true })
  main_user: User;

  @ManyToOne(() => User, { eager: true })
  merged_user: User;

  @CreateDateColumn()
  merged_at: Date;
}
