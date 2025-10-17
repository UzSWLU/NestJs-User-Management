import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Current password',
    example: 'oldPassword123',
    minLength: 6,
    type: String,
  })
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @ApiProperty({
    description: 'New password (minimum 6 characters)',
    example: 'NewSecurePass456!',
    minLength: 6,
    type: String,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}


