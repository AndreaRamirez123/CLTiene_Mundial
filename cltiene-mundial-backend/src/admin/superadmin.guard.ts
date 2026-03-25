import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    let uid = request.headers['x-user-uid'];

    if (!uid) {
      const authHeader = request.headers['authorization'];
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const payload = this.jwtService.verify(token);
          uid = payload.uid;
        } catch {
          throw new ForbiddenException('Token inválido');
        }
      }
    }

    if (!uid) {
      throw new ForbiddenException('No autenticado');
    }

    const jugador = await this.jugadorRepo.findOne({ where: { uid } });

    if (!jugador) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    if (jugador.rol !== 'superadmin') {
      throw new ForbiddenException('Acceso denegado: Solo superadmin puede acceder');
    }

    request.jugador = jugador;
    return true;
  }
}
