import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigMarca } from '../entities/config-marca.entity';
import { Jugador } from '../entities/jugador.entity';
import { Empresa } from '../entities/empresa.entity';
import { ConfigMarcaService } from './config-marca.service';
import { ConfigMarcaController } from './config-marca.controller';
import { ConfigMarcaAdminController } from './config-marca.admin.controller';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { GcsModule } from '../gcs/gcs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConfigMarca, Jugador, Empresa]),
    AdminModule,
    AuthModule,
    GcsModule,
  ],
  controllers: [ConfigMarcaController, ConfigMarcaAdminController],
  providers: [ConfigMarcaService],
  exports: [ConfigMarcaService],
})
export class ConfigMarcaModule {}
