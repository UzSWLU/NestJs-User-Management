import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Companies')
@ApiBearerAuth()
@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Yangi company yaratish' })
  @ApiResponse({ status: 201, description: 'Company muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 400, description: "Noto'g'ri ma'lumot" })
  @ApiResponse({ status: 401, description: 'Autentifikatsiya xatosi' })
  @ApiResponse({ status: 403, description: "Ruxsat yo'q" })
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Get()
  @ApiOperation({ summary: "Barcha companylar ro'yxati" })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli' })
  findAll() {
    return this.companiesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta companyni olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli' })
  @ApiResponse({ status: 404, description: 'Company topilmadi' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: "Company ma'lumotlarini yangilash" })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli yangilandi' })
  @ApiResponse({ status: 404, description: 'Company topilmadi' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Delete(':id')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: "Companyni o'chirish" })
  @ApiResponse({ status: 200, description: "Muvaffaqiyatli o'chirildi" })
  @ApiResponse({ status: 404, description: 'Company topilmadi' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companiesService.remove(id);
  }

  @Post(':id/upload-logo')
  @Roles('admin', 'creator')
  @ApiOperation({ summary: 'Company logosini yuklash' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Logo fayli (PNG, JPG, JPEG, GIF)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Logo muvaffaqiyatli yuklandi' })
  @ApiResponse({ status: 400, description: "Fayl formati noto'g'ri" })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `company-${req.params.id}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: Number(process.env.MAX_FILE_SIZE_MB || 2) * 1024 * 1024, // Default 2MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes =
          process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif';
        const fileTypes = allowedTypes.split(',').join('|');
        const regex = new RegExp(`\\.(${fileTypes})$`, 'i');

        if (!file.originalname.match(regex)) {
          return cb(
            new BadRequestException(
              `Faqat ${allowedTypes.toUpperCase()} fayllarini yuklash mumkin!`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: any,
  ) {
    if (!file) {
      throw new BadRequestException('Fayl yuklanmadi');
    }

    const logoPath = `/uploads/logos/${file.filename}`;
    return await this.companiesService.update(id, { logo: logoPath });
  }
}
