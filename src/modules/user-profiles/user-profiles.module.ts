import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfilesController } from './user-profiles.controller';
import { UserProfilesService } from './user-profiles.service';
import { UserProfile } from '../../database/entities/oauth/user-profile.entity';
import { UserProfilePreference } from '../../database/entities/oauth/user-profile-preference.entity';
import { User } from '../../database/entities/core/user.entity';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProfile,
      UserProfilePreference,
      User,
      UserMergeHistory,
    ]),
  ],
  controllers: [UserProfilesController],
  providers: [UserProfilesService],
  exports: [UserProfilesService],
})
export class UserProfilesModule {}

