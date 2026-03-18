import { Controller, Post, Param, Body } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('token/:uid')
  guardarToken(@Param('uid') uid: string, @Body() body: { token: string }) {
    return this.notificacionesService.guardarToken(uid, body.token);
  }
}