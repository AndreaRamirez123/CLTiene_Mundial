import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrediccionesController } from './predicciones.controller';
import { PrediccionesService } from './predicciones.service';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Partido } from '../entities/partido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jugador, Prediccion, Partido])],
  controllers: [PrediccionesController],
  providers: [PrediccionesService],
  exports: [PrediccionesService],
})
export class PrediccionesModule {}
