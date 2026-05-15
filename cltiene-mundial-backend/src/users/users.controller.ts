import { Controller, Get, Post, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('jugadores')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard)
  @Get(':uid')
  getByUid(@Param('uid') uid: string, @Query('email') email?: string, @Request() req?: any) {
    const esPropio = req?.jugador?.uid === uid;
    const esAdmin = req?.jugador?.rol === 'admin' || req?.jugador?.rol === 'superadmin';
    if (!esPropio && !esAdmin) throw new ForbiddenException('Solo puedes ver tu propio perfil');
    return this.usersService.getByUid(uid, email);
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
