import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registro(@Body() body: { email: string; password: string }) {
    return this.authService.registro(body.email, body.password);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @Post('google')
  loginConGoogle(@Body() body: { credential: string }) {
    return this.authService.loginConGoogle(body.credential);
  }

  @Post('completar-perfil')
  completarPerfil(
    @Body()
    body: {
      uid: string;
      nombre: string;
      telefono: string;
      tipojugador: string;
      relacion_cltiene: string;
      es_referido: number;
      nombre_referidor: string;
      referido_por: string;
      departamento: string;
      ciudad: string;
    },
  ) {
    return this.authService.completarPerfil(body.uid, body);
  }
}
