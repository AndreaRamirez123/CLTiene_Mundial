import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonedasController } from './monedas.controller';
import { MonedasService } from './monedas.service';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jugador, Transaccion])],
  controllers: [MonedasController],
  providers: [MonedasService],
  exports: [MonedasService],
})
export class MonedasModule {}
