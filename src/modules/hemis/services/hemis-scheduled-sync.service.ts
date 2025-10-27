import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HemisSyncService } from './hemis-sync.service';

@Injectable()
export class HemisScheduledSyncService {
  private readonly logger = new Logger(HemisScheduledSyncService.name);

  constructor(private readonly hemisSyncService: HemisSyncService) {}

  /**
   * Daily scheduled sync for students at 01:00 AM
   */
  @Cron('0 1 * * *', {
    name: 'hemis-student-sync',
    timeZone: 'Asia/Tashkent',
  })
  async handleDailyStudentSync() {
    this.logger.log('Starting scheduled student sync at 01:00 AM');
    try {
      await this.hemisSyncService.syncStudents();
      this.logger.log('Scheduled student sync completed successfully');
    } catch (error) {
      this.logger.error(`Scheduled student sync failed: ${error.message}`);
    }
  }

  /**
   * Daily scheduled sync for employees at 01:05 AM (5 minutes after students)
   */
  @Cron('0 1 * * *', {
    name: 'hemis-employee-sync',
    timeZone: 'Asia/Tashkent',
  })
  async handleDailyEmployeeSync() {
    this.logger.log('Starting scheduled employee sync at 01:00 AM');
    try {
      await this.hemisSyncService.syncEmployees();
      this.logger.log('Scheduled employee sync completed successfully');
    } catch (error) {
      this.logger.error(`Scheduled employee sync failed: ${error.message}`);
    }
  }
}
