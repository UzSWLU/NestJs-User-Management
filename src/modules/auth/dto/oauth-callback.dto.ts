import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OAuthCallbackDto {
  @ApiProperty({
    example: 'abc123def456',
    description: 'Authorization code from OAuth provider',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    example: 'random_state_string',
    description: 'State parameter for CSRF protection',
  })
  @IsString()
  @IsOptional()
  state?: string;
}





