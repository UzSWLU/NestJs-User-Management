import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMergeHistory } from '../../database/entities/oauth/user-merge-history.entity';
import { User } from '../../database/entities/core/user.entity';
import { MergeUsersDto } from './dto/merge-users.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class UserMergeService {
  constructor(
    @InjectRepository(UserMergeHistory)
    private readonly mergeHistoryRepo: Repository<UserMergeHistory>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    // Create merge history record
    const mergeHistory = this.mergeHistoryRepo.create({
      main_user: mainUser,
      merged_user: mergedUser,
    });
    const saved = await this.mergeHistoryRepo.save(mergeHistory);

    // Soft delete merged user
    mergedUser.deleted_at = new Date();
    await this.userRepo.save(mergedUser);

    console.log(`✅ User ${dto.mergedUserId} merged into ${dto.mainUserId}`);

    return saved;
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


