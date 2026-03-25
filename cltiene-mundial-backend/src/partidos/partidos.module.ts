import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartidosController } from './partidos.controller';
import { PartidosService } from './partidos.service';
import { Partido } from '../entities/partido.entity';
import { Empresa } from '../entities/empresa.entity';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partido, Empresa]),
    AdminModule,
    AuthModule,
  ],
  controllers: [PartidosController],
  providers: [PartidosService],
  exports: [PartidosService],
})
export class PartidosModule {}
