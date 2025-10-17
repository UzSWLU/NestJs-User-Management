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
import { OAuthProvidersService } from './oauth-providers.service';
import { CreateOAuthProviderDto } from './dto/create-oauth-provider.dto';
import { UpdateOAuthProviderDto } from './dto/update-oauth-provider.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('oauth-providers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('oauth-providers')
export class OAuthProvidersController {
  constructor(private readonly providersService: OAuthProvidersService) {}

  @Public()
  @Get('active')
  @ApiOperation({
    summary: 'Get all ACTIVE OAuth providers (public)',
    description:
      'Returns list of active OAuth providers available for authentication. No authentication required.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active providers returned successfully',
  })
  async getActiveProviders() {
    return this.providersService.findActive();
  }

  @Post()
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Create OAuth provider configuration' })
  @ApiResponse({ status: 201, description: 'OAuth provider created successfully' })
  @ApiResponse({ status: 409, description: 'Provider name already exists' })
  create(@Body() dto: CreateOAuthProviderDto) {
    return this.providersService.create(dto);
  }

  @Get()
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get all OAuth providers with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status (true/false)',
  })
  findAll(
    @Query() pagination: PaginationDto,
    @Query('is_active') isActive?: string,
  ) {
    const activeFilter = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.providersService.findAll(pagination, activeFilter);
  }

  @Get(':id')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get OAuth provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider found' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Update OAuth provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider updated successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOAuthProviderDto,
  ) {
    return this.providersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Delete OAuth provider by ID' })
  @ApiResponse({ status: 200, description: 'Provider deleted successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.remove(id);
  }

  @Patch(':id/toggle-active')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Toggle OAuth provider active status' })
  @ApiResponse({ status: 200, description: 'Provider status toggled' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.toggleActive(id);
  }
}


