import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OAuthAccountsService } from './oauth-accounts.service';
import { LinkOAuthAccountDto } from './dto/link-oauth-account.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('oauth-accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('oauth-accounts')
export class OAuthAccountsController {
  constructor(private readonly accountsService: OAuthAccountsService) {}

  @Get('user/:userId')
  @Roles('admin', 'creator', 'manager')
  @ApiOperation({
    summary: 'Get all OAuth accounts for a user',
    description: 'Retrieve all linked OAuth accounts for the specified user',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth accounts retrieved successfully',
    schema: {
      example: [
        {
          id: 1,
          provider_user_id: '123456789',
          linked_at: '2025-10-15T12:00:00.000Z',
          provider: {
            id: 1,
            name: 'google',
            is_active: true,
          },
        },
      ],
    },
  })
  getUserAccounts(@Param('userId', ParseIntPipe) userId: number) {
    return this.accountsService.getUserAccounts(userId);
  }

  @Post('user/:userId/link')
  @Roles('admin', 'creator')
  @ApiOperation({
    summary: 'Link OAuth account to user',
    description: 'Link an OAuth provider account to the specified user',
  })
  @ApiResponse({ status: 201, description: 'OAuth account linked successfully' })
  @ApiResponse({ status: 404, description: 'User or provider not found' })
  @ApiResponse({ status: 409, description: 'OAuth account already linked' })
  linkAccount(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: LinkOAuthAccountDto,
  ) {
    return this.accountsService.linkAccount(userId, dto);
  }

  @Delete('user/:userId/accounts/:accountId')
  @Roles('admin', 'creator')
  @ApiOperation({
    summary: 'Unlink OAuth account from user',
    description: 'Remove OAuth account link from the user',
  })
  @ApiResponse({ status: 200, description: 'OAuth account unlinked successfully' })
  @ApiResponse({ status: 404, description: 'OAuth account not found' })
  unlinkAccount(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('accountId', ParseIntPipe) accountId: number,
  ) {
    return this.accountsService.unlinkAccount(userId, accountId);
  }

  @Get()
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Get all OAuth accounts (all users)' })
  @ApiResponse({ status: 200, description: 'All OAuth accounts' })
  findAll() {
    return this.accountsService.findAll();
  }
}





