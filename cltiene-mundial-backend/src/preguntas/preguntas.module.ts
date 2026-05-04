import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PreguntasController } from './preguntas.controller';
import { PreguntasService } from './preguntas.service';
import { Pregunta } from '../entities/pregunta.entity';
import { Empresa } from '../entities/empresa.entity';
import { TriviaDiaria } from '../entities/trivia-diaria.entity';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pregunta, Empresa, TriviaDiaria]),
    AdminModule,
    AuthModule,
  ],
  controllers: [PreguntasController],
  providers: [PreguntasService],
  exports: [PreguntasService],
})
export class PreguntasModule {}
