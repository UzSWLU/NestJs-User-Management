import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategies/local-auth.guard';
import type { Request } from 'express';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with username/email and password. Returns access token and refresh token.',
  })
  @ApiBody({
    type: LoginDto,
    description: 'Login credentials',
    examples: {
      withUsername: {
        summary: 'Login with username',
        value: {
          login: 'john_doe',
          password: 'password123',
        },
      },
      withEmail: {
        summary: 'Login with email',
        value: {
          login: 'john.doe@example.com',
          password: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'john_doe',
          email: 'john.doe@example.com',
          status: 'active',
          last_login_at: '2025-10-15T11:30:28.923Z',
          roles: [
            {
              id: 1,
              assigned_at: '2025-10-15T11:16:13.582Z',
              role: {
                id: 1,
                name: 'creator',
                description: 'System creator with full access',
                is_system: true,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Req() req: Request) {
    const device = req.headers['x-device'] as string;
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];
    const platform = (req.headers['x-platform'] as any) || 'web';

    return this.authService.login(
      req.user as any,
      device,
      ipAddress,
      userAgent,
      platform,
    );
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get authenticated user details with roles and permissions.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        id: 1,
        username: 'john_doe',
        email: 'john.doe@example.com',
        phone: null,
        status: 'active',
        email_verified: false,
        phone_verified: false,
        last_login_at: '2025-10-15T11:30:28.923Z',
        created_at: '2025-10-15T11:16:13.582Z',
        roles: [
          {
            id: 1,
            role: {
              id: 1,
              name: 'creator',
              description: 'System creator with full access',
              is_system: true,
              permissions: [
                {
                  id: 1,
                  permission: {
                    id: 1,
                    name: 'users.read',
                    description: 'View users',
                  },
                },
              ],
            },
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Register new user',
    description:
      'Create a new user account. Username and email must be unique. Returns access token and refresh token.',
  })
  @ApiBody({
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      default: {
        summary: 'Registration example',
        value: {
          username: 'john_doe',
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 1,
          username: 'john_doe',
          email: 'john.doe@example.com',
          status: 'active',
          created_at: '2025-10-15T10:00:00.000Z',
          roles: [
            {
              id: 1,
              assigned_at: '2025-10-15T11:16:13.582Z',
              role: {
                id: 1,
                name: 'creator',
                description: 'System creator with full access',
                is_system: true,
              },
            },
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 409, description: 'Username or email already exists' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const device = req.headers['x-device'] as string;
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];
    const platform = (req.headers['x-platform'] as any) || 'web';

    return this.authService.register(
      dto.username,
      dto.email,
      dto.password,
      device,
      ipAddress,
      userAgent,
      platform,
    );
  }

  @Public()
  @Post('refresh')
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Get a new access token using a valid refresh token. Old token will be revoked.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token',
    examples: {
      default: {
        summary: 'Refresh token example',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully. Old token is now revoked.',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        message: 'Token refreshed successfully',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const device = req.headers['x-device'] as string;
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];
    const platform = (req.headers['x-platform'] as any) || 'web';

    return this.authService.refreshToken(
      dto.refreshToken,
      device,
      ipAddress,
      userAgent,
      platform,
    );
  }

  @Public()
  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description:
      'Logout user by revoking refresh token and terminating session.',
  })
  @ApiBody({
    type: RefreshTokenDto,
    description: 'Refresh token to revoke',
    examples: {
      default: {
        summary: 'Logout example',
        value: {
          refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  async logout(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];

    return this.authService.logout(dto.refreshToken, ipAddress, userAgent);
  }

  @Patch('change-password')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Change user password',
    description:
      'Change current user password. Old password to password history ga saqlanadi.',
  })
  @ApiBody({
    type: ChangePasswordDto,
    description: 'Password change data',
    examples: {
      default: {
        summary: 'Change password example',
        value: {
          oldPassword: 'oldPassword123',
          newPassword: 'NewSecurePass456!',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
    schema: {
      example: {
        message: 'Password changed successfully',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];

    return this.authService.changePassword(
      user.id,
      dto.oldPassword,
      dto.newPassword,
      ipAddress,
      userAgent,
    );
  }
}
