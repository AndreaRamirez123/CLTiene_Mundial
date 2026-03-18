import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { MonedasService } from './monedas.service';

@Controller('monedas')
export class MonedasController {
  constructor(private readonly monedasService: MonedasService) {}

  @Get('saldo/:uid')
  getSaldo(@Param('uid') uid: string) {
    return this.monedasService.getSaldo(uid);
  }

  @Post('bono-diario/:uid')
  reclamarBono(@Param('uid') uid: string) {
    return this.monedasService.reclamarBonoDiario(uid);
  }

  @Get('historial/:uid')
  getHistorial(@Param('uid') uid: string) {
    return this.monedasService.getHistorial(uid);
  }
}
