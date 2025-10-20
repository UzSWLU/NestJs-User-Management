import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserOAuthAccount } from '../../database/entities/oauth/user-oauth-account.entity';
import { User } from '../../database/entities/core/user.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { LinkOAuthAccountDto } from './dto/link-oauth-account.dto';

@Injectable()
export class OAuthAccountsService {
  constructor(
    @InjectRepository(UserOAuthAccount)
    private readonly accountRepo: Repository<UserOAuthAccount>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(OAuthProvider)
    private readonly providerRepo: Repository<OAuthProvider>,
  ) {}

  async linkAccount(userId: number, dto: LinkOAuthAccountDto): Promise<UserOAuthAccount> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const provider = await this.providerRepo.findOne({
      where: { id: dto.providerId },
    });
    if (!provider) {
      throw new NotFoundException(`OAuth provider with ID ${dto.providerId} not found`);
    }

    // Check if already linked
    const existing = await this.accountRepo.findOne({
      where: {
        provider: { id: dto.providerId },
        provider_user_id: dto.provider_user_id,
      },
    });
    if (existing) {
      throw new ConflictException('OAuth account already linked');
    }

    const account = this.accountRepo.create({
      user,
      provider,
      provider_user_id: dto.provider_user_id,
      access_token: dto.access_token,
      refresh_token: dto.refresh_token,
      expires_at: dto.expires_at,
    });

    return this.accountRepo.save(account);
  }

  async getUserAccounts(userId: number): Promise<UserOAuthAccount[]> {
    return this.accountRepo.find({
      where: { user: { id: userId } },
      relations: ['provider'],
    });
  }

  async unlinkAccount(userId: number, accountId: number): Promise<void> {
    const account = await this.accountRepo.findOne({
      where: { id: accountId, user: { id: userId } },
    });

    if (!account) {
      throw new NotFoundException('OAuth account not found for this user');
    }

    await this.accountRepo.remove(account);
  }

  async findAll(): Promise<UserOAuthAccount[]> {
    return this.accountRepo.find({
      relations: ['user', 'provider'],
    });
  }
}




