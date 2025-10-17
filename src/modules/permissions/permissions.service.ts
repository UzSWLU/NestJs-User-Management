import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../../database/entities/core/permission.entity';
import { PermissionGroup } from '../../database/entities/core/permission-group.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(PermissionGroup)
    private readonly groupRepo: Repository<PermissionGroup>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<Permission> {
    const existing = await this.permissionRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Permission name already exists');
    }

    const permission = this.permissionRepo.create({
      name: dto.name,
      description: dto.description,
    });

    if (dto.groupId) {
      const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
      if (!group) {
        throw new NotFoundException(`Permission group with ID ${dto.groupId} not found`);
      }
      permission.group = group;
    }

    return this.permissionRepo.save(permission);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Permission>> {
    const [data, total] = await this.permissionRepo.findAndCount({
      skip: pagination.skip,
      take: pagination.take,
      relations: ['group'],
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepo.findOne({
      where: { id },
      relations: ['group'],
    });
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    return permission;
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    
    if (dto.groupId !== undefined) {
      if (dto.groupId === null) {
        permission.group = null;
      } else {
        const group = await this.groupRepo.findOne({ where: { id: dto.groupId } });
        if (!group) {
          throw new NotFoundException(`Permission group with ID ${dto.groupId} not found`);
        }
        permission.group = group;
      }
    }

    Object.assign(permission, { name: dto.name, description: dto.description });
    return this.permissionRepo.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepo.remove(permission);
  }
}

