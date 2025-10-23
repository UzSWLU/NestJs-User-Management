import { IsString, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePermissionDto {
  @ApiProperty({ example: 'GET /api/users' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Can create new users' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, description: 'Permission Group ID' })
  @IsOptional()
  @IsInt()
  groupId?: number;
}





