import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('jwt_secret_versions')
export class JwtSecretVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  version: string;

  @Column({ length: 255 })
  secret_key: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'tinyint', default: 1 })
  is_active: boolean;

  @Column({ nullable: true })
  rotated_by: number;

  @Column({ type: 'datetime', nullable: true })
  valid_until: Date;
}
