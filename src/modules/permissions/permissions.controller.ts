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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permission } from '../../database/entities/core/permission.entity';

@ApiTags('Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @Roles('admin', 'creator')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new permission',
    description: 'Creates a new permission with endpoint-based format (e.g., GET /api/users). Only admin and creator roles can create permissions.'
  })
  @ApiBody({ type: CreatePermissionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Permission created successfully',
    type: Permission
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - Permission name already exists' 
  })
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ 
    summary: 'Get all permissions',
    description: 'Retrieves all permissions with optional pagination. Returns a list of endpoint-based permissions (e.g., GET /api/users, POST /api/roles).'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false, 
    type: Number,
    description: 'Page number (default: 1)',
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false, 
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of permissions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/Permission' }
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 50 },
            page: { type: 'number', example: 1 },
            limit: { type: 'number', example: 10 },
            totalPages: { type: 'number', example: 5 }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  findAll(@Query() pagination: PaginationDto) {
    return this.permissionsService.findAll(pagination);
  }

  @Get(':id')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ 
    summary: 'Get permission by ID',
    description: 'Retrieves a single permission by its ID with group information if available.'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number,
    description: 'Permission ID',
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission found',
    type: Permission
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found' 
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ 
    summary: 'Update permission by ID',
    description: 'Updates an existing permission. Can update name, description, or group.'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number,
    description: 'Permission ID',
    example: 1
  })
  @ApiBody({ type: UpdatePermissionDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission updated successfully',
    type: Permission
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found' 
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'creator')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Delete permission by ID',
    description: 'Permanently deletes a permission. This action cannot be undone.'
  })
  @ApiParam({ 
    name: 'id', 
    type: Number,
    description: 'Permission ID',
    example: 1
  })
  @ApiResponse({ 
    status: 204, 
    description: 'Permission deleted successfully' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or missing token' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have required role' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Permission not found' 
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.remove(id);
  }
}

