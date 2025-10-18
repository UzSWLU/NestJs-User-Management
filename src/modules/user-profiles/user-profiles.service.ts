import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, In } from 'typeorm';
import { UserProfile } from '../../database/entities/oauth/user-profile.entity';
import { UserProfilePreference } from '../../database/entities/oauth/user-profile-preference.entity';
import { User } from '../../database/entities/core/user.entity';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';

@Injectable()
export class UserProfilesService {
  constructor(
    @InjectRepository(UserProfile)
    private readonly profileRepo: Repository<UserProfile>,
    @InjectRepository(UserProfilePreference)
    private readonly preferenceRepo: Repository<UserProfilePreference>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserMergeHistory)
    private readonly mergeHistoryRepo: Repository<UserMergeHistory>,
  ) {}

  /**
   * Get current user's primary profile from user_profile_preferences
   */
  async getMyProfile(userId: number): Promise<UserProfile | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deleted_at: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get primary_profile_id from user_profile_preferences
    const preference = await this.preferenceRepo.findOne({
      where: { user: { id: userId }, key: 'primary_profile_id' },
    });

    let primaryProfile: UserProfile | null = null;
    
    if (preference && preference.value) {
      const profileId = parseInt(preference.value);
      primaryProfile = await this.profileRepo.findOne({
        where: { id: profileId },
        relations: ['user'],
      });
    }

    // If no primary profile in preferences, get the first profile
    if (!primaryProfile) {
      // Get all merged user IDs
      const mergeHistory = await this.mergeHistoryRepo.find({
        where: { main_user: { id: userId } },
        relations: ['main_user', 'merged_user'],
      });
      
      const mergedUserIds = mergeHistory.map(h => h.merged_user.id);
      const allUserIds = [userId, ...mergedUserIds];

      const profiles = await this.profileRepo.find({
        where: { user: { id: In(allUserIds) } },
        relations: ['user'],
        order: { created_at: 'ASC' },
        take: 1,
      });

      if (profiles.length > 0) {
        primaryProfile = profiles[0];
      }
    }

    console.log(`👤 Primary profile: ${primaryProfile?.id || 'none'} for user ${userId}`);

    return primaryProfile;
  }

  /**
   * Get all profiles for current user (including merged accounts)
   */
  async getAllMyProfiles(userId: number): Promise<UserProfile[]> {
    // Get all merged user IDs
    const mergeHistory = await this.mergeHistoryRepo.find({
      where: { main_user: { id: userId } },
      relations: ['main_user', 'merged_user'],
    });
    
    const mergedUserIds = mergeHistory.map(h => h.merged_user.id);
    const allUserIds = [userId, ...mergedUserIds];
    
    console.log(`📋 Getting all profiles for users: ${allUserIds.join(', ')}`);

    // Get all profiles for all users (main + merged)
    const profiles = await this.profileRepo.find({
      where: { user: { id: In(allUserIds) } },
      relations: ['user'],
      order: { created_at: 'ASC' },
    });

    console.log(`✅ Found ${profiles.length} total profiles`);

    return profiles;
  }

  /**
   * Set primary profile (save to user_profile_preferences)
   */
  async setPreference(
    userId: number,
    profileId: number,
  ): Promise<{ message: string; primaryProfile: UserProfile }> {
    const user = await this.userRepo.findOne({
      where: { id: userId, deleted_at: IsNull() },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get all merged user IDs to check if profile belongs to user or merged accounts
    const mergeHistory = await this.mergeHistoryRepo.find({
      where: { main_user: { id: userId } },
      relations: ['main_user', 'merged_user'],
    });
    
    const mergedUserIds = mergeHistory.map(h => h.merged_user.id);
    const allUserIds = [userId, ...mergedUserIds];

    // Check if profile exists and belongs to user or merged accounts
    const profile = await this.profileRepo.findOne({
      where: { 
        id: profileId,
        user: { id: In(allUserIds) }
      },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found or access denied');
    }

    // Save to user_profile_preferences
    let preference = await this.preferenceRepo.findOne({
      where: { user: { id: userId }, key: 'primary_profile_id' },
    });

    if (preference) {
      // Update existing preference
      preference.value = profileId.toString();
      await this.preferenceRepo.save(preference);
      console.log(`✅ Updated primary_profile_id preference to ${profileId} for user ${userId}`);
    } else {
      // Create new preference
      preference = this.preferenceRepo.create({
        user: user,
        key: 'primary_profile_id',
        value: profileId.toString(),
      });
      await this.preferenceRepo.save(preference);
      console.log(`✅ Created primary_profile_id preference = ${profileId} for user ${userId}`);
    }

    // Also update user.primary_profile_id for backward compatibility
    user.primary_profile_id = profileId;
    await this.userRepo.save(user);

    return { 
      message: 'Primary profile updated successfully',
      primaryProfile: profile
    };
  }

}

