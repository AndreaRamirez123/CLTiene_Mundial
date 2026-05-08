import { Controller, Post, Get, Param, Body, Headers } from '@nestjs/common';
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

  // SSO CUN 360 - login automatico con correo institucional (version simple por URL)
  @Post('sso-cun')
  ssoCun(@Body() body: { email: string; empresa_slug?: string }) {
    return this.authService.loginSsoCun(body.email, body.empresa_slug);
  }

  // SSO CUN 360 - server-to-server (Opcion C)
  // CUN 360 llama desde su backend con API KEY y datos del usuario.
  // Devuelve session_token temporal para redirigir al usuario.
  @Post('sso-cun-api')
  ssoCunApi(
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      email: string;
      nombre?: string;
      telefono?: string;
      tipojugador?: string;
      relacion_cltiene?: string;
      departamento?: string;
      ciudad?: string;
    },
  ) {
    const apiKey = authHeader?.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;
    return this.authService.crearSsoCunSession(apiKey, body);
  }

  // Cliente consume el session_token y obtiene JWT real
  @Post('sso-session')
  ssoSession(@Body() body: { session_token: string }) {
    return this.authService.consumirSsoSession(body.session_token);
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

  @Post('registro-completo')
  registroCompleto(
    @Body()
    body: {
      email: string;
      password: string;
      empresa_slug?: string;
      nombre: string;
      nick: string;
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
    const { email, password, empresa_slug, ...datos } = body;
    return this.authService.registroCompleto(email, password, empresa_slug || 'default', datos);
  }

  @Post('completar-perfil')
  completarPerfil(
    @Body()
    body: {
      uid: string;
      nombre: string;
      nick: string;
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
