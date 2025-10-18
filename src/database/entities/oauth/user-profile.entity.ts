import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../core/user.entity';

@Entity('user_profiles')
export class UserProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ length: 100, nullable: true })
  first_name: string;

  @Column({ length: 100, nullable: true })
  last_name: string;

  @Column({ length: 100, nullable: true })
  middle_name: string;

  @Column({ length: 255, nullable: true })
  avatar_url: string;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ length: 50, nullable: true })
  gender: string;

  @Column({ length: 255, nullable: true })
  phone: string;

  @Column({ length: 255, nullable: true })
  address: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
