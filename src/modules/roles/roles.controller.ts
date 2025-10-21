import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Create a new role',
    description: 'Create a new role with optional permissions. Permissions can be added later via PATCH endpoint.',
  })
  @ApiBody({
    type: CreateRoleDto,
    examples: {
      minimal: {
        summary: 'Minimal (name only)',
        value: {
          name: 'student',
        },
      },
      withDescription: {
        summary: 'With description',
        value: {
          name: 'teacher',
          description: 'Teacher role with course management access',
        },
      },
      withPermissions: {
        summary: 'With permissions (optional)',
        value: {
          name: 'moderator',
          description: 'Content moderator',
          is_system: false,
          permissionIds: [1, 2, 3],
        },
      },
    },
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    schema: {
      example: {
        id: 5,
        name: 'student',
        description: 'Student role',
        is_system: false,
        created_at: '2025-10-16T12:00:00.000Z',
        updated_at: '2025-10-16T12:00:00.000Z',
        permissions: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  @ApiResponse({ status: 409, description: 'Role name already exists' })
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ 
    summary: 'Get all roles with pagination',
    description: 'Retrieve a paginated list of all roles with their permissions.',
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number, 
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number, 
    example: 10,
    description: 'Number of items per page',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            name: 'creator',
            description: 'System creator with full access',
            is_system: true,
            permissions: [
              { id: 1, permission: { id: 1, name: 'GET /api/users' } },
              { id: 2, permission: { id: 2, name: 'POST /api/users' } },
            ],
          },
        ],
        meta: {
          total: 5,
          page: 1,
          limit: 10,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: false,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Creator, or Manager role required' })
  findAll(@Query() pagination: PaginationDto) {
    return this.rolesService.findAll(pagination);
  }

  @Get(':id')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ 
    summary: 'Get role by ID',
    description: 'Retrieve a specific role with all its permissions.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 1,
    description: 'Role ID',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role found',
    schema: {
      example: {
        id: 1,
        name: 'creator',
        description: 'System creator with full access',
        is_system: true,
        created_at: '2025-10-15T05:46:34.088Z',
        updated_at: '2025-10-15T05:46:34.088Z',
        permissions: [
          { id: 1, permission: { id: 1, name: 'GET /api/users', description: 'View users list' } },
          { id: 2, permission: { id: 2, name: 'POST /api/users', description: 'Create new user' } },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin, Creator, or Manager role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Update role by ID',
    description: 'Update role details and/or assign permissions. All fields are optional.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Role ID to update',
  })
  @ApiBody({
    type: UpdateRoleDto,
    examples: {
      updateName: {
        summary: 'Update name only',
        value: {
          name: 'senior_student',
        },
      },
      updateDescription: {
        summary: 'Update description',
        value: {
          description: 'Updated description for student role',
        },
      },
      assignPermissions: {
        summary: 'Assign permissions',
        value: {
          permissionIds: [1, 2, 3, 4],
        },
      },
      fullUpdate: {
        summary: 'Update all fields',
        value: {
          name: 'advanced_student',
          description: 'Advanced student with extended access',
          permissionIds: [1, 2, 3],
        },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role updated successfully',
    schema: {
      example: {
        id: 5,
        name: 'student',
        description: 'Updated description',
        is_system: false,
        permissions: [
          { id: 1, permission: { id: 1, name: 'GET /api/users' } },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Delete role by ID',
    description: 'Delete a role. System roles (is_system=true) cannot be deleted.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    example: 5,
    description: 'Role ID to delete',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Role deleted successfully',
    schema: {
      example: {
        message: 'Role deleted successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Login required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin or Creator role required' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete system role' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.remove(id);
  }
}

