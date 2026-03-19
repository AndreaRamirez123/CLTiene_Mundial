import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesController } from './notificaciones.controller';
import { Jugador } from '../entities/jugador.entity';
import { Partido } from '../entities/partido.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { NotificacionLog } from '../entities/notificacion-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jugador, Partido, Prediccion, NotificacionLog])],
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
