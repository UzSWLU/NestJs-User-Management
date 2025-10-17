import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMergeService } from './user-merge.service';
import { UserMergeController } from './user-merge.controller';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';
import { User } from '../../database/entities/core/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserMergeHistory, User])],
  controllers: [UserMergeController],
  providers: [UserMergeService],
  exports: [UserMergeService],
})
export class UserMergeModule {}


