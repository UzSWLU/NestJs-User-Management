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
} from '@nestjs/swagger';
import { AutoRoleRulesService } from './auto-role-rules.service';
import { CreateAutoRoleRuleDto } from './dto/create-auto-role-rule.dto';
import { UpdateAutoRoleRuleDto } from './dto/update-auto-role-rule.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('auto-role-rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auto-role-rules')
export class AutoRoleRulesController {
  constructor(private readonly rulesService: AutoRoleRulesService) {}

  @Post()
  @Roles('admin', 'creator')
  @ApiOperation({
    summary: 'Create auto role assignment rule',
    description: 'Create a rule to automatically assign roles based on OAuth provider conditions',
  })
  @ApiResponse({
    status: 201,
    description: 'Rule created successfully',
    schema: {
      example: {
        id: 1,
        condition_field: 'email',
        condition_value: '@example.com',
        created_at: '2025-10-15T12:00:00.000Z',
        provider: { id: 1, name: 'google' },
        role: { id: 3, name: 'manager' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Provider or role not found' })
  create(@Body() dto: CreateAutoRoleRuleDto) {
    return this.rulesService.create(dto);
  }

  @Get()
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get all auto role rules with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() pagination: PaginationDto) {
    return this.rulesService.findAll(pagination);
  }

  @Get(':id')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get auto role rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule found' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.rulesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Update auto role rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAutoRoleRuleDto,
  ) {
    return this.rulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Delete auto role rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.rulesService.remove(id);
  }

  @Get('provider/:providerId')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get rules by OAuth provider' })
  @ApiResponse({ status: 200, description: 'Rules for provider' })
  getRulesByProvider(@Param('providerId', ParseIntPipe) providerId: number) {
    return this.rulesService.getRulesByProvider(providerId);
  }
}


