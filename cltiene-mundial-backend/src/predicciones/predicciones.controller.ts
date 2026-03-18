import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PrediccionesService } from './predicciones.service';

@Controller('predicciones')
export class PrediccionesController {
  constructor(private readonly prediccionesService: PrediccionesService) {}

  @Post(':uid')
  crearPrediccion(
    @Param('uid') uid: string,
    @Body()
    body: {
      partido_id: string;
      resultado: string;
      goles_local: number;
      goles_visitante: number;
      monedas_apostadas: number;
    },
  ) {
    return this.prediccionesService.crearPrediccion(uid, body);
  }

  @Get(':uid')
  getPredicciones(@Param('uid') uid: string) {
    return this.prediccionesService.getPrediccionesUsuario(uid);
  }
}
