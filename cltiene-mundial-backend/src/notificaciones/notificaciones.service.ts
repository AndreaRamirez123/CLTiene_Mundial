/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(private firebase: FirebaseService) {}

  private get db() {
    return this.firebase.getFirestore();
  }

  // Ejecuta cada minuto para verificar partidos próximos
  @Cron('* * * * *')
  async verificarPartidosProximos() {
    const ahora = new Date();
    const en15min = new Date(ahora.getTime() + 15 * 60 * 1000);
    const en10min = new Date(ahora.getTime() + 10 * 60 * 1000);

    const fechaHoy = ahora.toISOString().split('T')[0];
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    const hora15 = `${String(en15min.getHours()).padStart(2, '0')}:${String(en15min.getMinutes()).padStart(2, '0')}`;

    const snap = await this.db
      .collection('partidos')
      .where('fecha', '==', fechaHoy)
      .where('hora', '==', hora15)
      .where('estado', '==', 'pendiente')
      .get();

    if (snap.empty) return;

    this.logger.log(`Partido próximo encontrado — enviando notificaciones`);
    await this.enviarNotificacionATodos({
      titulo: '⚽ La fecha está por comenzar',
      cuerpo:
        'Aún puedes hacer tus predicciones y seguir subiendo en el ranking CLTiene.',
      tipo: 'partido_proximo',
    });
  }

  // Ejecuta cada día a las 8am — recordatorio de predicciones pendientes
  @Cron('0 8 * * *')
  async recordatorioPendientes() {
    const fechaHoy = new Date().toISOString().split('T')[0];

    const partidosHoy = await this.db
      .collection('partidos')
      .where('fecha', '==', fechaHoy)
      .where('estado', '==', 'pendiente')
      .get();

    if (partidosHoy.empty) return;

    const jugadores = await this.db.collection('jugadores').get();

    for (const jugador of jugadores.docs) {
      const uid = jugador.id;
      const prediccionesHoy = await this.db
        .collection('predicciones')
        .where('uid', '==', uid)
        .where('createdAt', '>=', new Date(fechaHoy))
        .get();

      // Solo notifica si no ha hecho predicciones hoy
      if (prediccionesHoy.empty && jugador.data().fcm_token) {
        await this.enviarNotificacionAUsuario(jugador.data().fcm_token, {
          titulo: '📋 Predicciones pendientes',
          cuerpo:
            'Aún tienes predicciones pendientes para esta fecha. Participa antes de que empiecen los partidos.',
          tipo: 'pendiente',
        });
      }
    }
  }

  // Ejecuta cada día a las 10am — rescate por inactividad
  @Cron('0 10 * * *')
  async rescateInactivos() {
    const hace5dias = new Date();
    hace5dias.setDate(hace5dias.getDate() - 5);

    const jugadores = await this.db
      .collection('jugadores')
      .where('ultimo_acceso', '<=', hace5dias)
      .get();

    for (const jugador of jugadores.docs) {
      if (jugador.data().fcm_token) {
        await this.enviarNotificacionAUsuario(jugador.data().fcm_token, {
          titulo: '👀 Te estamos esperando',
          cuerpo:
            'El Mundial sigue y aún puedes sumar puntos en el ranking CLTiene.',
          tipo: 'inactividad',
        });
      }
    }

    this.logger.log(
      `Rescate inactivos: ${jugadores.size} jugadores notificados`,
    );
  }

  private async enviarNotificacionATodos(data: {
    titulo: string;
    cuerpo: string;
    tipo: string;
  }) {
    const jugadores = await this.db
      .collection('jugadores')
      .where('fcm_token', '!=', null)
      .get();

    const tokens = jugadores.docs
      .map((d) => d.data().fcm_token)
      .filter(Boolean);

    if (tokens.length === 0) return;

    try {
      const admin = await import('firebase-admin');
      await admin.default.messaging().sendEachForMulticast({
        tokens,
        notification: { title: data.titulo, body: data.cuerpo },
        data: { tipo: data.tipo },
      });
      this.logger.log(`Notificación enviada a ${tokens.length} jugadores`);
    } catch (e) {
      this.logger.error('Error enviando notificación masiva', e);
    }
  }

  private async enviarNotificacionAUsuario(
    token: string,
    data: { titulo: string; cuerpo: string; tipo: string },
  ) {
    try {
      const admin = await import('firebase-admin');
      await admin.default.messaging().send({
        token,
        notification: { title: data.titulo, body: data.cuerpo },
        data: { tipo: data.tipo },
      });
    } catch (e) {
      this.logger.error('Error enviando notificación individual', e);
    }
  }

  async guardarToken(uid: string, token: string) {
    await this.db.collection('jugadores').doc(uid).update({ fcm_token: token });
    return { mensaje: 'Token guardado' };
  }
}
