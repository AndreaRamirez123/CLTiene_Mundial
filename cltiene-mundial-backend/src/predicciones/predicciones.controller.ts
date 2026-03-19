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

  // Resolver predicciones de un partido finalizado
  @Post('resolver/:partidoId')
  resolverPredicciones(@Param('partidoId') partidoId: string) {
    return this.prediccionesService.resolverPrediccionesPartido(parseInt(partidoId, 10));
  }

  // SIMULACION: poner resultado + resolver predicciones de una vez
  @Post('simular/:partidoId')
  simularResultado(
    @Param('partidoId') partidoId: string,
    @Body() body: { goles_local: number; goles_visitante: number },
  ) {
    return this.prediccionesService.simularResultado(
      parseInt(partidoId, 10),
      body.goles_local,
      body.goles_visitante,
    );
  }
}
