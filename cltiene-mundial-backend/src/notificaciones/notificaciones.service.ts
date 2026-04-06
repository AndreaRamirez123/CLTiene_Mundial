import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Jugador } from '../entities/jugador.entity';
import { Partido } from '../entities/partido.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { NotificacionLog } from '../entities/notificacion-log.entity';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    @InjectRepository(Jugador)
    private readonly jugadorRepo: Repository<Jugador>,
    @InjectRepository(Partido)
    private readonly partidoRepo: Repository<Partido>,
    @InjectRepository(Prediccion)
    private readonly prediccionRepo: Repository<Prediccion>,
    @InjectRepository(NotificacionLog)
    private readonly notifLogRepo: Repository<NotificacionLog>,
  ) {}

  async guardarToken(uid: string, token: string) {
    await this.jugadorRepo.update({ uid }, { fcm_token: token });
    return { mensaje: 'Token guardado' };
  }
}
