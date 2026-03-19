import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { Jugador } from '../entities/jugador.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Jugador])],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
