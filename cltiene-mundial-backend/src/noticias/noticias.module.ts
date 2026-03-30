import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';

@Module({
  imports: [ConfigModule],
  controllers: [NoticiasController],
  providers: [NoticiasService],
})
export class NoticiasModule {}
