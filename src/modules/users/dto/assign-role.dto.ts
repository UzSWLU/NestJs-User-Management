import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignRoleDto {
  @ApiProperty({
    description: 'Role ID to assign to user',
    example: 1,
    type: Number,
  })
  @IsInt()
  roleId: number;
}





