import { ApiProperty } from '@nestjs/swagger';

export class SyncResponseDto {
  @ApiProperty({ example: true, description: 'Sync success status' })
  success: boolean;

  @ApiProperty({ 
    example: '✅ Synced 23238 students in 456.78s. ❌ Errors: 5. 🗑️ Deleted: 0',
    description: 'Human-readable sync result message'
  })
  message: string;

  @ApiProperty({ 
    required: false,
    description: 'Synced entity data (for single sync)'
  })
  data?: any;

  @ApiProperty({ 
    example: 23238,
    required: false,
    description: 'Total number of records synced'
  })
  totalSynced?: number;

  @ApiProperty({ 
    example: [],
    required: false,
    isArray: true,
    description: 'List of errors encountered during sync'
  })
  errors?: string[];

  @ApiProperty({ 
    example: 0,
    required: false,
    description: 'Number of obsolete records deleted'
  })
  deleted?: number;
}

