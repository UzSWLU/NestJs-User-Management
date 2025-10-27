import { ApiProperty } from '@nestjs/swagger';

export class SyncProgressDto {
  @ApiProperty({ example: 'running', enum: ['idle', 'running', 'completed', 'error', 'cancelled'] })
  status: string;

  @ApiProperty({ example: 1697123456789 })
  startTime: number;

  @ApiProperty({ example: 1697123456789, required: false })
  endTime?: number;

  @ApiProperty({ example: 2345 })
  totalRecords: number;

  @ApiProperty({ example: 500 })
  processedRecords: number;

  @ApiProperty({ example: [], type: [String] })
  errors: string[];

  @ApiProperty({ example: 5, required: false })
  currentPage?: number;

  @ApiProperty({ example: 12, required: false })
  totalPages?: number;

  @ApiProperty({ example: 'Processing page 5 of 12', required: false })
  message?: string;
}

export class SyncResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Student sync completed successfully' })
  message: string;
}
