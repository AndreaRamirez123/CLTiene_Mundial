import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidosController } from './partidos.controller';
import { PartidosService } from './partidos.service';
import { Partido } from '../entities/partido.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Partido])],
  controllers: [PartidosController],
  providers: [PartidosService],
  exports: [PartidosService],
})
export class PartidosModule {}
