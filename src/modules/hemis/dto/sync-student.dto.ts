import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncStudentDto {
  @ApiProperty({
    description: 'Student HEMIS ID',
    example: 50421,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  hemis_id?: number;

  @ApiProperty({
    description: 'Student ID number (tajriba raqami)',
    example: '326251200658',
    required: false,
  })
  @IsOptional()
  @IsString()
  student_id_number?: string;
}

