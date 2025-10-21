import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Get,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { OAuthService } from './services/oauth.service';
import { LocalAuthGuard } from './strategies/local-auth.guard';
import type { Request } from 'express';
import {
  ApiBody,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OAuthCallbackDto } from './dto/oauth-callback.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
  ) {}

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

  @Get('my-role')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user roles and permissions',
    description: 'Get authenticated user roles and their permissions only.',
  })
  @ApiResponse({
    status: 200,
    description: 'User roles and permissions retrieved successfully',
    schema: {
      example: {
        roles: [
          {
            id: 1,
            name: 'creator',
            description: 'System creator with full access',
            is_system: true,
            permissions: [
              {
                id: 1,
                name: 'GET /api/users',
                description: 'View users list',
              },
              {
                id: 2,
                name: 'POST /api/users',
                description: 'Create new user',
              },
              {
                id: 3,
                name: 'PATCH /api/users/:id',
                description: 'Update user',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUserRole(@CurrentUser() user: any) {
    const fullUser = await this.authService.getCurrentUser(user.id);
    
    // Extract only roles and permissions
    const roles = fullUser.roles?.map(userRole => ({
      id: userRole.role.id,
      name: userRole.role.name,
      description: userRole.role.description,
      is_system: userRole.role.is_system,
      permissions: userRole.role.permissions?.map(rolePermission => ({
        id: rolePermission.permission.id,
        name: rolePermission.permission.name,
        description: rolePermission.permission.description,
      })) || [],
    })) || [];
    
    return { roles };
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

  // ========================
  // OAuth Endpoints
  // ========================

  @Public()
  @Get('login/:provider')
  @ApiOperation({
    summary: 'Get OAuth authorization URL',
    description:
      'Returns OAuth provider authorization URL from database. User should open this URL in browser to login. After successful authentication, user will be redirected to front_redirect URL with tokens.',
  })
  @ApiParam({
    name: 'provider',
    description:
      'OAuth provider name (only ACTIVE providers work). Check /api/oauth-providers for available providers.',
    example: 'hemis',
  })
  @ApiResponse({
    status: 200,
    description:
      'Authorization URL and frontend redirect URL returned successfully',
    schema: {
      example: {
        authorizationUrl:
          'https://hemis.uzswlu.uz/oauth/authorize?response_type=code&client_id=4&redirect_uri=http://localhost:3000/api/auth/callback/hemis',
        provider: 'hemis',
        frontendRedirectUrl: 'http://your-frontend.com/auth/success',
        message:
          'Open authorizationUrl in browser to login. After login, you will be redirected to frontendRedirectUrl with tokens.',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'OAuth provider not found or inactive',
  })
  async loginWithOAuth(
    @Param('provider') providerName: string,
    @Query('returnUrl') returnUrl?: string,
  ) {
    // Get provider from database to check front_redirect
    const provider = await this.oauthService['providerRepo'].findOne({
      where: { name: providerName, is_active: true },
    });

    if (!provider) {
      throw new NotFoundException(
        `OAuth provider "${providerName}" not found or inactive`,
      );
    }

    const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/callback/${providerName}`;

    // Determine frontend redirect URL (priority: query param > .env > provider config)
    const frontendCallbackUrls = process.env.FRONTEND_CALLBACK_URL || provider.front_redirect;
    const primaryFrontendUrl = frontendCallbackUrls?.split(',')[0]?.trim();
    const finalRedirectUrl = returnUrl || primaryFrontendUrl;

    // Encode returnUrl in state parameter (so callback can use it)
    const stateData = finalRedirectUrl ? { returnUrl: finalRedirectUrl } : undefined;

    const authUrl = await this.oauthService.getAuthorizationUrl(
      providerName,
      callbackUrl,
      stateData,
    );

    console.log(`🔗 OAuth login requested for ${providerName}`);
    console.log(`📍 Return URL: ${finalRedirectUrl || 'not configured'}`);

    // Return JSON with authorization URL and frontend redirect URL
    return {
      authorizationUrl: authUrl,
      provider: providerName,
      frontendRedirectUrl: finalRedirectUrl || null,
      availableCallbacks: frontendCallbackUrls?.split(',').map((url) => url.trim()) || [],
      message: finalRedirectUrl
        ? 'Open authorizationUrl in browser to login. After login, you will be redirected to frontendRedirectUrl with tokens.'
        : 'Open authorizationUrl in browser to login. Configure front_redirect in provider settings for automatic redirect.',
    };
  }

  @Public()
  @Post('external/:provider')
  @ApiOperation({
    summary: 'Login via External API provider',
    description:
      'Login using external API provider (e.g., Student Portal) with username and password. The backend will authenticate with the external API and create/login user.',
  })
  @ApiParam({
    name: 'provider',
    description:
      'API provider name (only ACTIVE providers with auth_type="api" work). Check /api/oauth-providers for available providers.',
    example: 'student',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        login: {
          type: 'string',
          example: '999211100073',
          description: 'Username, student ID, or any login identifier',
        },
        password: {
          type: 'string',
          example: 'DD7777777',
          description: 'User password',
        },
      },
      required: ['login', 'password'],
    },
    examples: {
      studentPortal: {
        summary: 'Student Portal Login',
        value: {
          login: '999211100073',
          password: 'DD7777777',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful via external API',
    schema: {
      example: {
        accessToken: 'eyJhbGc...',
        refreshToken: 'eyJhbGc...',
        user: {
          id: 10,
          username: 'student_999211100073',
          email: 'student@uzswlu.uz',
          roles: [{ role: { name: 'student' } }],
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 404,
    description: 'Provider not found or not configured as API type',
  })
  async loginViaExternalApi(
    @Param('provider') providerName: string,
    @Body() credentials: { login: string; password: string },
    @Req() req: Request,
  ) {
    const device = req.headers['x-device'] as string;
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];
    const platform = (req.headers['x-platform'] as any) || 'web';

    const result = await this.oauthService.loginViaExternalApi(
      providerName,
      credentials.login,
      credentials.password,
      device,
      ipAddress,
      userAgent,
      platform,
    );

    // Generate JWT tokens
    return this.authService.login(
      result.user,
      device,
      ipAddress,
      userAgent,
      platform,
    );
  }

  @Get('link/:provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link OAuth provider to current user',
    description:
      'Generates OAuth authorization URL to link an OAuth provider account (e.g., HEMIS) to the currently logged-in user. After successful authentication, the OAuth account will be merged with the current user.',
  })
  @ApiParam({
    name: 'provider',
    description:
      'OAuth provider name to link (only ACTIVE OAuth providers work). Check /api/oauth-providers for available providers.',
    example: 'hemis',
  })
  @ApiResponse({
    status: 200,
    description: 'OAuth link URL returned successfully',
    schema: {
      example: {
        authorizationUrl:
          'https://hemis.uzswlu.uz/oauth/authorize?response_type=code&client_id=4&redirect_uri=http://localhost:3000/api/auth/callback/hemis',
        provider: 'hemis',
        message:
          'Open authorizationUrl in browser to link your HEMIS account. After linking, you can login with either method.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Please login first',
  })
  @ApiResponse({
    status: 404,
    description: 'OAuth provider not found or inactive',
  })
  async linkOAuthProvider(
    @Param('provider') providerName: string,
    @CurrentUser() user: any,
  ) {
    // Get provider from database
    const provider = await this.oauthService['providerRepo'].findOne({
      where: { name: providerName, is_active: true },
    });

    if (!provider) {
      throw new NotFoundException(
        `OAuth provider "${providerName}" not found or inactive`,
      );
    }

    // Use same callback URL as login flow (HEMIS requires single registered redirect_uri)
    const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/callback/${providerName}`;

    // Store user ID and flow type in state parameter
    const stateData = { userId: user.id, flow: 'link' };

    const authUrl = await this.oauthService.getAuthorizationUrl(
      providerName,
      callbackUrl,
      stateData,
    );

    return {
      authorizationUrl: authUrl,
      provider: providerName,
      message: `Open authorizationUrl in browser to link your ${providerName.toUpperCase()} account. After linking, you can login with either method.`,
    };
  }

  @Post('link-external/:provider')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Link External API provider to current user',
    description:
      'Link an External API provider account (e.g., Student Portal) to the currently logged-in user. If the external account is already linked to another user, accounts will be merged.',
  })
  @ApiParam({
    name: 'provider',
    description: 'External API provider name (e.g., student)',
    example: 'student',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['login', 'password'],
      properties: {
        login: {
          type: 'string',
          description: 'External API login (student ID, etc.)',
          example: 'student123',
        },
        password: {
          type: 'string',
          description: 'External API password',
          example: 'password123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'External account linked successfully',
    schema: {
      example: {
        success: true,
        message: 'Student account linked successfully',
        user: { id: 1, username: 'main_user' },
      },
    },
  })
  async linkExternalProvider(
    @Param('provider') providerName: string,
    @Body() body: { login: string; password: string },
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    // Get IP and User-Agent
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];

    // Get provider from database
    const provider = await this.oauthService['providerRepo'].findOne({
      where: { name: providerName, is_active: true, auth_type: 'api' },
    });

    if (!provider) {
      throw new NotFoundException(
        `External API provider "${providerName}" not found or not configured as API type`,
      );
    }

    // Authenticate with external API to get raw user data
    if (!provider.url_login) {
      throw new BadRequestException(
        `Provider "${providerName}" does not have login URL configured`,
      );
    }

    try {
      // Call external API
      const axios = require('axios');
      const authResponse = await axios.post(
        provider.url_login,
        {
          login: body.login,
          password: body.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      // Get raw user data
      let externalUserData = authResponse.data.data || authResponse.data;

      // If token provided, fetch user info from resource endpoint
      const accessToken =
        authResponse.data.access_token || authResponse.data.token;
      if (accessToken && provider.url_resource_owner_details) {
        const userInfoResponse = await axios.get(
          provider.url_resource_owner_details,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/json',
            },
          },
        );
        externalUserData = userInfoResponse.data.data || userInfoResponse.data;
      }

      // Link to current user
      await this.oauthService.linkOAuthToUser(
        user.id,
        provider,
        externalUserData,
        ipAddress,
        userAgent,
      );
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new BadRequestException(
          `Invalid credentials for ${providerName}`,
        );
      }
      throw new BadRequestException(
        `Failed to authenticate with ${providerName}: ${error.message}`,
      );
    }

    // Get updated user info
    const updatedUser = await this.authService.getCurrentUser(user.id);

    return {
      success: true,
      message: `${providerName} account linked successfully`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    };
  }

  @Public()
  @ApiExcludeEndpoint() // Hide from Swagger documentation
  @Get('link/callback/:provider')
  async handleOAuthLinkCallback(
    @Param('provider') providerName: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!code) {
      return res.status(400).send('Authorization code is required');
    }

    if (!state) {
      return res.status(400).send('State parameter is required');
    }

    // Decode state to get user ID
    let userId: number;
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
    } catch (error) {
      return res.status(400).send('Invalid state parameter');
    }

    // Use the same callback URL as login flow (HEMIS registered redirect_uri)
    const callbackUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/callback/${providerName}`;

    try {
      // Exchange code for access token
      const tokenData = await this.oauthService.exchangeCodeForToken(
        providerName,
        code,
        callbackUrl,
      );

      // Get user info from provider
      const oauthUserData = await this.oauthService.getUserInfo(
        providerName,
        tokenData.access_token,
      );

      // Get provider
      const provider = await this.oauthService['providerRepo'].findOne({
        where: { name: providerName },
      });

      if (!provider) {
        throw new NotFoundException(
          `OAuth provider "${providerName}" not found`,
        );
      }

      // Get IP and User-Agent
      const ipAddress = (req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress) as string;
      const userAgent = req.headers['user-agent'];

      // Link OAuth account to existing user
      await this.oauthService.linkOAuthToUser(
        userId,
        provider,
        oauthUserData,
        ipAddress,
        userAgent,
      );

      // Get user info for redirect
      const user = await this.authService.getCurrentUser(userId);

      // Check if front_redirect is configured
      if (provider.front_redirect) {
        console.log(
          `🔄 Redirecting to frontend after link: ${provider.front_redirect}`,
        );
        const redirectUrl = new URL(provider.front_redirect);
        redirectUrl.searchParams.set('linked', 'true');
        redirectUrl.searchParams.set('provider', providerName);
        redirectUrl.searchParams.set('userId', user.id.toString());
        redirectUrl.searchParams.set('username', user.username);
        redirectUrl.searchParams.set('email', user.email);
        return res.redirect(redirectUrl.toString());
      }

      // If no front_redirect, return JSON
      return res.json({
        success: true,
        message: `${providerName.toUpperCase()} account linked successfully`,
        provider: providerName,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (error) {
      console.error('OAuth link error:', error);

      // Get provider for front_redirect
      const provider = await this.oauthService['providerRepo'].findOne({
        where: { name: providerName },
      });

      // Redirect to frontend with error if front_redirect is configured
      if (provider?.front_redirect) {
        const redirectUrl = new URL(provider.front_redirect);
        redirectUrl.searchParams.set('linked', 'false');
        redirectUrl.searchParams.set('error', error.message || 'Unknown error');
        redirectUrl.searchParams.set('provider', providerName);
        return res.redirect(redirectUrl.toString());
      }

      // Otherwise return JSON error
      return res.status(400).json({
        success: false,
        message: 'Failed to link OAuth account',
        error: error.message || 'Unknown error occurred',
        provider: providerName,
      });
    }
  }

  @Public()
  @ApiExcludeEndpoint() // Hide from Swagger documentation
  @Get('callback/:provider')
  async handleOAuthCallback(
    @Param('provider') providerName: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri: string,
    @Query('frontend_url') frontendUrl: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Decode state parameter to get returnUrl and flow type
    let stateReturnUrl: string | undefined;
    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        
        // Check if this is a link flow
        if (stateData.flow === 'link' && stateData.userId) {
          // This is a link flow - redirect to link callback handler
          return this.handleOAuthLinkCallback(
            providerName,
            code,
            state,
            req,
            res,
          );
        }
        
        // Extract returnUrl from state (for login flow)
        if (stateData.returnUrl) {
          stateReturnUrl = stateData.returnUrl;
          console.log(`📍 Return URL from state: ${stateReturnUrl}`);
        }
      } catch (error) {
        // Invalid state - continue with normal login flow
        console.warn('Invalid state parameter, continuing with login flow');
      }
    }

    // If no code provided, redirect to login
    if (!code) {
      const loginUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/login/${providerName}`;
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Login Required</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 500px; margin: 0 auto; padding: 40px; background: #f5f5f5; border-radius: 10px; }
            h1 { color: #e74c3c; }
            button { background: #3498db; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 20px; }
            button:hover { background: #2980b9; }
            p { color: #7f8c8d; margin: 20px 0; }
          </style>
          <script>
            setTimeout(() => {
              window.location.href = '${loginUrl}';
            }, 3000);
          </script>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Authorization Required</h1>
            <p>You need to login with ${providerName.toUpperCase()} first.</p>
            <p>Redirecting to login page in 3 seconds...</p>
            <button onclick="window.location.href='${loginUrl}'">
              Login with ${providerName.toUpperCase()} Now
            </button>
          </div>
        </body>
        </html>
      `);
    }

    // Get device info
    const ipAddress = (req.ip ||
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress) as string;
    const userAgent = req.headers['user-agent'];
    const device = req.headers['device'] as string;
    const platform =
      (req.headers['platform'] as 'web' | 'mobile' | 'desktop' | 'api') ||
      'web';

    // Default redirect URI if not provided
    const callbackUrl =
      redirectUri ||
      `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/callback/${providerName}`;

    // Exchange code for access token
    const tokenData = await this.oauthService.exchangeCodeForToken(
      providerName,
      code,
      callbackUrl,
    );

    // Get user info from provider
    const oauthUserData = await this.oauthService.getUserInfo(
      providerName,
      tokenData.access_token,
    );

    // Find provider (ensure it exists)
    const provider = await this.oauthService['providerRepo'].findOne({
      where: { name: providerName },
    });

    if (!provider) {
      throw new NotFoundException(`OAuth provider "${providerName}" not found`);
    }

    // Find or create user
    const user = await this.oauthService.findOrCreateUser(
      provider,
      oauthUserData,
      ipAddress,
      userAgent,
    );

    // Login user (generate JWT tokens)
    const loginResult = await this.authService.login(
      user,
      device,
      ipAddress,
      userAgent,
      platform,
    );

    // Determine redirect URL (priority: state > query param > .env > provider config)
    const envCallbackUrls = process.env.FRONTEND_CALLBACK_URL;
    const primaryEnvUrl = envCallbackUrls?.split(',')[0]?.trim();
    const redirectTarget = stateReturnUrl || frontendUrl || primaryEnvUrl || provider.front_redirect;

    // If frontend redirect URL is configured, redirect with tokens
    if (redirectTarget) {
      console.log(`🔄 Redirecting to frontend: ${redirectTarget}`);
      const redirectUrl = new URL(redirectTarget);
      redirectUrl.searchParams.set('accessToken', loginResult.accessToken);
      redirectUrl.searchParams.set('refreshToken', loginResult.refreshToken);
      redirectUrl.searchParams.set('userId', loginResult.user.id.toString());
      redirectUrl.searchParams.set('username', loginResult.user.username);
      redirectUrl.searchParams.set('email', loginResult.user.email);
      return res.redirect(redirectUrl.toString());
    }

    // Otherwise, return JSON or HTML based on Accept header
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('application/json')) {
      // Return JSON for API clients
      return res.json(loginResult);
    } else {
      // Return HTML page for browser
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Successful</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
            h1 { color: #27ae60; }
            .token-box { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; word-break: break-all; }
            .label { font-weight: bold; color: #2c3e50; }
            .user-info { background: #e8f5e9; padding: 15px; border-radius: 5px; margin-top: 20px; }
            button { background: #3498db; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
            button:hover { background: #2980b9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Login Successful via ${providerName.toUpperCase()}</h1>
            
            <div class="user-info">
              <h3>User Information:</h3>
              <p><strong>Username:</strong> ${loginResult.user.username}</p>
              <p><strong>Email:</strong> ${loginResult.user.email}</p>
              <p><strong>Full Name:</strong> ${loginResult.user.full_name || 'N/A'}</p>
              <p><strong>Status:</strong> ${loginResult.user.status}</p>
              <p><strong>Roles:</strong> ${loginResult.user.roles.map((r) => r.role.name).join(', ')}</p>
            </div>

            <h3>Access Token:</h3>
            <div class="token-box" id="accessToken">${loginResult.accessToken}</div>
            <button onclick="copyToClipboard('accessToken')">Copy Access Token</button>

            <h3>Refresh Token:</h3>
            <div class="token-box" id="refreshToken">${loginResult.refreshToken}</div>
            <button onclick="copyToClipboard('refreshToken')">Copy Refresh Token</button>

            <div style="margin-top: 20px;">
              <button onclick="testAPI()">Test API with Token</button>
              <button onclick="location.href='${process.env.BACKEND_URL || 'http://localhost:3000'}'">Go to Swagger</button>
            </div>
          </div>

          <script>
            function copyToClipboard(elementId) {
              const text = document.getElementById(elementId).textContent;
              navigator.clipboard.writeText(text).then(() => {
                alert('Copied to clipboard!');
              });
            }

            function testAPI() {
              const token = document.getElementById('accessToken').textContent;
              fetch('${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/me', {
                headers: { 'Authorization': 'Bearer ' + token }
              })
              .then(res => res.json())
              .then(data => {
                alert('API Test Successful! Check console for details.');
                console.log('User Profile:', data);
              })
              .catch(err => {
                alert('API Test Failed: ' + err.message);
              });
            }

            // Auto-save tokens to localStorage
            localStorage.setItem('accessToken', '${loginResult.accessToken}');
            localStorage.setItem('refreshToken', '${loginResult.refreshToken}');
            console.log('✅ Tokens saved to localStorage');
          </script>
        </body>
        </html>
      `);
    }
  }
}
