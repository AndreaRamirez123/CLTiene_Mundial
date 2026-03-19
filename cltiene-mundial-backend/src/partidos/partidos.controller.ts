import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { PartidosService } from './partidos.service';

@Controller('partidos')
export class PartidosController {
  constructor(private readonly partidosService: PartidosService) {}

  @Get()
  getPartidos(@Query('fase') fase?: string) {
    return this.partidosService.getPartidos(fase);
  }

  @Post('seed')
  seedPartidos() {
    return this.partidosService.seedPartidos();
  }

  @Put(':id/resultado')
  actualizarResultado(
    @Param('id') id: string,
    @Body() body: { goles_local: number; goles_visitante: number }
  ) {
    return this.partidosService.actualizarResultado(id, body.goles_local, body.goles_visitante);
  }

  // Cuando se confirme un equipo de playoff, reemplazar el placeholder
  // Ej: PUT /partidos/playoff { placeholder: "Playoff UEFA D", nombre: "Dinamarca", bandera: "dk" }
  @Put('playoff')
  actualizarEquipoPlayoff(
    @Body() body: { placeholder: string; nombre: string; bandera: string }
  ) {
    return this.partidosService.actualizarEquipoPlayoff(body.placeholder, body.nombre, body.bandera);
  }
}