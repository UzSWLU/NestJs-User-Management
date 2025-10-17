import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { User } from '../../database/entities/core/user.entity';
import { Role } from '../../database/entities/core/role.entity';
import { UserRole } from '../../database/entities/core/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { PaginationDto, PaginatedResponse } from '../../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existing) {
      throw new ConflictException('Username or email already exists');
    }

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      ...dto,
      password_hash,
      status: dto.status || 'pending',
    });
    return this.userRepo.save(user);
  }

  async findAll(pagination: PaginationDto): Promise<PaginatedResponse<User>> {
    const [data, total] = await this.userRepo.findAndCount({
      where: { 
        deleted_at: IsNull(), // Exclude soft deleted users
        status: In(['active', 'pending']), // Exclude blocked users (merged users)
      },
      skip: pagination.skip,
      take: pagination.take,
      relations: ['roles', 'roles.role'],
      order: { id: 'ASC' },
    });
    return new PaginatedResponse(data, total, pagination.page!, pagination.limit!);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, deleted_at: IsNull() }, // Exclude soft deleted users
      relations: ['roles', 'roles.role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found or has been deleted`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    if (dto.password) {
      dto['password_hash'] = await bcrypt.hash(dto.password, 10);
      delete dto.password;
    }
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepo.softRemove(user);
  }

  async assignRole(userId: number, roleId: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.role'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    // Check if role already assigned
    const existingUserRole = await this.userRoleRepo.findOne({
      where: { user: { id: userId }, role: { id: roleId } },
    });
    if (existingUserRole) {
      throw new ConflictException('Role already assigned to this user');
    }

    const userRole = this.userRoleRepo.create({ user, role });
    await this.userRoleRepo.save(userRole);

    return this.findOne(userId);
  }

  async removeRole(userId: number, roleId: number): Promise<User> {
    const user = await this.findOne(userId);

    const userRole = await this.userRoleRepo.findOne({
      where: { user: { id: userId }, role: { id: roleId } },
    });

    if (!userRole) {
      throw new NotFoundException('Role not assigned to this user');
    }

    await this.userRoleRepo.remove(userRole);

    return this.findOne(userId);
  }

  async getUserRoles(userId: number): Promise<User> {
    return this.findOne(userId);
  }
}

