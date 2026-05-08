import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Empresa } from '../entities/empresa.entity';
import { ConfigMarca } from '../entities/config-marca.entity';
import { Jugador } from '../entities/jugador.entity';

@Injectable()
export class EmpresasService {
  constructor(
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(ConfigMarca)
    private configMarcaRepo: Repository<ConfigMarca>,
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private dataSource: DataSource,
  ) {}

  // Crear empresa + config_marca por defecto
  async crearEmpresa(datos: { nombre: string; slug: string }) {
    const existeSlug = await this.empresaRepo.findOne({
      where: { slug: datos.slug },
    });
    if (existeSlug) {
      throw new BadRequestException('Ya existe una empresa con ese slug.');
    }

    return this.dataSource.transaction(async (manager) => {
      const empresa = manager.create(Empresa, {
        nombre: datos.nombre,
        slug: datos.slug,
        estado: 'activa',
      });
      const savedEmpresa = await manager.save(empresa);

      // Crear config_marca por defecto para la empresa
      const configMarca = manager.create(ConfigMarca, {
        empresa_id: savedEmpresa.id,
        nombre_app: datos.nombre,
        subtitulo: 'Mundial 2026',
      });
      await manager.save(configMarca);

      return savedEmpresa;
    });
  }

  // Listar empresas
  async listarEmpresas() {
    return this.empresaRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  // Obtener detalle de empresa
  async obtenerEmpresa(id: number) {
    const empresa = await this.empresaRepo.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const totalJugadores = await this.jugadorRepo.count({
      where: { empresa_id: id },
    });

    const configMarca = await this.configMarcaRepo.findOne({
      where: { empresa_id: id },
    });

    return { empresa, totalJugadores, configMarca };
  }

  // Editar empresa
  async editarEmpresa(id: number, datos: Partial<Empresa>) {
    const empresa = await this.empresaRepo.findOne({ where: { id } });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    if (datos.slug && datos.slug !== empresa.slug) {
      const existeSlug = await this.empresaRepo.findOne({
        where: { slug: datos.slug },
      });
      if (existeSlug) {
        throw new BadRequestException('Ya existe una empresa con ese slug.');
      }
    }

    Object.assign(empresa, datos);
    return this.empresaRepo.save(empresa);
  }

  // Crear admin para una empresa
  async crearAdminEmpresa(
    empresaId: number,
    datos: { email: string; password: string; nombre: string },
  ) {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    // Buscar si ya existe en esta empresa
    const existeEnEmpresa = await this.jugadorRepo.findOne({
      where: { email: datos.email, empresa_id: empresaId },
    });

    if (existeEnEmpresa) {
      // Ya existe en esta empresa: solo promover a admin
      existeEnEmpresa.rol = 'admin';
      existeEnEmpresa.nivel = 'activo';
      if (datos.nombre) existeEnEmpresa.nombre = datos.nombre;
      const saved = await this.jugadorRepo.save(existeEnEmpresa);
      const { password, ...resultado } = saved as any;
      return { ...resultado, promovido: true };
    }

    // Buscar si existe en otra empresa
    const existeEnOtra = await this.jugadorRepo.findOne({
      where: { email: datos.email },
    });

    if (existeEnOtra) {
      // Existe en otra empresa: crear nuevo registro como admin en esta empresa
      const uid = this.generarUid();
      const hash = await bcrypt.hash(datos.password || uid, 10);

      const admin = this.jugadorRepo.create({
        uid,
        email: datos.email,
        password: hash,
        correo: datos.email,
        nombre: datos.nombre || existeEnOtra.nombre || '',
        telefono: existeEnOtra.telefono || '',
        monedas: 0,
        monedas_totales_ganadas: 0,
        codigo_referido: uid.substring(0, 8).toUpperCase(),
        nivel: 'activo',
        dias_consecutivos: 0,
        rol: 'admin',
        empresa_id: empresaId,
      });

      const saved = await this.jugadorRepo.save(admin);
      const { password, ...resultado } = saved as any;
      return resultado;
    }

    // Usuario nuevo: validar password y crear
    if (!datos.password || datos.password.length < 6) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 6 caracteres.',
      );
    }

    const hash = await bcrypt.hash(datos.password, 10);
    const uid = this.generarUid();

    const admin = this.jugadorRepo.create({
      uid,
      email: datos.email,
      password: hash,
      correo: datos.email,
      nombre: datos.nombre || '',
      telefono: '',
      monedas: 0,
      monedas_totales_ganadas: 0,
      codigo_referido: uid.substring(0, 8).toUpperCase(),
      nivel: 'activo',
      dias_consecutivos: 0,
      rol: 'admin',
      empresa_id: empresaId,
    });

    const saved = await this.jugadorRepo.save(admin);
    const { password, ...resultado } = saved as any;
    return resultado;
  }

  // Crear jugador para una empresa (usado por admin de empresa)
  async crearJugadorParaEmpresa(
    empresaId: number,
    datos: { email: string; password: string; nombre: string },
  ) {
    const empresa = await this.empresaRepo.findOne({
      where: { id: empresaId },
    });
    if (!empresa) {
      throw new NotFoundException('Empresa no encontrada.');
    }

    const existeEmail = await this.jugadorRepo.findOne({
      where: { email: datos.email },
    });
    if (existeEmail) {
      throw new BadRequestException('Ya existe un usuario con ese email.');
    }

    if (datos.password.length < 6) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 6 caracteres.',
      );
    }

    const hash = await bcrypt.hash(datos.password, 10);
    const uid = this.generarUid();

    const jugador = this.jugadorRepo.create({
      uid,
      email: datos.email,
      password: hash,
      correo: datos.email,
      nombre: datos.nombre || '',
      telefono: '',
      monedas: 0,
      monedas_totales_ganadas: 0,
      codigo_referido: uid.substring(0, 8).toUpperCase(),
      nivel: 'activo',
      dias_consecutivos: 0,
      rol: 'jugador',
      empresa_id: empresaId,
    });

    const saved = await this.jugadorRepo.save(jugador);
    const { password, ...resultado } = saved as any;
    return resultado;
  }

  private generarUid(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 28; i++) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uid;
  }
}
