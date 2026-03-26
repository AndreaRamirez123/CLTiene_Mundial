import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PreguntasService } from './preguntas.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('preguntas')
@UseGuards(AdminGuard)
export class PreguntasController {
  constructor(private readonly preguntasService: PreguntasService) {}

  // Listar preguntas (admin ve las de su empresa + globales, superadmin ve todo)
  @Get()
  listar(@Request() req: any) {
    const empresaId =
      req.jugador.rol === 'superadmin' ? undefined : req.jugador.empresa_id;
    return this.preguntasService.listar(empresaId);
  }

  // Obtener preguntas para jugar (por empresa)
  @Get('jugar/:empresaId')
  obtenerParaJugar(@Param('empresaId') empresaId: string) {
    return this.preguntasService.getPreguntasPorEmpresa(
      parseInt(empresaId, 10),
    );
  }

  // Crear pregunta manual
  @Post()
  crear(
    @Request() req: any,
    @Body()
    body: {
      pregunta: string;
      opciones: string[];
      correcta: number;
      empresa_id?: number;
      tipo?: string;
    },
  ) {
    // Admin solo puede crear para su empresa
    if (req.jugador.rol !== 'superadmin') {
      body.empresa_id = req.jugador.empresa_id;
    }
    return this.preguntasService.crear(body);
  }

  // Generar preguntas con Gemini
  @Post('generar/:empresaId')
  generarConIA(@Request() req: any, @Param('empresaId') empresaId: string) {
    // Admin solo puede generar para su empresa
    const id = parseInt(empresaId, 10);
    if (req.jugador.rol !== 'superadmin' && req.jugador.empresa_id !== id) {
      return {
        error: 'No tienes permiso para generar preguntas de otra empresa',
      };
    }
    return this.preguntasService.generarConIA(id);
  }

  // Toggle activa/inactiva
  @Post(':id/toggle')
  toggleActiva(@Param('id') id: string) {
    return this.preguntasService.toggleActiva(parseInt(id, 10));
  }

  // Eliminar
  @Delete(':id')
  eliminar(@Param('id') id: string) {
    return this.preguntasService.eliminar(parseInt(id, 10));
  }
}
