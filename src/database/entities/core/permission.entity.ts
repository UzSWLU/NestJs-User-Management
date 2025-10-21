import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PermissionGroup } from './permission-group.entity';

@Entity('permissions')
export class Permission {
  @ApiProperty({ 
    example: 1, 
    description: 'Permission unique identifier' 
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiPropertyOptional({ 
    type: () => PermissionGroup,
    description: 'Permission group (optional categorization)' 
  })
  @ManyToOne(() => PermissionGroup, (group) => group.permissions, { nullable: true })
  group: PermissionGroup | null;

  @ApiProperty({ 
    example: 'GET /api/users', 
    description: 'Permission name in endpoint format (HTTP_METHOD /api/path)',
    maxLength: 100,
    uniqueItems: true
  })
  @Column({ length: 100, unique: true })
  name: string; // Endpoint format: 'GET /api/users', 'POST /api/users/:id'

  @ApiPropertyOptional({ 
    example: 'View list of all users',
    description: 'Human-readable description of what this permission allows',
    maxLength: 255
  })
  @Column({ length: 255, nullable: true })
  description: string;

  @ApiProperty({ 
    example: '2025-01-20T10:30:00Z',
    description: 'Permission creation timestamp' 
  })
  @CreateDateColumn()
  created_at: Date;
}
