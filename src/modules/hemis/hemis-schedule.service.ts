import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HemisService } from './hemis.service';

@Injectable()
export class HemisScheduleService {
  private readonly logger = new Logger(HemisScheduleService.name);

  constructor(
    private hemisService: HemisService,
    private configService: ConfigService,
  ) {}

  /**
   * Run sync every day at 01:00 AM (UTC)
   * To change time, update HEMIS_SYNC_CRON in .env file
   * Example: HEMIS_SYNC_CRON=0 2 * * *  (for 02:00 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailySync() {
    const startTime = Date.now();
    const cronExpression = this.configService.get<string>(
      'HEMIS_SYNC_CRON',
      '0 1 * * *', // Default: Every day at 01:00 AM UTC
    );
    
    this.logger.log('🌙 ========================================');
    this.logger.log('🌙 Starting scheduled HEMIS sync...');
    this.logger.log(`🌙 Cron: ${cronExpression}`);
    this.logger.log('🌙 ========================================');

    try {
      // Sync students
      this.logger.log('📚 Syncing students...');
      const studentResult = await this.hemisService.syncAllStudents();
      const studentErrors = studentResult.errors?.length || 0;
      
      this.logger.log(`✅ Students completed: ${studentResult.total} records. ❌ Errors: ${studentErrors}`);

      if (studentResult.errors && studentResult.errors.length > 0) {
        this.logger.warn('⚠️  Student sync errors:', JSON.stringify(studentResult.errors));
      }

      // Wait 5 seconds before syncing employees
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Sync employees
      this.logger.log('👔 Syncing employees...');
      const employeeResult = await this.hemisService.syncAllEmployees();
      const employeeErrors = employeeResult.errors?.length || 0;
      
      this.logger.log(`✅ Employees completed: ${employeeResult.total} records. ❌ Errors: ${employeeErrors}`);

      if (employeeResult.errors && employeeResult.errors.length > 0) {
        this.logger.warn('⚠️  Employee sync errors:', JSON.stringify(employeeResult.errors));
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);

      this.logger.log('🌙 ========================================');
      this.logger.log(`🎉 Daily HEMIS sync completed in ${duration} minutes`);
      this.logger.log(`📊 Students: ${studentResult.total} synced, ${studentErrors} errors`);
      this.logger.log(`📊 Employees: ${employeeResult.total} synced, ${employeeErrors} errors`);
      this.logger.log(`📊 Total: ${studentResult.total + employeeResult.total} records`);
      this.logger.log('🌙 ========================================');

      return {
        success: true,
        duration: `${duration} minutes`,
        students: {
          total: studentResult.total,
          errors: studentErrors,
        },
        employees: {
          total: employeeResult.total,
          errors: employeeErrors,
        },
      };
    } catch (error) {
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
      
      this.logger.error('💥 ========================================');
      this.logger.error(`💥 Daily HEMIS sync FAILED after ${duration} minutes`);
      this.logger.error(`💥 Error: ${error.message}`);
      this.logger.error(`💥 Stack: ${error.stack}`);
      this.logger.error('💥 ========================================');
      
      throw error;
    }
  }

  /**
   * Manual sync method that can be called from controller
   */
  async triggerManualSync(): Promise<any> {
    this.logger.log('Starting manual HEMIS sync...');
    return await this.handleDailySync();
  }
}

