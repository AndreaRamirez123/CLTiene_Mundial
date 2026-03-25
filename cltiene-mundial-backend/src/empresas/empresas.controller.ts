import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { SuperAdminGuard } from '../admin/superadmin.guard';
import { AdminGuard } from '../admin/admin.guard';

@Controller('admin/empresas')
export class EmpresasController {
  constructor(private readonly empresasService: EmpresasService) {}

  // === SUPERADMIN: CRUD de empresas ===

  @Post()
  @UseGuards(SuperAdminGuard)
  crearEmpresa(@Body() body: { nombre: string; slug: string }) {
    return this.empresasService.crearEmpresa(body);
  }

  @Get()
  @UseGuards(SuperAdminGuard)
  listarEmpresas() {
    return this.empresasService.listarEmpresas();
  }

  @Get(':id')
  @UseGuards(SuperAdminGuard)
  obtenerEmpresa(@Param('id') id: string) {
    return this.empresasService.obtenerEmpresa(parseInt(id, 10));
  }

  @Put(':id')
  @UseGuards(SuperAdminGuard)
  editarEmpresa(@Param('id') id: string, @Body() body: Partial<any>) {
    return this.empresasService.editarEmpresa(parseInt(id, 10), body);
  }

  // SUPERADMIN: Crear admin para una empresa
  @Post(':id/crear-admin')
  @UseGuards(SuperAdminGuard)
  crearAdminEmpresa(
    @Param('id') id: string,
    @Body() body: { email: string; password: string; nombre: string },
  ) {
    return this.empresasService.crearAdminEmpresa(parseInt(id, 10), body);
  }

  // ADMIN DE EMPRESA: Crear jugador para su empresa
  @Post('jugadores/crear')
  @UseGuards(AdminGuard)
  crearJugadorParaEmpresa(
    @Request() req: any,
    @Body() body: { email: string; password: string; nombre: string },
  ) {
    const empresaId = req.jugador.empresa_id;
    return this.empresasService.crearJugadorParaEmpresa(empresaId, body);
  }
}
