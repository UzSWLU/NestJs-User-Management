import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../database/entities/core/role.entity';
import { RolePermission } from '../../database/entities/core/role-permission.entity';
import { Permission } from '../../database/entities/core/permission.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.roleRepo.findOne({ where: { name: dto.name } });
    if (existing) {
      throw new ConflictException('Role name already exists');
    }

    const role = this.roleRepo.create({
      name: dto.name,
      description: dto.description,
      is_system: dto.is_system || false,
    });
    const savedRole = await this.roleRepo.save(role);

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.assignPermissions(savedRole.id, dto.permissionIds);
    }

    return this.findOne(savedRole.id);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<Role>> {
    const [data, total] = await this.roleRepo.findAndCount({
      skip: pagination.skip,
      take: pagination.take,
      relations: ['permissions', 'permissions.permission'],
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id },
      relations: ['permissions', 'permissions.permission'],
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, { name: dto.name, description: dto.description });
    await this.roleRepo.save(role);

    if (dto.permissionIds !== undefined) {
      await this.rolePermissionRepo.delete({ role: { id } });
      if (dto.permissionIds.length > 0) {
        await this.assignPermissions(id, dto.permissionIds);
      }
    }

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const role = await this.findOne(id);
    if (role.is_system) {
      throw new ConflictException('Cannot delete system role');
    }
    await this.roleRepo.remove(role);
  }

  private async assignPermissions(roleId: number, permissionIds: number[]): Promise<void> {
    const permissions = await this.permissionRepo.findBy({ id: In(permissionIds) });
    const rolePermissions = permissions.map((perm) =>
      this.rolePermissionRepo.create({ role: { id: roleId } as Role, permission: perm }),
    );
    await this.rolePermissionRepo.save(rolePermissions);
  }
}





