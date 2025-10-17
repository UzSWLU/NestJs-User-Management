import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAutoRoleRule } from '../../database/entities/oauth/user-auto-role-rule.entity';
import { OAuthProvider } from '../../database/entities/oauth/oauth-provider.entity';
import { Role } from '../../database/entities/core/role.entity';
import { CreateAutoRoleRuleDto } from './dto/create-auto-role-rule.dto';
import { UpdateAutoRoleRuleDto } from './dto/update-auto-role-rule.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class AutoRoleRulesService {
  constructor(
    @InjectRepository(UserAutoRoleRule)
    private readonly ruleRepo: Repository<UserAutoRoleRule>,
    @InjectRepository(OAuthProvider)
    private readonly providerRepo: Repository<OAuthProvider>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateAutoRoleRuleDto): Promise<UserAutoRoleRule> {
    const provider = await this.providerRepo.findOne({
      where: { id: dto.providerId },
    });
    if (!provider) {
      throw new NotFoundException(`OAuth provider with ID ${dto.providerId} not found`);
    }

    const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
    }

    const rule = this.ruleRepo.create({
      provider,
      role,
      rule_name: dto.rule_name,
      condition_field: dto.condition_field,
      condition_operator: dto.condition_operator || 'contains',
      condition_value: dto.condition_value,
    });

    return this.ruleRepo.save(rule);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<UserAutoRoleRule>> {
    const [data, total] = await this.ruleRepo.findAndCount({
      skip: pagination.skip,
      take: pagination.take,
      relations: ['provider', 'role'],
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: number): Promise<UserAutoRoleRule> {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['provider', 'role'],
    });
    if (!rule) {
      throw new NotFoundException(`Auto role rule with ID ${id} not found`);
    }
    return rule;
  }

  async update(id: number, dto: UpdateAutoRoleRuleDto): Promise<UserAutoRoleRule> {
    const rule = await this.findOne(id);

    if (dto.providerId !== undefined) {
      const provider = await this.providerRepo.findOne({
        where: { id: dto.providerId },
      });
      if (!provider) {
        throw new NotFoundException(`OAuth provider with ID ${dto.providerId} not found`);
      }
      rule.provider = provider;
    }

    if (dto.roleId !== undefined) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (!role) {
        throw new NotFoundException(`Role with ID ${dto.roleId} not found`);
      }
      rule.role = role;
    }

    Object.assign(rule, {
      condition_field: dto.condition_field,
      condition_value: dto.condition_value,
    });

    return this.ruleRepo.save(rule);
  }

  async remove(id: number): Promise<void> {
    const rule = await this.findOne(id);
    await this.ruleRepo.remove(rule);
  }

  async getRulesByProvider(providerId: number): Promise<UserAutoRoleRule[]> {
    return this.ruleRepo.find({
      where: { provider: { id: providerId } },
      relations: ['provider', 'role'],
    });
  }
}


