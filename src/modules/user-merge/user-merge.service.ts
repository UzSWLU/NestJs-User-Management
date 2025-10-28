import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';
import { User } from '../../database/entities/core/user.entity';
import { UserAuditLog } from '../../database/entities/auth/user-audit-log.entity';
import { MergeUsersDto } from './dto/merge-users.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class UserMergeService {
  constructor(
    @InjectRepository(UserMergeHistory)
    private readonly mergeHistoryRepo: Repository<UserMergeHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserAuditLog)
    private readonly auditLogRepo: Repository<UserAuditLog>,
  ) {}

  async mergeUsers(dto: MergeUsersDto): Promise<UserMergeHistory> {
    if (dto.mainUserId === dto.mergedUserId) {
      throw new BadRequestException('Cannot merge user with itself');
    }

    const mainUser = await this.userRepo.findOne({
      where: { id: dto.mainUserId },
    });
    if (!mainUser) {
      throw new NotFoundException(`Main user with ID ${dto.mainUserId} not found`);
    }

    const mergedUser = await this.userRepo.findOne({
      where: { id: dto.mergedUserId },
    });
    if (!mergedUser) {
      throw new NotFoundException(`Merged user with ID ${dto.mergedUserId} not found`);
    }

    // Check if merge history already exists (to prevent duplicates)
    const existingMerge = await this.mergeHistoryRepo.findOne({
      where: {
        main_user: { id: dto.mainUserId },
        merged_user: { id: dto.mergedUserId },
      },
    });

    if (existingMerge) {
      throw new BadRequestException(
        `User ${dto.mergedUserId} is already merged to user ${dto.mainUserId}`,
      );
    }

    // Create merge history record
    const mergeHistory = this.mergeHistoryRepo.create({
      main_user: mainUser,
      merged_user: mergedUser,
    });
    const saved = await this.mergeHistoryRepo.save(mergeHistory);

    // Block merged user (NOT soft delete - user saqlanadi!)
    // IMPORTANT: Only change status, keep deleted_at as NULL!
    mergedUser.status = 'blocked';
    // Explicitly ensure deleted_at remains NULL
    // Note: TypeORM nullable fields can be null even if TypeScript type is Date
    if (mergedUser.deleted_at != null) {
      (mergedUser as any).deleted_at = null;
    }
    await this.userRepo.save(mergedUser);

    // Log merge event for both users
    await this.logAudit(
      mainUser,
      'user_merge',
      `Merged user ${mergedUser.id} (${mergedUser.username}) into this account`,
    );
    await this.logAudit(
      mergedUser,
      'user_merged',
      `This account was merged into user ${mainUser.id} (${mainUser.username})`,
    );

    console.log(`✅ User ${dto.mergedUserId} merged into ${dto.mainUserId}`);

    return saved;
  }

  private async logAudit(
    user: User,
    eventType: 'user_merge' | 'user_merged',
    description: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const auditLog = this.auditLogRepo.create({
      user,
      event_type: eventType,
      description,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
    await this.auditLogRepo.save(auditLog);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<UserMergeHistory>> {
    const [data, total] = await this.mergeHistoryRepo.findAndCount({
      skip: pagination.skip,
      take: pagination.take,
      relations: ['main_user', 'merged_user'],
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: number): Promise<UserMergeHistory> {
    const merge = await this.mergeHistoryRepo.findOne({
      where: { id },
      relations: ['main_user', 'merged_user'],
    });
    if (!merge) {
      throw new NotFoundException(`Merge history with ID ${id} not found`);
    }
    return merge;
  }

  async getUserMergeHistory(userId: number): Promise<UserMergeHistory[]> {
    return this.mergeHistoryRepo.find({
      where: [{ main_user: { id: userId } }, { merged_user: { id: userId } }],
      relations: ['main_user', 'merged_user'],
    });
  }
}


