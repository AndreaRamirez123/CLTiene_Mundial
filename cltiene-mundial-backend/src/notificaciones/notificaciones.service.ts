import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, Not } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Jugador } from '../entities/jugador.entity';
import { Partido } from '../entities/partido.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { NotificacionLog } from '../entities/notificacion-log.entity';
import { FirebaseService } from '../firebase/firebase.service';

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
    private readonly firebase: FirebaseService,
  ) {}

  // Ejecuta cada minuto para verificar partidos próximos
  @Cron('* * * * *')
  async verificarPartidosProximos() {
    const ahora = new Date();
    const en15min = new Date(ahora.getTime() + 15 * 60 * 1000);

    const fechaHoy = ahora.toISOString().split('T')[0];
    const hora15 = `${String(en15min.getHours()).padStart(2, '0')}:${String(en15min.getMinutes()).padStart(2, '0')}`;

    const partidos = await this.partidoRepo.find({
      where: { fecha: fechaHoy, hora: hora15, estado: 'pendiente' },
    });

    if (partidos.length === 0) return;

    this.logger.log('Partido próximo encontrado — enviando notificaciones');
    await this.enviarNotificacionATodos({
      titulo: 'La fecha está por comenzar',
      cuerpo:
        'Aún puedes hacer tus predicciones y seguir subiendo en el ranking CLTiene.',
      tipo: 'previa_fecha',
    });
  }

  // Ejecuta cada día a las 8am — recordatorio de predicciones pendientes
  @Cron('0 8 * * *')
  async recordatorioPendientes() {
    const fechaHoy = new Date().toISOString().split('T')[0];

    const partidosHoy = await this.partidoRepo.find({
      where: { fecha: fechaHoy, estado: 'pendiente' },
    });

    if (partidosHoy.length === 0) return;

    const jugadores = await this.jugadorRepo.find({
      where: { fcm_token: Not(IsNull()) },
    });

    for (const jugador of jugadores) {
      // Verificar si el jugador ya hizo predicciones hoy
      const prediccionesHoy = await this.prediccionRepo
        .createQueryBuilder('p')
        .where('p.jugador_id = :jugadorId', { jugadorId: jugador.id })
        .andWhere('DATE(p.created_at) = :fecha', { fecha: fechaHoy })
        .getCount();

      // Solo notifica si no ha hecho predicciones hoy
      if (prediccionesHoy === 0 && jugador.fcm_token) {
        await this.enviarNotificacionAUsuario(jugador.fcm_token, {
          titulo: 'Predicciones pendientes',
          cuerpo:
            'Aún tienes predicciones pendientes para esta fecha. Participa antes de que empiecen los partidos.',
          tipo: 'recordatorio_pendiente',
        });

        // Guardar log
        await this.notifLogRepo.save({
          jugador_id: jugador.id,
          tipo: 'recordatorio_pendiente',
          titulo: 'Predicciones pendientes',
          mensaje:
            'Aún tienes predicciones pendientes para esta fecha. Participa antes de que empiecen los partidos.',
          enviada: 1,
        });
      }
    }
  }

  // Ejecuta cada día a las 10am — rescate por inactividad
  @Cron('0 10 * * *')
  async rescateInactivos() {
    const hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);

    const jugadores = await this.jugadorRepo.find({
      where: {
        ultimo_acceso: LessThanOrEqual(hace5dias),
        fcm_token: Not(IsNull()),
      },
    });

    for (const jugador of jugadores) {
      if (jugador.fcm_token) {
        await this.enviarNotificacionAUsuario(jugador.fcm_token, {
          titulo: 'Te estamos esperando',
          cuerpo:
            'El Mundial sigue y aún puedes sumar puntos en el ranking CLTiene.',
          tipo: 'inactividad',
        });

        // Guardar log
        await this.notifLogRepo.save({
          jugador_id: jugador.id,
          tipo: 'inactividad',
          titulo: 'Te estamos esperando',
          mensaje:
            'El Mundial sigue y aún puedes sumar puntos en el ranking CLTiene.',
          enviada: 1,
        });
      }
    }

    this.logger.log(
      `Rescate inactivos: ${jugadores.length} jugadores notificados`,
    );
  }

  private async enviarNotificacionATodos(data: {
    titulo: string;
    cuerpo: string;
    tipo: string;
  }) {
    const jugadores = await this.jugadorRepo.find({
      where: { fcm_token: Not(IsNull()) },
    });

    const tokens = jugadores
      .map((j) => j.fcm_token)
      .filter((t): t is string => !!t);

    if (tokens.length === 0) return;

    try {
      const messaging = this.firebase.getMessaging();
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title: data.titulo, body: data.cuerpo },
        data: { tipo: data.tipo },
      });
      this.logger.log(`Notificación enviada a ${tokens.length} jugadores`);

      // Guardar logs para todos los jugadores notificados
      const logs = jugadores
        .filter((j) => j.fcm_token)
        .map((j) =>
          this.notifLogRepo.create({
            jugador_id: j.id,
            tipo: data.tipo as
              | 'previa_fecha'
              | 'recordatorio_pendiente'
              | 'inactividad',
            titulo: data.titulo,
            mensaje: data.cuerpo,
            enviada: 1,
          }),
        );
      await this.notifLogRepo.save(logs);
    } catch (e) {
      this.logger.error('Error enviando notificación masiva', e);
    }
  }

  private async enviarNotificacionAUsuario(
    token: string,
    data: { titulo: string; cuerpo: string; tipo: string },
  ) {
    try {
      const messaging = this.firebase.getMessaging();
      await messaging.send({
        token,
        notification: { title: data.titulo, body: data.cuerpo },
        data: { tipo: data.tipo },
      });
    } catch (e) {
      this.logger.error('Error enviando notificación individual', e);
    }
  }

  async guardarToken(uid: string, token: string) {
    await this.jugadorRepo.update({ uid }, { fcm_token: token });
    return { mensaje: 'Token guardado' };
  }
}
