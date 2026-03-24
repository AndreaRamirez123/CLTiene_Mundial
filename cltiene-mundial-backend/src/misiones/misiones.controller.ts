import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MisionesService } from './misiones.service';

@Controller('misiones')
export class MisionesController {
  constructor(private readonly misionesService: MisionesService) {}

  @Get(':uid')
  getMisiones(@Param('uid') uid: string) {
    return this.misionesService.getMisiones(uid);
  }

  @Get('trivia/preguntas')
  getPreguntasTrivia() {
    return this.misionesService.getPreguntasDelDia();
  }

  @Post(':uid/trivia')
  jugarTrivia(@Param('uid') uid: string, @Body('correctas') correctas: number) {
    return this.misionesService.jugarTrivia(uid, correctas);
  }

  @Post(':uid/:misionId/completar')
  completarMision(
    @Param('uid') uid: string,
    @Param('misionId') misionId: string,
  ) {
    return this.misionesService.completarMision(uid, misionId);
  }
}
