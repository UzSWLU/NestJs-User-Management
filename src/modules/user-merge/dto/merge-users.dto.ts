import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MergeUsersDto {
  @ApiProperty({
    example: 1,
    description: 'Main user ID (account to keep)',
  })
  @IsInt()
  mainUserId: number;

  @ApiProperty({
    example: 2,
    description: 'User ID to merge and deactivate',
  })
  @IsInt()
  mergedUserId: number;
}


