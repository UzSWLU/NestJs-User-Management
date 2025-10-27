import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { HemisDepartmentStructureType } from './department-structure-type.entity';
import { HemisDepartmentLocalityType } from './department-locality-type.entity';

@Entity('hemis_departments')
export class HemisDepartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'int', nullable: true })
  parent: number;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @ManyToOne(() => HemisDepartmentStructureType)
  @JoinColumn({ name: 'structure_type_id' })
  structureType: HemisDepartmentStructureType;

  @Column({ name: 'structure_type_id', nullable: true })
  structureTypeId: number;

  @ManyToOne(() => HemisDepartmentLocalityType)
  @JoinColumn({ name: 'locality_type_id' })
  localityType: HemisDepartmentLocalityType;

  @Column({ name: 'locality_type_id', nullable: true })
  localityTypeId: number;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
