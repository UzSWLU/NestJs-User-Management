import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HemisStudent } from '../../database/entities/hemis/student.entity';
import { HemisEmployee } from '../../database/entities/hemis/employee.entity';
import { HemisController } from './hemis.controller';
import { HemisService } from './hemis.service';
import { HemisApiService } from './hemis-api.service';
import { HemisScheduleService } from './hemis-schedule.service';
import { HemisProgressService } from './hemis-progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([HemisStudent, HemisEmployee])],
  controllers: [HemisController],
  providers: [HemisService, HemisApiService, HemisScheduleService, HemisProgressService],
  exports: [HemisService],
})
export class HemisModule {}

