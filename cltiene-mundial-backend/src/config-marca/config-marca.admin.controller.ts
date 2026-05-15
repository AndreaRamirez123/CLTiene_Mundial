import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ConfigMarcaService } from './config-marca.service';
import { AdminGuard } from '../admin/admin.guard';
import { GcsService } from '../gcs/gcs.service';

@Controller('admin/config-marca')
@UseGuards(AdminGuard)
export class ConfigMarcaAdminController {
  constructor(
    private readonly configService: ConfigMarcaService,
    private readonly gcsService: GcsService,
  ) {}

  @Put()
  actualizarConfig(
    @Request() req: any,
    @Body()
    datos: {
      empresa_id?: number;
      nombre_app?: string;
      subtitulo?: string;
      logo_url?: string;
      color_primario?: string;
      color_secundario?: string;
      color_acento?: string;
      color_fondo?: string;
      publicidad_json?: string;
      beneficios_json?: string;
      terminos_condiciones?: string;
      politica_privacidad?: string;
      videos_json?: string;
    },
  ) {
    let empresaId = req.jugador.empresa_id;
    if (req.jugador.rol === 'superadmin' && datos.empresa_id) {
      empresaId = datos.empresa_id;
    }

    const { empresa_id, ...configData } = datos;
    return this.configService.actualizarConfigPorEmpresa(empresaId, configData);
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo de imagen');
    const url = await this.gcsService.uploadFile(file, 'logos');
    return { logo_url: url };
  }

  @Get('video-upload-url')
  async getVideoUploadUrl(
    @Query('filename') filename: string,
    @Query('contentType') contentType: string,
  ) {
    return this.gcsService.getResumableUploadUrl('videos', contentType || 'video/mp4', filename || 'video.mp4');
  }

  @Post('upload-video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: memoryStorage(),
      limits: { fileSize: 30 * 1024 * 1024 },
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo de video');
    const url = await this.gcsService.uploadFile(file, 'videos');
    return { video_url: url };
  }

  @Post('upload-imagen')
  @UseInterceptors(
    FileInterceptor('imagen', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImagen(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo de imagen');
    const url = await this.gcsService.uploadFile(file, 'banners');
    return { imagen_url: url };
  }
}
