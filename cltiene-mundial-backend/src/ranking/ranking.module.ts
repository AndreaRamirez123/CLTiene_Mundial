import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { Jugador } from '../entities/jugador.entity';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador]),
    AdminModule,
    AuthModule,
  ],
  controllers: [RankingController],
  providers: [RankingService],
})
export class RankingModule {}
