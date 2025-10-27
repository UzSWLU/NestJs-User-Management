import { Controller, Post, Get, Body, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HemisSyncService } from '../services/hemis-sync.service';
import { HemisProgressService } from '../services/hemis-progress.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SyncProgressDto, SyncResponseDto } from '../dto/sync-response.dto';

@ApiTags('HEMIS Sync')
@Controller('hemis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class HemisController {
  private readonly logger = new Logger(HemisController.name);

  constructor(
    private readonly hemisSyncService: HemisSyncService,
    private readonly progressService: HemisProgressService,
  ) {}

  @Post('sync/students')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Sync all students from HEMIS', description: 'Fetches all student data from HEMIS API and syncs to local database. Supports pagination, retry logic, and error handling.' })
  @ApiResponse({ status: 200, description: 'Student sync completed successfully', type: SyncResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  @ApiResponse({ status: 500, description: 'Internal server error during sync' })
  async syncStudents() {
    try {
      this.logger.log('Starting student sync...');
      await this.hemisSyncService.syncStudents();
      return {
        success: true,
        message: 'Student sync completed successfully',
      };
    } catch (error) {
      this.logger.error(`Student sync failed: ${error.message}`);
      throw error;
    }
  }

  @Post('sync/employees')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Sync all employees from HEMIS', description: 'Fetches all employee data from HEMIS API and syncs to local database. Supports pagination, retry logic, and error handling.' })
  @ApiResponse({ status: 200, description: 'Employee sync completed successfully', type: SyncResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  @ApiResponse({ status: 500, description: 'Internal server error during sync' })
  async syncEmployees() {
    try {
      this.logger.log('Starting employee sync...');
      await this.hemisSyncService.syncEmployees();
      return {
        success: true,
        message: 'Employee sync completed successfully',
      };
    } catch (error) {
      this.logger.error(`Employee sync failed: ${error.message}`);
      throw error;
    }
  }

  @Get('progress/students')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Get student sync progress', description: 'Returns real-time progress information for the student sync operation including status, processed records, current page, and any errors.' })
  @ApiResponse({ status: 200, description: 'Student sync progress retrieved successfully', type: SyncProgressDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  getStudentProgress() {
    return this.progressService.getStudentProgress();
  }

  @Get('progress/employees')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Get employee sync progress', description: 'Returns real-time progress information for the employee sync operation including status, processed records, current page, and any errors.' })
  @ApiResponse({ status: 200, description: 'Employee sync progress retrieved successfully', type: SyncProgressDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  getEmployeeProgress() {
    return this.progressService.getEmployeeProgress();
  }

  @Post('cancel/students')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Cancel student sync operation', description: 'Cancels the ongoing student sync operation. The sync will stop gracefully at the end of the current page being processed.' })
  @ApiResponse({ status: 200, description: 'Student sync cancelled successfully', type: SyncResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  cancelStudentSync() {
    this.logger.log('Cancelling student sync...');
    this.progressService.cancelStudentSync();
    return {
      success: true,
      message: 'Student sync cancellation requested',
    };
  }

  @Post('cancel/employees')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Cancel employee sync operation', description: 'Cancels the ongoing employee sync operation. The sync will stop gracefully at the end of the current page being processed.' })
  @ApiResponse({ status: 200, description: 'Employee sync cancelled successfully', type: SyncResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  cancelEmployeeSync() {
    this.logger.log('Cancelling employee sync...');
    this.progressService.cancelEmployeeSync();
    return {
      success: true,
      message: 'Employee sync cancellation requested',
    };
  }
}
