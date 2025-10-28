import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { HemisSyncService } from './services/hemis-sync.service';

@Injectable()
export class HemisScheduler {
  private readonly logger = new Logger(HemisScheduler.name);

  constructor(
    private readonly hemisSyncService: HemisSyncService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sync students daily at 01:00 AM (Asia/Tashkent time)
   * Cron expression: 0 1 * * * = Every day at 01:00
   * This runs at 01:00 AM in Asia/Tashkent timezone (UTC+5)
   */
  @Cron('0 1 * * *', {
    name: 'hemis-students-sync',
    timeZone: 'Asia/Tashkent',
  })
  async handleStudentsSync() {
    this.logger.log('🕐 Starting scheduled students sync (daily at 01:00)...');
    try {
      await this.hemisSyncService.syncStudents();
      this.logger.log('✅ Scheduled students sync completed successfully');
    } catch (error) {
      this.logger.error(`❌ Scheduled students sync failed: ${error.message}`);
      // Don't throw - let the scheduler continue for other scheduled tasks
    }
  }

  /**
   * Sync employees daily at 01:30 AM (Asia/Tashkent time)
   * Cron expression: 30 1 * * * = Every day at 01:30
   * This runs at 01:30 AM in Asia/Tashkent timezone (UTC+5)
   * Runs after students sync to avoid overloading the API
   */
  @Cron('30 1 * * *', {
    name: 'hemis-employees-sync',
    timeZone: 'Asia/Tashkent',
  })
  async handleEmployeesSync() {
    this.logger.log('🕐 Starting scheduled employees sync (daily at 01:30)...');
    try {
      await this.hemisSyncService.syncEmployees();
      this.logger.log('✅ Scheduled employees sync completed successfully');
    } catch (error) {
      this.logger.error(`❌ Scheduled employees sync failed: ${error.message}`);
      // Don't throw - let the scheduler continue for other scheduled tasks
    }
  }

  /**
   * Sync semesters daily at 02:00 AM (Asia/Tashkent time)
   * Cron expression: 0 2 * * * = Every day at 02:00
   * This runs at 02:00 AM in Asia/Tashkent timezone (UTC+5)
   * Runs after employees sync to avoid overloading the API
   */
  @Cron('0 2 * * *', {
    name: 'hemis-semesters-sync',
    timeZone: 'Asia/Tashkent',
  })
  async handleSemestersSync() {
    this.logger.log('🕐 Starting scheduled semesters sync (daily at 02:00)...');
    try {
      await this.hemisSyncService.syncSemesters();
      this.logger.log('✅ Scheduled semesters sync completed successfully');
    } catch (error) {
      this.logger.error(`❌ Scheduled semesters sync failed: ${error.message}`);
      // Don't throw - let the scheduler continue for other scheduled tasks
    }
  }
}

