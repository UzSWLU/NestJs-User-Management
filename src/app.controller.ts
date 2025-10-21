import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { DateUtil } from './common/utils/date.util';

@ApiTags('app')
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'API status and health check' })
  @ApiResponse({ 
    status: 200, 
    description: 'API is running',
    schema: {
      example: {
        status: 'ok',
        message: 'User Management API is running',
        timezone: 'Asia/Tashkent (UTC+5)',
        currentTime: '15/10/2025 15:55:00',
        timestamp: '2025-10-15T10:55:00.000Z'
      }
    }
  })
  getStatus() {
    return {
      status: 'ok',
      message: 'User Management API is running',
      version: '2.1.0',
      deployed: 'Permissions module with full Swagger docs + RBAC implementation',
      timezone: 'Asia/Tashkent (UTC+5)',
      currentTime: DateUtil.toReadableString(),
      timestamp: DateUtil.toISOString(),
    };
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint for Docker/Kubernetes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        uptime: 123.456
      }
    }
  })
  getHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
    };
  }
}