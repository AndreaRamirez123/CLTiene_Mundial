import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { Empresa } from '../entities/empresa.entity';
import { ConfigMarca } from '../entities/config-marca.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(ConfigMarca)
    private configMarcaRepo: Repository<ConfigMarca>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  // Config publica de marca por slug (sin auth, para pantalla de login)
  async obtenerConfigPublica(slug: string) {
    const empresaId = await this.resolverEmpresa(slug);
    const config = await this.configMarcaRepo.findOne({
      where: { empresa_id: empresaId },
    });
    return config || {};
  }

  // Resolver empresa_id desde slug
  private async resolverEmpresa(slug?: string): Promise<number> {
    if (!slug || slug === 'default') {
      return this.getEmpresaDefault();
    }
    const empresa = await this.empresaRepo.findOne({ where: { slug, estado: 'activa' } });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada o inactiva.');
    }
    return empresa.id;
  }

  private async getEmpresaDefault(): Promise<number> {
    let empresa = await this.empresaRepo.findOne({ where: { slug: 'default' } });
    if (!empresa) {
      empresa = this.empresaRepo.create({
        nombre: 'CLTiene Mundial',
        slug: 'default',
        estado: 'activa',
      });
      empresa = await this.empresaRepo.save(empresa);

      const config = this.configMarcaRepo.create({ empresa_id: empresa.id });
      await this.configMarcaRepo.save(config);
    }
    return empresa.id;
  }

  async registro(email: string, password: string, empresaSlug?: string) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    const existe = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
    });
    if (existe) {
      throw new BadRequestException('Este correo ya esta registrado en esta empresa.');
    }

    if (password.length < 6) {
      throw new BadRequestException('La contrasena debe tener al menos 6 caracteres.');
    }

    const hash = await bcrypt.hash(password, 10);
    const uid = this.generarUid();

    const jugador = this.jugadorRepo.create({
      uid,
      email,
      password: hash,
      correo: email,
      nombre: '',
      telefono: '',
      monedas: 0,
      monedas_totales_ganadas: 0,
      codigo_referido: uid.substring(0, 8).toUpperCase(),
      nivel: 'inactivo',
      dias_consecutivos: 0,
      empresa_id: empresaId,
    });

    const saved = await this.jugadorRepo.save(jugador);
    const token = this.generarToken(saved);

    return {
      token,
      usuario: this.limpiarUsuario(saved),
    };
  }

  async login(email: string, password: string, empresaSlug?: string) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    const jugador = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
      select: ['id', 'uid', 'email', 'password', 'nombre', 'rol', 'monedas', 'telefono', 'empresa_id'],
    });

    if (!jugador) {
      throw new UnauthorizedException('Correo o contrasena incorrectos.');
    }

    const passValida = await bcrypt.compare(password, jugador.password);
    if (!passValida) {
      throw new UnauthorizedException('Correo o contrasena incorrectos.');
    }

    const token = this.generarToken(jugador);

    return {
      token,
      usuario: this.limpiarUsuario(jugador),
    };
  }

  async completarPerfil(uid: string, datos: {
    nombre: string;
    telefono: string;
    tipojugador: string;
    relacion_cltiene: string;
    es_referido: number;
    nombre_referidor: string;
    referido_por: string;
    departamento: string;
    ciudad: string;
  }) {
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const telLimpio = datos.telefono.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(telLimpio)) {
      throw new BadRequestException('El numero de telefono no es valido. Debe ser un celular colombiano de 10 digitos.');
    }

    // Verificar telefono unico dentro de la misma empresa
    const telExiste = await this.jugadorRepo.findOne({
      where: { telefono: telLimpio, empresa_id: jugador.empresa_id },
    });
    if (telExiste && telExiste.id !== jugador.id) {
      throw new BadRequestException('Este numero de telefono ya esta registrado por otro jugador.');
    }

    const bonoRegistro = 100;

    return this.dataSource.transaction(async (manager) => {
      jugador.nombre = datos.nombre;
      jugador.telefono = telLimpio;
      jugador.tipojugador = datos.tipojugador || null;
      jugador.relacion_cltiene = datos.relacion_cltiene || null;
      jugador.es_referido = datos.es_referido;
      jugador.nombre_referidor = datos.nombre_referidor;
      jugador.referido_por = datos.referido_por;
      jugador.departamento = datos.departamento || '';
      jugador.ciudad = datos.ciudad || '';
      jugador.monedas = bonoRegistro;
      jugador.monedas_totales_ganadas = bonoRegistro;
      jugador.ultimo_acceso = new Date();
      jugador.dias_consecutivos = 1;

      const saved = await manager.save(jugador);

      await manager.save(Transaccion, {
        jugador_id: saved.id,
        tipo: 'registro',
        monto: bonoRegistro,
        saldo_anterior: 0,
        saldo_nuevo: bonoRegistro,
        descripcion: 'Bono de bienvenida por registro',
      });

      return { mensaje: 'Perfil completado', usuario: this.limpiarUsuario(saved) };
    });
  }

  async loginConGoogle(credential: string, empresaSlug?: string) {
    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString(),
    );

    const email = payload.email;
    const nombre = payload.name || '';

    if (!email) {
      throw new BadRequestException('No se pudo obtener el correo de Google.');
    }

    const empresaId = await this.resolverEmpresa(empresaSlug);

    // Buscar si ya existe en esta empresa
    let jugador = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
    });

    if (!jugador) {
      const uid = this.generarUid();
      const randomPass = await bcrypt.hash(this.generarUid(), 10);

      jugador = this.jugadorRepo.create({
        uid,
        email,
        password: randomPass,
        correo: email,
        nombre: '',
        telefono: '',
        monedas: 0,
        monedas_totales_ganadas: 0,
        codigo_referido: uid.substring(0, 8).toUpperCase(),
        nivel: 'inactivo',
        dias_consecutivos: 0,
        empresa_id: empresaId,
      });

      jugador = await this.jugadorRepo.save(jugador);
    }

    const token = this.generarToken(jugador);

    return {
      token,
      usuario: this.limpiarUsuario(jugador),
      googleNombre: nombre,
    };
  }

  private generarToken(jugador: Jugador) {
    return this.jwtService.sign({
      sub: jugador.id,
      uid: jugador.uid,
      email: jugador.email,
      rol: jugador.rol,
      empresa_id: jugador.empresa_id,
    });
  }

  private limpiarUsuario(jugador: Jugador) {
    const { password, ...usuario } = jugador as any;
    return usuario;
  }

  private generarUid(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 28; i++) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uid;
  }
}
