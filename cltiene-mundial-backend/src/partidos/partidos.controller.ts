import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { PartidosService } from './partidos.service';
import { ResultadosAutoService } from './resultados-auto.service';
import { FootballScraperService } from './football-scraper.service';
import { AdminGuard } from '../admin/admin.guard';
import { AuthGuard } from '../auth/auth.guard';

@Controller('partidos')
export class PartidosController {
  constructor(
    private readonly partidosService: PartidosService,
    private readonly resultadosAutoService: ResultadosAutoService,
    private readonly scraperService: FootballScraperService,
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

  @Post()
  @UseGuards(AdminGuard)
  crearPartido(
    @Request() req: any,
    @Body() body: {
      local_equipo: string;
      visitante_equipo: string;
      bandera_local: string;
      bandera_visitante: string;
      fecha: string;
      hora: string;
      fase: string;
      grupo?: string;
      estado?: string;
    },
  ) {
    return this.partidosService.crearPartido(req.jugador.empresa_id, body);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  eliminarPartido(@Param('id') id: string) {
    return this.partidosService.eliminarPartido(id);
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

  @Get('scraping')
  @UseGuards(AdminGuard)
  scrapingResultados() {
    return this.scraperService.scrapingValidado();
  }

  @Get('scraping/buscar')
  @UseGuards(AdminGuard)
  buscarPartido(
    @Query('equipo1') equipo1: string,
    @Query('equipo2') equipo2: string,
  ) {
    return this.scraperService.buscarPartido(equipo1, equipo2);
  }
}
