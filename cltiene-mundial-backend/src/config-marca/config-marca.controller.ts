import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ConfigMarcaService } from './config-marca.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('config-marca')
@UseGuards(AuthGuard)
export class ConfigMarcaController {
  constructor(private readonly configService: ConfigMarcaService) {}

  @Get()
  obtenerConfig(@Request() req: any) {
    return this.configService.obtenerConfigPorEmpresa(req.jugador.empresa_id);
  }
}
