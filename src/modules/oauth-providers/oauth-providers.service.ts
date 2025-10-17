import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { CreateOAuthProviderDto } from './dto/create-oauth-provider.dto';
import { UpdateOAuthProviderDto } from './dto/update-oauth-provider.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class OAuthProvidersService {
  constructor(
    @InjectRepository(OAuthProvider)
    private readonly providerRepo: Repository<OAuthProvider>,
  ) {}

  async create(dto: CreateOAuthProviderDto): Promise<OAuthProvider> {
    const existing = await this.providerRepo.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('OAuth provider name already exists');
    }

    const provider = this.providerRepo.create(dto);
    return this.providerRepo.save(provider);
  }

  async findAll(
    pagination: PaginationDto,
    isActive?: boolean,
  ): Promise<PaginatedResponse<OAuthProvider>> {
    const where = isActive !== undefined ? { is_active: isActive } : {};

    const [data, total] = await this.providerRepo.findAndCount({
      where,
      skip: pagination.skip,
      take: pagination.take,
      order: { created_at: 'DESC' },
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findActive(): Promise<OAuthProvider[]> {
    return this.providerRepo.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
      select: ['id', 'name', 'auth_type', 'is_active', 'created_at'], // Don't expose sensitive data
    });
  }

  async findOne(id: number): Promise<OAuthProvider> {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) {
      throw new NotFoundException(`OAuth provider with ID ${id} not found`);
    }
    return provider;
  }

  async update(id: number, dto: UpdateOAuthProviderDto): Promise<OAuthProvider> {
    const provider = await this.findOne(id);
    Object.assign(provider, dto);
    return this.providerRepo.save(provider);
  }

  async remove(id: number): Promise<void> {
    const provider = await this.findOne(id);
    await this.providerRepo.remove(provider);
  }

  async toggleActive(id: number): Promise<OAuthProvider> {
    const provider = await this.findOne(id);
    provider.is_active = !provider.is_active;
    return this.providerRepo.save(provider);
  }
}


