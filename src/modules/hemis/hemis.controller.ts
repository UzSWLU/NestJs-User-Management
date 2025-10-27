import { Controller, Post, Body, Get, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { HemisService } from './hemis.service';
import { HemisProgressService } from './hemis-progress.service';
import { SyncStudentDto } from './dto/sync-student.dto';
import { SyncEmployeeDto } from './dto/sync-employee.dto';
import { SyncResponseDto } from './dto/sync-response.dto';

class ProgressResponse {
  @ApiProperty({ example: 'running' })
  status: 'running' | 'completed' | 'failed';
  
  @ApiProperty({ example: 1698345600000 })
  startTime: number;
  
  @ApiProperty({ example: 1698346000000, required: false })
  endTime?: number;
  
  @ApiProperty({ example: 23238 })
  totalRecords: number;
  
  @ApiProperty({ example: 1250 })
  processedRecords: number;
  
  @ApiProperty({ example: [], isArray: true })
  errors: string[];
  
  @ApiProperty({ example: 25, required: false })
  currentPage?: number;
  
  @ApiProperty({ example: 'Processing page 25...', required: false })
  message?: string;
}

@ApiTags('HEMIS Sync')
@Controller('hemis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class HemisController {
  // HEMIS sync endpoints require admin or creator role
  // They use internal Bearer token for HEMIS API
  constructor(
    private readonly hemisService: HemisService,
    private readonly progressService: HemisProgressService,
  ) {}

  @Post('sync/students')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Sync all students from HEMIS',
    description: 'Fetches all students from HEMIS API and syncs them to local database. Process is paginated (50 records per page) with 1 second delay between batches to avoid overloading HEMIS server.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully synced students',
    type: SyncResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'HEMIS API unavailable or service unavailable' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error during sync' 
  })
  async syncAllStudents(): Promise<SyncResponseDto> {
    const startTime = Date.now();
    try {
      const result = await this.hemisService.syncAllStudents();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      return {
        success: result.success,
        message: `✅ Synced ${result.total} students in ${duration}s. ❌ Errors: ${result.errors?.length || 0}. 🗑️ Deleted: ${result.deleted || 0}`,
        totalSynced: result.total,
        errors: result.errors,
        deleted: result.deleted,
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      throw new HttpException(
        { success: false, message: `Sync failed after ${duration}s: ${error.message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/employees')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Sync all employees from HEMIS',
    description: 'Fetches all employees from HEMIS API and syncs them to local database. Process is paginated (50 records per page) with 1 second delay between batches to avoid overloading HEMIS server.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully synced employees',
    type: SyncResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 503, 
    description: 'HEMIS API unavailable or service unavailable' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error during sync' 
  })
  async syncAllEmployees(): Promise<SyncResponseDto> {
    const startTime = Date.now();
    try {
      const result = await this.hemisService.syncAllEmployees();
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      
      return {
        success: result.success,
        message: `✅ Synced ${result.total} employees in ${duration}s. ❌ Errors: ${result.errors?.length || 0}. 🗑️ Deleted: ${result.deleted || 0}`,
        totalSynced: result.total,
        errors: result.errors,
        deleted: result.deleted,
      };
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      throw new HttpException(
        { success: false, message: `Sync failed after ${duration}s: ${error.message}` },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/student')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Sync single student',
    description: 'Syncs a specific student by HEMIS ID or student ID number. Either hemis_id or student_id_number must be provided.'
  })
  @ApiBody({ type: SyncStudentDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully synced student',
    type: SyncResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - missing required parameters' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Student not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async syncStudent(@Body() dto: SyncStudentDto): Promise<SyncResponseDto> {
    try {
      if (!dto.hemis_id && !dto.student_id_number) {
        throw new HttpException(
          { success: false, message: 'hemis_id or student_id_number is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const student = await this.hemisService.syncStudentById(
        dto.hemis_id || 0,
        dto.student_id_number,
      );

      return {
        success: true,
        message: `Successfully synced student: ${student.full_name}`,
        data: student,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sync/employee')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Sync single employee',
    description: 'Syncs a specific employee by HEMIS ID or employee ID number. Either hemis_id or employee_id_number must be provided.'
  })
  @ApiBody({ type: SyncEmployeeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully synced employee',
    type: SyncResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - missing required parameters' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Employee not found' 
  })
  @ApiResponse({ 
    status: 500, 
    description: 'Internal server error' 
  })
  async syncEmployee(@Body() dto: SyncEmployeeDto): Promise<SyncResponseDto> {
    try {
      if (!dto.hemis_id && !dto.employee_id_number) {
        throw new HttpException(
          { success: false, message: 'hemis_id or employee_id_number is required' },
          HttpStatus.BAD_REQUEST,
        );
      }

      const employee = await this.hemisService.syncEmployeeById(
        dto.hemis_id || 0,
        dto.employee_id_number,
      );

      return {
        success: true,
        message: `Successfully synced employee: ${employee.full_name}`,
        data: employee,
      };
    } catch (error) {
      throw new HttpException(
        { success: false, message: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('progress/students')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Get students sync progress',
    description: 'Returns real-time progress of students sync operation. Shows status, processed records, errors, and current page.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current students sync progress',
    type: ProgressResponse
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 204, 
    description: 'No sync in progress' 
  })
  getStudentsProgress() {
    return this.progressService.getStudentsProgress();
  }

  @Get('progress/employees')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Get employees sync progress',
    description: 'Returns real-time progress of employees sync operation. Shows status, processed records, errors, and current page.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Current employees sync progress',
    type: ProgressResponse
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Admin or Creator role required' 
  })
  @ApiResponse({ 
    status: 204, 
    description: 'No sync in progress' 
  })
  getEmployeesProgress() {
    return this.progressService.getEmployeesProgress();
  }
}

