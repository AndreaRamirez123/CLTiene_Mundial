import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('jugadores')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':uid')
  getByUid(@Param('uid') uid: string) {
    return this.usersService.getByUid(uid);
  }

  @Post('registro')
  registrar(
    @Body()
    datos: {
      uid: string;
      email: string;
      nombre: string;
      telefono: string;
      correo: string;
      tipojugador: string;
      relacion_cltiene: string;
      es_referido: number;
      nombre_referidor: string;
      referido_por: string;
    },
  ) {
    return this.usersService.registrar(datos);
  }
}
