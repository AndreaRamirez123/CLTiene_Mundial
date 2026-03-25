import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Jugador, Transaccion]),
    JwtModule.register({
      secret: 'cltiene_mundial_2026_secret_key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule],
})
export class AuthModule {}
