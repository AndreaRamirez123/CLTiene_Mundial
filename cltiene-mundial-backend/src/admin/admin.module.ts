import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';
import { SuperAdminGuard } from './superadmin.guard';
import { Jugador } from '../entities/jugador.entity';
import { Prediccion } from '../entities/prediccion.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador, Prediccion, Transaccion]),
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard, SuperAdminGuard],
  exports: [AdminGuard, SuperAdminGuard, TypeOrmModule],
})
export class AdminModule {}
