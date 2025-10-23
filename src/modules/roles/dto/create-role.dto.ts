import { IsString, IsOptional, IsBoolean, IsArray, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Administrator with full access' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_system?: boolean;

  @ApiPropertyOptional({ example: [1, 2, 3], description: 'Permission IDs' })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  permissionIds?: number[];
}





