import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { MisionesService } from './misiones.service';

@Controller('misiones')
export class MisionesController {
  constructor(private readonly misionesService: MisionesService) {}

  @Get(':uid')
  getMisiones(@Param('uid') uid: string) {
    return this.misionesService.getMisiones(uid);
  }

  @Get('trivia/preguntas')
  getPreguntasTrivia(@Query('empresa_id') empresaId?: string) {
    const id = empresaId ? parseInt(empresaId, 10) : 1;
    return this.misionesService.getPreguntasDelDia(id);
  }

  @Post(':uid/trivia')
  jugarTrivia(@Param('uid') uid: string, @Body('correctas') correctas: number) {
    return this.misionesService.jugarTrivia(uid, correctas);
  }

  @Post(':uid/runner')
  jugarRunner(@Param('uid') uid: string) {
    return this.misionesService.jugarRunner(uid);
  }

  @Post(':uid/:misionId/completar')
  completarMision(
    @Param('uid') uid: string,
    @Param('misionId') misionId: string,
  ) {
    return this.misionesService.completarMision(uid, misionId);
  }
}
