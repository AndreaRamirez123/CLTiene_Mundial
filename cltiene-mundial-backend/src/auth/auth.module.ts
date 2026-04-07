import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { Empresa } from '../entities/empresa.entity';
import { ConfigMarca } from '../entities/config-marca.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador, Transaccion, Empresa, ConfigMarca]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const secret = config.get('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET not found');
        return {
          secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
  exports: [JwtModule, AuthGuard, TypeOrmModule],
})
export class AuthModule {}
