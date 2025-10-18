import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserProfilesService } from './user-profiles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('User Profiles')
@Controller('user-profiles')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserProfilesController {
  constructor(private readonly profilesService: UserProfilesService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Asosiy (primary) profilni olish',
    description:
      'Foydalanuvchining asosiy profili (primary_profile_id) qaytariladi. Agar primary profil belgilanmagan bo\'lsa, birinchi profilni qaytaradi.',
  })
  @ApiResponse({
    status: 200,
    description: 'Primary profil muvaffaqiyatli qaytarildi',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        userId: { type: 'number', example: 1 },
        first_name: { type: 'string', example: 'John' },
        last_name: { type: 'string', example: 'Doe' },
        middle_name: { type: 'string', example: 'Smith' },
        avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
        birth_date: { type: 'string', format: 'date', example: '1990-01-01' },
        gender: { type: 'string', example: 'male' },
        phone: { type: 'string', example: '+998901234567' },
        address: { type: 'string', example: 'Tashkent, Uzbekistan' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        user: {
          type: 'object',
          description: 'Profil egasi (user)',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'User topilmadi',
  })
  async getMyProfile(@CurrentUser() user: any) {
    return this.profilesService.getMyProfile(user.id);
  }

  @Get('all')
  @ApiOperation({
    summary: 'Barcha profillar ro\'yxatini olish',
    description:
      'Foydalanuvchining barcha profillari ro\'yxati (asosiy + merge qilingan accountlar). Bu ro\'yxatdan birini primary profil sifatida tanlash mumkin.',
  })
  @ApiResponse({
    status: 200,
    description: 'Barcha profillar muvaffaqiyatli qaytarildi',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1, description: 'Profil ID' },
          userId: { type: 'number', example: 1, description: 'User ID' },
          first_name: { type: 'string', example: 'John' },
          last_name: { type: 'string', example: 'Doe' },
          middle_name: { type: 'string', example: 'Smith' },
          avatar_url: { type: 'string', example: 'https://example.com/avatar.jpg' },
          birth_date: { type: 'string', format: 'date', example: '1990-01-01' },
          gender: { type: 'string', example: 'male' },
          phone: { type: 'string', example: '+998901234567' },
          address: { type: 'string', example: 'Tashkent, Uzbekistan' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          user: {
            type: 'object',
            description: 'Profil egasi (asosiy yoki merged user)',
          },
        },
      },
      example: [
        {
          id: 1,
          userId: 1,
          first_name: 'John',
          last_name: 'Doe',
          created_at: '2025-10-18T09:15:22.000Z',
        },
        {
          id: 2,
          userId: 2,
          first_name: 'DAVLATBEK',
          last_name: 'ABDUVOXIDOV',
          created_at: '2025-10-18T09:15:34.000Z',
        },
      ],
    },
  })
  async getAllProfiles(@CurrentUser() user: any) {
    return this.profilesService.getAllMyProfiles(user.id);
  }

  @Post('preferences')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Primary profilni tanlash',
    description:
      'Barcha profillar (/all) ro\'yxatidan birini asosiy (primary) profil sifatida belgilaydi. Tanlangan profil keyinchalik /me endpointida qaytariladi.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileId: {
          type: 'number',
          example: 2,
          description: 'Profil ID (GET /all dan olingan profillardan biri)',
        },
      },
      required: ['profileId'],
    },
    examples: {
      'Profil tanlash': {
        value: {
          profileId: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Primary profil muvaffaqiyatli o\'zgartirildi',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Primary profile updated successfully',
        },
        primaryProfile: {
          type: 'object',
          description: 'Yangi primary profil',
          properties: {
            id: { type: 'number', example: 2 },
            userId: { type: 'number', example: 2 },
            first_name: { type: 'string', example: 'DAVLATBEK' },
            last_name: { type: 'string', example: 'ABDUVOXIDOV' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Profil topilmadi yoki ruxsat yo\'q',
  })
  async setPreference(
    @CurrentUser() user: any,
    @Body('profileId') profileId: number,
  ) {
    return this.profilesService.setPreference(user.id, profileId);
  }
}
