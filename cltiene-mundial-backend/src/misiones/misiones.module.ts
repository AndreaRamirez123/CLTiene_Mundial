import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MisionesController } from './misiones.controller';
import { MisionesService } from './misiones.service';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { TriviaHistorial } from '../entities/trivia-historial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jugador, Transaccion, TriviaHistorial])],
  controllers: [MisionesController],
  providers: [MisionesService],
  exports: [MisionesService],
})
export class MisionesModule {}
