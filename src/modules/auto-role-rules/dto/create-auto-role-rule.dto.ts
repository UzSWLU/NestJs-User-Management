import { IsInt, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAutoRoleRuleDto {
  @ApiProperty({ example: 1, description: 'OAuth provider ID (1=hemis, 2=google, etc.)' })
  @IsInt()
  providerId: number;

  @ApiProperty({ example: 5, description: 'Role ID to auto-assign (e.g., 5=student)' })
  @IsInt()
  roleId: number;

  @ApiProperty({
    example: 'Default student role for all HEMIS users',
    description: 'Rule name/description',
  })
  @IsString()
  rule_name: string;

  @ApiProperty({
    example: 'id',
    description: 'Field to check in OAuth user data (e.g., id, email, type, department). Use "id" for default/always match.',
  })
  @IsString()
  condition_field: string;

  @ApiPropertyOptional({
    example: 'contains',
    description: 'Comparison operator (optional, defaults to "contains")',
    enum: ['equals', 'contains', 'starts_with', 'ends_with', 'in'],
    default: 'contains',
  })
  @IsOptional()
  @IsString()
  condition_operator?: string;

  @ApiProperty({
    example: '',
    description: 'Value to match. Leave empty ("") to match all users (default role).',
  })
  @IsString()
  condition_value: string;
}


