import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PartidosModule } from './partidos/partidos.module';
import { PrediccionesModule } from './predicciones/predicciones.module';
import { MonedasModule } from './monedas/monedas.module';
import { RankingModule } from './ranking/ranking.module';
import { NotificacionesModule } from './notificaciones/notificaciones.module';
import { MisionesModule } from './misiones/misiones.module';
import { WipModule } from './wip/wip.module';
import { CanjesModule } from './canjes/canjes.module';
import { AdminModule } from './admin/admin.module';
import { ConfigMarcaModule } from './config-marca/config-marca.module';
import { EmpresasModule } from './empresas/empresas.module';
import { PreguntasModule } from './preguntas/preguntas.module';
import { NoticiasModule } from './noticias/noticias.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env.local', '.env.production'] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const socketPath = config.get('DB_SOCKET_PATH');
        return {
          type: 'mysql',
          ...(socketPath
            ? { extra: { socketPath } }
            : { host: config.get('DB_HOST', 'localhost') }),
          port: config.get<number>('DB_PORT', 3306),
          username: config.get('DB_USER', 'root'),
          password: config.get('DB_PASSWORD', ''),
          database: config.get('DB_NAME', 'cltiene_mundial'),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
        };
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    AuthModule,
    UsersModule,
    PartidosModule,
    PrediccionesModule,
    MonedasModule,
    RankingModule,
    NotificacionesModule,
    MisionesModule,
    WipModule,
    CanjesModule,
    AdminModule,
    ConfigMarcaModule,
    EmpresasModule,
    PreguntasModule,
    NoticiasModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
