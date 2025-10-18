import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Company nomi',
    example: 'Tech Solutions Inc.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Company logo URL (file upload orqali yangilanadi)',
    example: '/uploads/logos/company-logo.png',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Company domain',
    example: 'techsolutions.com',
  })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiPropertyOptional({
    description: 'Company holati',
    enum: ['active', 'inactive'],
    default: 'active',
  })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: 'active' | 'inactive';
}
