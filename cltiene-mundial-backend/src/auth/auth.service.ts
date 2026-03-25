import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) {}

  async registro(email: string, password: string) {
    const existe = await this.jugadorRepo.findOne({ where: { email } });
    if (existe) {
      throw new BadRequestException('Este correo ya está registrado. Inicia sesión.');
    }

    if (password.length < 6) {
      throw new BadRequestException('La contraseña debe tener al menos 6 caracteres.');
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
    });

    const saved = await this.jugadorRepo.save(jugador);
    const token = this.generarToken(saved);

    return {
      token,
      usuario: this.limpiarUsuario(saved),
    };
  }

  async login(email: string, password: string) {
    const jugador = await this.jugadorRepo.findOne({
      where: { email },
      select: ['id', 'uid', 'email', 'password', 'nombre', 'rol', 'monedas', 'telefono'],
    });

    if (!jugador) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
    }

    const passValida = await bcrypt.compare(password, jugador.password);
    if (!passValida) {
      throw new UnauthorizedException('Correo o contraseña incorrectos.');
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

    // Validar teléfono colombiano
    const telLimpio = datos.telefono.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(telLimpio)) {
      throw new BadRequestException('El número de teléfono no es válido. Debe ser un celular colombiano de 10 dígitos.');
    }

    // Verificar teléfono único
    const telExiste = await this.jugadorRepo.findOne({ where: { telefono: telLimpio } });
    if (telExiste && telExiste.id !== jugador.id) {
      throw new BadRequestException('Este número de teléfono ya está registrado por otro jugador.');
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

  async loginConGoogle(credential: string) {
    // Decodificar el ID token de Google (es un JWT)
    const payload = JSON.parse(
      Buffer.from(credential.split('.')[1], 'base64').toString(),
    );

    const email = payload.email;
    const nombre = payload.name || '';

    if (!email) {
      throw new BadRequestException('No se pudo obtener el correo de Google.');
    }

    // Buscar si ya existe
    let jugador = await this.jugadorRepo.findOne({ where: { email } });

    if (!jugador) {
      // Crear cuenta nueva (nombre vacío para que pase por el cuestionario)
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
