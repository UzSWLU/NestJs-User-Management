import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'Unique username for the account',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
    type: String,
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Valid email address',
    example: 'john.doe@example.com',
    format: 'email',
    type: String,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Strong password (minimum 6 characters)',
    example: 'SecurePass123!',
    minLength: 6,
    type: String,
    format: 'password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
