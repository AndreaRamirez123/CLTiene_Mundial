import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Endpoints publicos (sin auth)
  @Get('empresas-activas')
  empresasActivas() {
    return this.authService.listarEmpresasActivas();
  }

  @Get('config-publica/:slug')
  configPublica(@Param('slug') slug: string) {
    return this.authService.obtenerConfigPublica(slug);
  }

  @Post('registro')
  registro(@Body() body: { email: string; password: string; empresa_slug?: string }) {
    return this.authService.registro(body.email, body.password, body.empresa_slug);
  }

  @Post('login')
  login(@Body() body: { email: string; password: string; empresa_slug?: string }) {
    return this.authService.login(body.email, body.password, body.empresa_slug);
  }

  @Post('google')
  loginConGoogle(@Body() body: { credential: string; empresa_slug?: string }) {
    return this.authService.loginConGoogle(body.credential, body.empresa_slug);
  }

  @Post('solicitar-reset')
  solicitarReset(@Body() body: { email: string; empresa_slug?: string }) {
    return this.authService.solicitarResetPassword(body.email, body.empresa_slug);
  }

  @Post('reset-password')
  resetPassword(
    @Body() body: { email: string; codigo: string; nueva_password: string; empresa_slug?: string },
  ) {
    return this.authService.resetPassword(body.email, body.codigo, body.nueva_password, body.empresa_slug);
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
