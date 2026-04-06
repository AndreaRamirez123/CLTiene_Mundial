import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidosController } from './partidos.controller';
import { PartidosService } from './partidos.service';
import { ResultadosAutoService } from './resultados-auto.service';
import { Partido } from '../entities/partido.entity';
import { Empresa } from '../entities/empresa.entity';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { PrediccionesModule } from '../predicciones/predicciones.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partido, Empresa]),
    AdminModule,
    AuthModule,
    PrediccionesModule,
  ],
  controllers: [PartidosController],
  providers: [PartidosService, ResultadosAutoService],
  exports: [PartidosService],
})
export class PartidosModule {}
