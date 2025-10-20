import { IsInt, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkOAuthAccountDto {
  @ApiProperty({ example: 1, description: 'OAuth provider ID' })
  @IsInt()
  providerId: number;

  @ApiProperty({
    example: '123456789',
    description: 'User ID from OAuth provider',
  })
  @IsString()
  provider_user_id: string;

  @ApiPropertyOptional({ example: 'access-token-xyz' })
  @IsOptional()
  @IsString()
  access_token?: string;

  @ApiPropertyOptional({ example: 'refresh-token-abc' })
  @IsOptional()
  @IsString()
  refresh_token?: string;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  @IsOptional()
  expires_at?: Date;
}




