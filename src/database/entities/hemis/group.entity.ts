import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { HemisEducationLang } from './education-lang.entity';

@Entity('hemis_groups')
export class HemisGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => HemisEducationLang)
  @JoinColumn({ name: 'education_lang_id' })
  educationLang: HemisEducationLang;

  @Column({ name: 'education_lang_id', nullable: true })
  educationLangId: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
