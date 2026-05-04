import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { Empresa } from '../entities/empresa.entity';
import { ConfigMarca } from '../entities/config-marca.entity';
import { SsoSession } from '../entities/sso-session.entity';
import {
  actualizarRachaDeAcceso,
  calcularNivelActividad,
} from '../users/nivel-actividad.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    @InjectRepository(Empresa)
    private empresaRepo: Repository<Empresa>,
    @InjectRepository(ConfigMarca)
    private configMarcaRepo: Repository<ConfigMarca>,
    @InjectRepository(SsoSession)
    private ssoSessionRepo: Repository<SsoSession>,
    private jwtService: JwtService,
    private dataSource: DataSource,
  ) { }

  // Listar empresas activas (publico, para selector de login)
  async listarEmpresasActivas() {
    return this.empresaRepo.find({
      where: { estado: 'activa' },
      select: ['id', 'nombre', 'slug'],
      order: { nombre: 'ASC' },
    });
  }

  // Config publica de marca por slug
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
    const empresa = await this.empresaRepo.findOne({
      where: { slug, estado: 'activa' },
    });
    if (!empresa) {
      throw new BadRequestException('Empresa no encontrada o inactiva.');
    }
    return empresa.id;
  }

  private async getEmpresaDefault(): Promise<number> {
    let empresa = await this.empresaRepo.findOne({
      where: { slug: 'default' },
    });
    if (!empresa) {
      // Ajustado para consultar la empresa marcada como default, desde base de datos "NOTA: Por defecto solo va a tomar el primer registro que encuentre con slug 'default', si hay varios, se recomienda mantener solo uno"
      empresa = this.empresaRepo.create({
        slug: 'default',
        estado: 'activa',
      });
      empresa = await this.empresaRepo.save(empresa);

      const config = this.configMarcaRepo.create({ empresa_id: empresa.id });
      await this.configMarcaRepo.save(config);
    }
    return empresa.id;
  }

  private validarPasswordSegura(password: string) {
    const reglas = [
      password.length >= 8,
      /[A-ZÀ-ÖØ-ÝÑ]/.test(password),
      /[a-zà-öø-ÿñ]/.test(password),
      /[0-9]/.test(password),
      /[^A-Za-z0-9À-ÖØ-Ýà-öø-ÿÑñÜü]/.test(password),
    ];
    const cumplidas = reglas.filter(Boolean).length;
    if (cumplidas < 4) {
      throw new BadRequestException(
        'La contraseña debe cumplir al menos 4 de 5 requisitos: 8+ caracteres, mayúscula, minúscula, número y carácter especial.',
      );
    }
  }

  async registro(email: string, password: string, empresaSlug?: string) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    const existe = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
    });
    if (existe) {
      throw new BadRequestException(
        'Este correo ya esta registrado en esta empresa.',
      );
    }

    this.validarPasswordSegura(password);

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

  async registroCompleto(
    email: string,
    password: string,
    empresaSlug: string,
    datos: {
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
    const empresaId = await this.resolverEmpresa(empresaSlug);

    const existe = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
    });
    if (existe) {
      throw new BadRequestException(
        'Este correo ya esta registrado en esta empresa.',
      );
    }

    this.validarPasswordSegura(password);

    const telLimpio = datos.telefono.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(telLimpio)) {
      throw new BadRequestException(
        'El numero de telefono no es valido. Debe ser un celular colombiano de 10 digitos.',
      );
    }

    const telExiste = await this.jugadorRepo.findOne({
      where: { telefono: telLimpio, empresa_id: empresaId },
    });
    if (telExiste) {
      throw new BadRequestException(
        'Este numero de telefono ya esta registrado por otro jugador.',
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const uid = this.generarUid();
    const bonoRegistro = 100;

    return this.dataSource.transaction(async (manager) => {
      const jugador = this.jugadorRepo.create({
        uid,
        email,
        password: hash,
        correo: email,
        nombre: datos.nombre,
        telefono: telLimpio,
        tipojugador: datos.tipojugador || null,
        relacion_cltiene: datos.relacion_cltiene || null,
        es_referido: datos.es_referido,
        nombre_referidor: datos.nombre_referidor || '',
        referido_por: datos.referido_por || '',
        departamento: datos.departamento || '',
        ciudad: datos.ciudad || '',
        monedas: bonoRegistro,
        monedas_totales_ganadas: bonoRegistro,
        codigo_referido: uid.substring(0, 8).toUpperCase(),
        nivel: 'activo',
        dias_consecutivos: 1,
        ultimo_acceso: new Date(),
        empresa_id: empresaId,
      });

      const saved: Jugador = await manager.save(Jugador, jugador);

      await manager.save(Transaccion, {
        jugador_id: saved.id,
        tipo: 'registro',
        monto: bonoRegistro,
        saldo_anterior: 0,
        saldo_nuevo: bonoRegistro,
        descripcion: 'Bono de bienvenida por registro',
      });

      const token = this.generarToken(saved);
      return {
        token,
        usuario: this.limpiarUsuario(saved),
      };
    });
  }

  async login(email: string, password: string, empresaSlug?: string) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    let jugador = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
      select: [
        'id',
        'uid',
        'email',
        'password',
        'nombre',
        'rol',
        'monedas',
        'telefono',
        'empresa_id',
        'ultimo_acceso',
        'dias_consecutivos',
        'predicciones_count',
        'trivias_jugadas',
        'nivel',
      ],
    });

    // Si no existe en esta empresa, verificar si es superadmin en otra
    if (!jugador) {
      const superadminEnOtra = await this.jugadorRepo.findOne({
        where: { email, rol: 'superadmin' },
        select: [
          'id',
          'email',
          'password',
          'nombre',
          'telefono',
          'correo',
          'departamento',
          'ciudad',
          'tipojugador',
          'relacion_cltiene',
        ],
      });

      if (superadminEnOtra) {
        const passValida = await bcrypt.compare(
          password,
          superadminEnOtra.password,
        );
        if (!passValida) {
          throw new UnauthorizedException('Correo o contrasena incorrectos.');
        }

        // Auto-crear cuenta superadmin completa en esta empresa
        const uid = this.generarUid();
        jugador = this.jugadorRepo.create({
          uid,
          email,
          password: superadminEnOtra.password,
          correo: superadminEnOtra.correo || email,
          nombre: superadminEnOtra.nombre || '',
          telefono: superadminEnOtra.telefono || '',
          departamento: superadminEnOtra.departamento || '',
          ciudad: superadminEnOtra.ciudad || '',
          tipojugador: superadminEnOtra.tipojugador || null,
          relacion_cltiene: superadminEnOtra.relacion_cltiene || null,
          monedas: 100,
          monedas_totales_ganadas: 100,
          codigo_referido: uid.substring(0, 8).toUpperCase(),
          nivel: 'activo',
          dias_consecutivos: 1,
          ultimo_acceso: new Date(),
          rol: 'superadmin',
          empresa_id: empresaId,
        });
        jugador = await this.jugadorRepo.save(jugador);

        const token = this.generarToken(jugador);
        return { token, usuario: this.limpiarUsuario(jugador) };
      }

      throw new UnauthorizedException('Correo o contrasena incorrectos.');
    }

    const passValida = await bcrypt.compare(password, jugador.password);
    if (!passValida) {
      throw new UnauthorizedException('Correo o contrasena incorrectos.');
    }

    actualizarRachaDeAcceso(jugador);
    jugador.nivel = calcularNivelActividad(jugador);
    jugador = await this.jugadorRepo.save(jugador);

    const token = this.generarToken(jugador);

    return {
      token,
      usuario: this.limpiarUsuario(jugador),
    };
  }

  async completarPerfil(
    uid: string,
    datos: {
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
    const jugador = await this.jugadorRepo.findOne({ where: { uid } });
    if (!jugador) {
      throw new BadRequestException('Usuario no encontrado.');
    }

    const telLimpio = datos.telefono.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(telLimpio)) {
      throw new BadRequestException(
        'El numero de telefono no es valido. Debe ser un celular colombiano de 10 digitos.',
      );
    }

    // Verificar telefono unico dentro de la misma empresa
    const telExiste = await this.jugadorRepo.findOne({
      where: { telefono: telLimpio, empresa_id: jugador.empresa_id },
    });
    if (telExiste && telExiste.id !== jugador.id) {
      throw new BadRequestException(
        'Este numero de telefono ya esta registrado por otro jugador.',
      );
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

      return {
        mensaje: 'Perfil completado',
        usuario: this.limpiarUsuario(saved),
      };
    });
  }

  // === SSO CUN 360: server-to-server (Opcion C) ===
  // CUN 360 envia datos completos del usuario + API KEY desde su servidor.
  // Creamos/actualizamos el jugador y devolvemos un token temporal para redirigir.
  async crearSsoCunSession(
    apiKey: string,
    datos: {
      email: string;
      nombre?: string;
      telefono?: string;
      tipojugador?: string;
      relacion_cltiene?: string;
      departamento?: string;
      ciudad?: string;
    },
  ) {
    // 1. Validar API KEY
    const expectedKey = process.env.CUN_API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('API Key invalida.');
    }

    // 2. Validar correo
    if (!datos.email || typeof datos.email !== 'string') {
      throw new BadRequestException('Email requerido.');
    }
    const emailLimpio = datos.email.trim().toLowerCase();
    if (!emailLimpio.endsWith('@cun.edu.co')) {
      throw new BadRequestException(
        'Solo se permiten correos institucionales @cun.edu.co.',
      );
    }

    // 3. Resolver empresa CUN (siempre empresa_id de la CUN)
    const slugCun = process.env.CUN_EMPRESA_SLUG || 'cun';
    const empresaCun = await this.empresaRepo.findOne({
      where: { slug: slugCun, estado: 'activa' },
    });
    if (!empresaCun) {
      throw new BadRequestException(
        `Empresa CUN (slug='${slugCun}') no encontrada o inactiva.`,
      );
    }
    const empresaId = empresaCun.id;

    // 4. Buscar o crear jugador
    let jugador = await this.jugadorRepo.findOne({
      where: { email: emailLimpio, empresa_id: empresaId },
    });

    const telLimpio = (datos.telefono || '').replace(/\D/g, '');
    const nombreFinal =
      datos.nombre ||
      emailLimpio
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    // Validar enums por si CUN envia algo distinto
    const tiposValidos = ['natural', 'empresa', 'organizacion', 'explorar'];
    const relacionesValidas = ['cliente', 'escuchado', 'explorando', 'nuevo'];
    const tipojugador = tiposValidos.includes(datos.tipojugador || '')
      ? datos.tipojugador
      : 'natural';
    const relacion_cltiene = relacionesValidas.includes(
      datos.relacion_cltiene || '',
    )
      ? datos.relacion_cltiene
      : 'nuevo';

    if (!jugador) {
      // Crear nuevo jugador con bono de bienvenida
      const uid = this.generarUid();
      const randomPass = await bcrypt.hash(this.generarUid(), 10);
      const bonoRegistro = 100;

      try {
        const nuevo = this.jugadorRepo.create({
          uid,
          email: emailLimpio,
          password: randomPass,
          correo: emailLimpio,
          nombre: nombreFinal,
          telefono: telLimpio,
          tipojugador,
          relacion_cltiene,
          departamento: datos.departamento || '',
          ciudad: datos.ciudad || '',
          monedas: bonoRegistro,
          monedas_totales_ganadas: bonoRegistro,
          codigo_referido: uid.substring(0, 8).toUpperCase(),
          nivel: 'activo',
          dias_consecutivos: 1,
          ultimo_acceso: new Date(),
          empresa_id: empresaId,
          rol: 'jugador',
        });

        jugador = await this.jugadorRepo.save(nuevo);

        await this.dataSource.getRepository(Transaccion).save({
          jugador_id: jugador.id,
          tipo: 'registro',
          monto: bonoRegistro,
          saldo_anterior: 0,
          saldo_nuevo: bonoRegistro,
          descripcion: 'Bono de bienvenida - acceso via CUN 360',
        });
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY') {
          jugador = await this.jugadorRepo.findOne({
            where: { email: emailLimpio, empresa_id: empresaId },
          });
          if (!jugador) throw err;
        } else {
          throw err;
        }
      }
    } else {
      // Jugador existe: actualizar datos y racha de acceso
      actualizarRachaDeAcceso(jugador);
      if (datos.nombre) jugador.nombre = datos.nombre;
      if (telLimpio) jugador.telefono = telLimpio;
      if (datos.departamento) jugador.departamento = datos.departamento;
      if (datos.ciudad) jugador.ciudad = datos.ciudad;
      jugador.nivel = calcularNivelActividad(jugador);
      jugador = await this.jugadorRepo.save(jugador);
    }

    // 5. Generar token temporal de sesion (single-use, expira en 5 min)
    const sessionToken = this.generarSessionToken();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.ssoSessionRepo.save({
      token: sessionToken,
      jugador_id: jugador.id,
      expires_at: expiresAt,
      used: 0,
    });

    return {
      session_token: sessionToken,
      expires_in: 300,
      redirect_url_hint: `/?session=${sessionToken}`,
    };
  }

  // Cliente consume el session_token y obtiene JWT real
  async consumirSsoSession(sessionToken: string) {
    if (!sessionToken) {
      throw new BadRequestException('Token de sesion requerido.');
    }

    const session = await this.ssoSessionRepo.findOne({
      where: { token: sessionToken },
    });

    if (!session) {
      throw new UnauthorizedException('Token invalido.');
    }

    if (session.used === 1) {
      throw new UnauthorizedException('Token ya fue usado.');
    }

    if (new Date() > session.expires_at) {
      throw new UnauthorizedException('Token expirado.');
    }

    // Marcar como usado (single-use)
    session.used = 1;
    await this.ssoSessionRepo.save(session);

    const jugador = await this.jugadorRepo.findOne({
      where: { id: session.jugador_id },
    });

    if (!jugador) {
      throw new UnauthorizedException('Jugador no encontrado.');
    }

    actualizarRachaDeAcceso(jugador);
    jugador.nivel = calcularNivelActividad(jugador);
    const jugadorActualizado = await this.jugadorRepo.save(jugador);

    const token = this.generarToken(jugadorActualizado);
    return {
      token,
      usuario: this.limpiarUsuario(jugadorActualizado),
    };
  }

  private generarSessionToken(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 48; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  // SSO CUN 360: login automático por correo institucional
  async loginSsoCun(email: string, empresaSlug?: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Correo no proporcionado.');
    }

    const emailLimpio = email.trim().toLowerCase();

    if (!emailLimpio.endsWith('@cun.edu.co')) {
      throw new UnauthorizedException(
        'Solo se permite el acceso con correo institucional @cun.edu.co.',
      );
    }

    // Este endpoint es exclusivo de CUN 360: siempre asociar a la empresa CUN
    const slugFinal = empresaSlug || process.env.CUN_EMPRESA_SLUG || 'cun';
    const empresaId = await this.resolverEmpresa(slugFinal);

    let jugador = await this.jugadorRepo.findOne({
      where: { email: emailLimpio, empresa_id: empresaId },
    });

    if (!jugador) {
      const uid = this.generarUid();
      const randomPass = await bcrypt.hash(this.generarUid(), 10);
      const nombreDesdeCorreo = emailLimpio
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());
      const bonoRegistro = 100;

      try {
        const nuevo = this.jugadorRepo.create({
          uid,
          email: emailLimpio,
          password: randomPass,
          correo: emailLimpio,
          nombre: nombreDesdeCorreo,
          telefono: '',
          departamento: '',
          ciudad: '',
          tipojugador: 'natural',
          relacion_cltiene: 'nuevo',
          monedas: bonoRegistro,
          monedas_totales_ganadas: bonoRegistro,
          codigo_referido: uid.substring(0, 8).toUpperCase(),
          nivel: 'activo',
          dias_consecutivos: 1,
          ultimo_acceso: new Date(),
          empresa_id: empresaId,
          rol: 'jugador',
        });

        jugador = await this.jugadorRepo.save(nuevo);

        await this.dataSource.getRepository(Transaccion).save({
          jugador_id: jugador.id,
          tipo: 'registro',
          monto: bonoRegistro,
          saldo_anterior: 0,
          saldo_nuevo: bonoRegistro,
          descripcion: 'Bono de bienvenida - acceso via CUN 360',
        });
      } catch (err: any) {
        // Race condition: si otra request creo el usuario al mismo tiempo,
        // recuperarlo en vez de fallar.
        if (err?.code === 'ER_DUP_ENTRY') {
          jugador = await this.jugadorRepo.findOne({
            where: { email: emailLimpio, empresa_id: empresaId },
          });
          if (!jugador) throw err;
        } else {
          throw err;
        }
      }
    } else {
      actualizarRachaDeAcceso(jugador);
      jugador.nivel = calcularNivelActividad(jugador);
      jugador = await this.jugadorRepo.save(jugador);
    }

    const token = this.generarToken(jugador);

    return {
      token,
      usuario: this.limpiarUsuario(jugador),
    };
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
      // Verificar si es superadmin en otra empresa
      const superadminEnOtra = await this.jugadorRepo.findOne({
        where: { email, rol: 'superadmin' },
      });

      const uid = this.generarUid();
      const randomPass = await bcrypt.hash(this.generarUid(), 10);
      const esSuperadmin = !!superadminEnOtra;

      jugador = this.jugadorRepo.create({
        uid,
        email,
        password: randomPass,
        correo: superadminEnOtra?.correo || email,
        nombre: superadminEnOtra?.nombre || '',
        telefono: superadminEnOtra?.telefono || '',
        departamento: superadminEnOtra?.departamento || '',
        ciudad: superadminEnOtra?.ciudad || '',
        tipojugador: superadminEnOtra?.tipojugador || null,
        relacion_cltiene: superadminEnOtra?.relacion_cltiene || null,
        monedas: esSuperadmin ? 100 : 0,
        monedas_totales_ganadas: esSuperadmin ? 100 : 0,
        codigo_referido: uid.substring(0, 8).toUpperCase(),
        nivel: esSuperadmin ? 'activo' : 'inactivo',
        dias_consecutivos: esSuperadmin ? 1 : 0,
        ultimo_acceso: esSuperadmin ? new Date() : null,
        empresa_id: empresaId,
        rol: esSuperadmin ? 'superadmin' : 'jugador',
      });

      jugador = await this.jugadorRepo.save(jugador);
    } else {
      actualizarRachaDeAcceso(jugador);
      jugador.nivel = calcularNivelActividad(jugador);
      jugador = await this.jugadorRepo.save(jugador);
    }

    const token = this.generarToken(jugador);

    return {
      token,
      usuario: this.limpiarUsuario(jugador),
      googleNombre: nombre,
    };
  }

  // === RESET DE CONTRASEÑA ===

  private async enviarEmail(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
    });
  }

  private generarCodigo6Digitos(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async solicitarResetPassword(email: string, empresaSlug?: string) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    const jugador = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
    });

    if (!jugador) {
      return {
        mensaje:
          'Si el correo está registrado, recibirás un código de recuperación.',
      };
    }

    const codigo = this.generarCodigo6Digitos();
    jugador.reset_token = codigo;
    jugador.reset_token_expira = new Date(Date.now() + 15 * 60 * 1000);
    await this.jugadorRepo.save(jugador);

    try {
      await this.enviarEmail(
        email,
        'Recupera tu contraseña - CLTiene Mundial',
        `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #231F20;">Recupera tu contraseña</h2>
            <p>Tu código de verificación es:</p>
            <div style="background: #F8F7F5; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #636161;">${codigo}</span>
            </div>
            <p style="color: #080808; font-size: 14px;">Este código expira en 15 minutos. Si no solicitaste este cambio, ignora este correo.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 14px; text-align: center;">Este es un correo automático, por favor no respondas a este mensaje.</p>
          </div>
        `,
      );
    } catch (err: unknown) {
      console.error('Error enviando email de reset:', err);
      throw new BadRequestException(
        'No se pudo enviar el correo. Intenta de nuevo más tarde.',
      );
    }

    return {
      mensaje:
        'Si el correo está registrado, recibirás un código de recuperación.',
    };
  }

  async resetPassword(
    email: string,
    codigo: string,
    nuevaPassword: string,
    empresaSlug?: string,
  ) {
    const empresaId = await this.resolverEmpresa(empresaSlug);

    this.validarPasswordSegura(nuevaPassword);

    const jugador = await this.jugadorRepo.findOne({
      where: { email, empresa_id: empresaId },
      select: ['id', 'reset_token', 'reset_token_expira'],
    });

    if (!jugador || !jugador.reset_token) {
      throw new BadRequestException('Código inválido o expirado.');
    }

    if (jugador.reset_token !== codigo) {
      throw new BadRequestException('Código inválido o expirado.');
    }

    if (
      !jugador.reset_token_expira ||
      new Date() > jugador.reset_token_expira
    ) {
      throw new BadRequestException('Código inválido o expirado.');
    }

    const hash = await bcrypt.hash(nuevaPassword, 10);
    jugador.password = hash;
    jugador.reset_token = null;
    jugador.reset_token_expira = null;
    await this.jugadorRepo.save(jugador);

    return { mensaje: 'Contraseña actualizada correctamente.' };
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
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uid = '';
    for (let i = 0; i < 28; i++) {
      uid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return uid;
  }
}
