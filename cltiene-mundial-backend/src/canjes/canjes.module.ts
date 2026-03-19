import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanjesController } from './canjes.controller';
import { CanjesService } from './canjes.service';
import { Canje } from '../entities/canje.entity';
import { Jugador } from '../entities/jugador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Canje, Jugador])],
  controllers: [CanjesController],
  providers: [CanjesService],
})
export class CanjesModule {}
