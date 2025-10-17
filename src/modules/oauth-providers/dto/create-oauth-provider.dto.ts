import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOAuthProviderDto {
  @ApiProperty({
    example: 'hemis',
    description: 'Provider name (google, hemis, student_portal, etc.)',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    example: 'oauth',
    description: 'Authentication type: oauth (OAuth 2.0) or api (Direct API)',
    enum: ['oauth', 'api'],
    default: 'oauth',
  })
  @IsOptional()
  @IsEnum(['oauth', 'api'])
  auth_type?: 'oauth' | 'api';

  @ApiPropertyOptional({
    example: 'https://student.uzswlu.uz/rest/v1/auth/login',
    description: 'For API type: Direct login endpoint URL',
  })
  @IsOptional()
  @IsString()
  url_login?: string;

  @ApiPropertyOptional({ example: '4' })
  @IsOptional()
  @IsString()
  client_id?: string;

  @ApiPropertyOptional({ example: 'nfqKaEMNzb5FbALETL9GqRa_n6g9KDMoEsFSDDF1' })
  @IsOptional()
  @IsString()
  client_secret?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/api/auth/callback/hemis',
  })
  @IsOptional()
  @IsString()
  redirect_uri?: string;

  @ApiPropertyOptional({
    example: 'https://hemis.uzswlu.uz/oauth/authorize',
    description: 'OAuth authorization URL',
  })
  @IsOptional()
  @IsString()
  url_authorize?: string;

  @ApiPropertyOptional({
    example: 'https://hemis.uzswlu.uz/oauth/access-token',
    description: 'OAuth token exchange URL',
  })
  @IsOptional()
  @IsString()
  url_access_token?: string;

  @ApiPropertyOptional({
    example: 'https://hemis.uzswlu.uz/oauth/api/user?fields=id,uuid,name,email',
    description: 'OAuth user info URL',
  })
  @IsOptional()
  @IsString()
  url_resource_owner_details?: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3001/auth/success',
    description:
      'Frontend URL to redirect after successful OAuth login with tokens',
  })
  @IsOptional()
  @IsString()
  front_redirect?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
