import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartidosModule } from './partidos/partidos.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { MonedasModule } from './monedas/monedas.module';
import { RankingModule } from './ranking/ranking.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    FirebaseModule,
    AuthModule,
    UsersModule,
    PartidosModule,
    PrediccionesModule,
    MonedasModule,
    RankingModule,
    NotificacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}