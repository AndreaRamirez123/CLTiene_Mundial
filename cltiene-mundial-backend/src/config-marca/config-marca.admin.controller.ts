import {
  Body,
  Controller,
  Post,
  Put,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ConfigMarcaService } from './config-marca.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('admin/config-marca')
@UseGuards(AdminGuard)
export class ConfigMarcaAdminController {
  constructor(private readonly configService: ConfigMarcaService) {}

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
      storage: diskStorage({
        destination: './uploads/logos',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Solo se permiten imagenes'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/logos/${file.filename}`;
    return { logo_url: url };
  }

  @Post('upload-video')
  @UseInterceptors(
    FileInterceptor('video', {
      storage: diskStorage({
        destination: './uploads/videos',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          return cb(new Error('Solo se permiten videos'), false);
        }
        cb(null, true);
      },
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    }),
  )
  uploadVideo(@UploadedFile() file: Express.Multer.File) {
    const url = `/uploads/videos/${file.filename}`;
    return { video_url: url };
  }
}
