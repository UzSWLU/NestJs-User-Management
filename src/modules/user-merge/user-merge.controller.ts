import {
  Controller,
  Get,
  Post,
  Body,
  Param,
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
import { UserMergeService } from './user-merge.service';
import { MergeUsersDto } from './dto/merge-users.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('user-merge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user-merge')
export class UserMergeController {
  constructor(private readonly mergeService: UserMergeService) {}

  @Post()
  @Roles('admin', 'creator')
  @ApiOperation({
    summary: 'Merge two user accounts',
    description: 'Merge merged user into main user. Merged user will be soft-deleted.',
  })
  @ApiResponse({
    status: 201,
    description: 'Users merged successfully',
    schema: {
      example: {
        id: 1,
        merged_at: '2025-10-15T12:00:00.000Z',
        main_user: { id: 1, username: 'main_user' },
        merged_user: { id: 2, username: 'duplicate_user' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 400, description: 'Cannot merge user with itself' })
  mergeUsers(@Body() dto: MergeUsersDto) {
    return this.mergeService.mergeUsers(dto);
  }

  @Get()
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Get all merge history records' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() pagination: PaginationDto) {
    return this.mergeService.findAll(pagination);
  }

  @Get(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Get merge history by ID' })
  @ApiResponse({ status: 200, description: 'Merge history found' })
  @ApiResponse({ status: 404, description: 'Merge history not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mergeService.findOne(id);
  }

  @Get('user/:userId')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({ summary: 'Get merge history for a user' })
  @ApiResponse({ status: 200, description: 'User merge history' })
  getUserMergeHistory(@Param('userId', ParseIntPipe) userId: number) {
    return this.mergeService.getUserMergeHistory(userId);
  }
}


