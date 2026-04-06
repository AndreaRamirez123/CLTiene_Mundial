import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PartidosService } from './partidos.service';
import { ResultadosAutoService } from './resultados-auto.service';
import { AdminGuard } from '../admin/admin.guard';
import { AuthGuard } from '../auth/auth.guard';

@Controller('partidos')
export class PartidosController {
  constructor(
    private readonly partidosService: PartidosService,
    private readonly resultadosAutoService: ResultadosAutoService,
  ) {}

  // Cualquier usuario autenticado puede ver partidos de su empresa
  @Get()
  @UseGuards(AuthGuard)
  getPartidos(@Request() req: any, @Query('fase') fase?: string) {
    return this.partidosService.getPartidos(req.jugador.empresa_id, fase);
  }

  // Solo admin puede hacer seed
  @Post('seed')
  @UseGuards(AdminGuard)
  seedPartidos(@Request() req: any) {
    return this.partidosService.seedPartidos(req.jugador.empresa_id);
  }

  @Put(':id/resultado')
  @UseGuards(AdminGuard)
  actualizarResultado(
    @Param('id') id: string,
    @Body() body: { goles_local: number; goles_visitante: number },
  ) {
    return this.partidosService.actualizarResultado(id, body.goles_local, body.goles_visitante);
  }

  @Post('actualizar-resultados')
  @UseGuards(AdminGuard)
  actualizarResultados() {
    return this.resultadosAutoService.actualizarResultados();
  }

  @Put('playoff')
  @UseGuards(AdminGuard)
  actualizarEquipoPlayoff(
    @Body() body: { placeholder: string; nombre: string; bandera: string },
  ) {
    return this.partidosService.actualizarEquipoPlayoff(body.placeholder, body.nombre, body.bandera);
  }
}
