import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncEmployeeDto {
  @ApiProperty({
    description: 'Employee HEMIS ID',
    example: 1826,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  hemis_id?: number;

  @ApiProperty({
    description: 'Employee ID number (ishchi kodi)',
    example: '3262311010',
    required: false,
  })
  @IsOptional()
  @IsString()
  employee_id_number?: string;
}

