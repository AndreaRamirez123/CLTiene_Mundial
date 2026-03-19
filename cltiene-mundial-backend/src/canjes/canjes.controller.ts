import { Controller, Get, Post, Param, Body, Headers } from '@nestjs/common';
import { CanjesService } from './canjes.service';
import { ConfigService } from '@nestjs/config';

@Controller('canjes')
export class CanjesController {
  constructor(
    private readonly canjesService: CanjesService,
    private readonly config: ConfigService,
  ) {}

  // Obtener opciones de canje (business units de WIP)
  @Get('opciones')
  getOpciones() {
    return this.canjesService.getOpcionesCanje();
  }

  // Verificar si el jugador puede canjear
  @Get('elegibilidad/:uid')
  verificarElegibilidad(@Param('uid') uid: string) {
    return this.canjesService.verificarElegibilidad(uid);
  }

  // Solicitar un canje
  @Post(':uid/solicitar')
  solicitarCanje(
    @Param('uid') uid: string,
    @Body()
    datos: {
      beneficio: string;
      categoria: string;
      canal_contacto: string;
      monedas_a_canjear: number;
      businessUnitId: string;
      businessUnitName: string;
      serviceTypeName: string;
      formId: string;
      companyFormId: string;
    },
  ) {
    return this.canjesService.solicitarCanje(uid, datos);
  }

  // Historial de canjes del jugador
  @Get(':uid/historial')
  getHistorial(@Param('uid') uid: string) {
    return this.canjesService.getCanjesJugador(uid);
  }

  // Webhook de WIP: recibe actualizaciones de estado
  @Post('webhook/status')
  webhookStatus(
    @Body()
    datos: {
      id: string;
      status: string;
      finalClientName: string;
      customerDocument: string;
    },
    @Headers('authorization') apiKey: string,
  ) {
    // Validar que viene de WIP
    const wipKey = this.config.get('WIP_API_KEY');
    if (apiKey !== wipKey) {
      return { response: false, error: 'Unauthorized' };
    }
    return this.canjesService.webhookActualizacion(datos);
  }
}
