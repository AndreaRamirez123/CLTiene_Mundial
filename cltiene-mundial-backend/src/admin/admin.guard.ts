import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const uid = request.headers['x-user-uid']; // El UID viene en headers desde Firebase

    if (!uid) {
      throw new ForbiddenException('No UID proporcionado');
    }

    const jugador = await this.jugadorRepo.findOne({ where: { uid } });

    if (!jugador) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (jugador.rol !== 'admin') {
      throw new ForbiddenException('Acceso denegado: Solo administradores pueden acceder');
    }

    // Guardar el jugador en el request para usarlo después
    request.jugador = jugador;
    return true;
  }
}
