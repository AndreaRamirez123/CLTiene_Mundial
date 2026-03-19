import { Module } from '@nestjs/common';
import { MisionesController } from './misiones.controller';
import { MisionesService } from './misiones.service';

@Module({
  controllers: [MisionesController],
  providers: [MisionesService],
  exports: [MisionesService],
})
export class MisionesModule {}
