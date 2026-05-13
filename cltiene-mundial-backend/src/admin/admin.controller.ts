import { Controller, Get, Post, Delete, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Helper: superadmin ve todo, admin solo su empresa
  private getEmpresaId(req: any): number | undefined {
    if (req.jugador.rol === 'superadmin') return undefined;
    return req.jugador.empresa_id;
  }

  // Obtener todos los jugadores con paginación
  @Get('jugadores')
  async obtenerJugadores(
    @Request() req: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.obtenerTodosLosJugadores(page, limit, this.getEmpresaId(req));
  }

  // Obtener detalles completos de un jugador
  @Get('jugadores/:uid')
  async obtenerDetalleJugador(@Param('uid') uid: string) {
    return this.adminService.obtenerDetalleJugador(uid);
  }

  // Obtener predicciones sin validar
  @Get('predicciones/sin-validar')
  async obtenerPrediccionesSinValidar() {
    return this.adminService.obtenerPrediccionesSinValidar();
  }

  // Obtener estadísticas
  @Get('estadisticas')
  async obtenerEstadisticas(@Request() req: any) {
    return this.adminService.obtenerEstadisticas(this.getEmpresaId(req));
  }

  // Georreferenciación
  @Get('georreferenciacion')
  async obtenerGeorreferenciacion(@Request() req: any) {
    return this.adminService.obtenerGeorreferenciacion(this.getEmpresaId(req));
  }

  // Convertir usuario a admin
  @Post('usuarios/:uid/hacer-admin')
  async convertirAAdmin(@Param('uid') uid: string) {
    return this.adminService.convertirAAdmin(uid);
  }

  // Revocar permisos de admin
  @Post('usuarios/:uid/revocar-admin')
  async revocarAdmin(@Param('uid') uid: string) {
    return this.adminService.revocarAdmin(uid);
  }

  // Eliminar jugador
  @Delete('jugadores/:uid')
  async eliminarJugador(@Param('uid') uid: string) {
    return this.adminService.eliminarJugador(uid);
  }
}
