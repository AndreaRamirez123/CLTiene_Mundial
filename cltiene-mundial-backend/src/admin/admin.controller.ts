import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Obtener todos los jugadores con paginación
  @Get('jugadores')
  async obtenerJugadores(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.adminService.obtenerTodosLosJugadores(page, limit);
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

  // Obtener estadísticas globales
  @Get('estadisticas')
  async obtenerEstadisticas() {
    return this.adminService.obtenerEstadisticas();
  }

  // Georreferenciación
  @Get('georreferenciacion')
  async obtenerGeorreferenciacion() {
    return this.adminService.obtenerGeorreferenciacion();
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
}
