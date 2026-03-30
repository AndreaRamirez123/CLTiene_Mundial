import { Controller, Get, Query } from '@nestjs/common';
import { NoticiasService } from './noticias.service';

@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @Get('mundial')
  async obtenerNoticiasMundial(
    @Query('limit') limit = '5',
    @Query('forzar') forzar = 'false',
  ) {
    const cantidad = Math.max(1, Math.min(10, Number(limit) || 5));
    return this.noticiasService.obtenerNoticias(cantidad, forzar === 'true');
  }
}
