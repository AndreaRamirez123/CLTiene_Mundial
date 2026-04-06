import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Jugador } from '../entities/jugador.entity';
import { Transaccion } from '../entities/transaccion.entity';
import { actualizarRachaDeAcceso, calcularNivelActividad } from './nivel-actividad.util';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(Jugador)
    private jugadorRepo: Repository<Jugador>,
    private dataSource: DataSource,
  ) {}

  // Recalcular nivel de actividad de todos los jugadores cada hora
  @Cron('0 * * * *')
  async recalcularNiveles() {
    const jugadores = await this.jugadorRepo.find({
      select: ['id', 'ultimo_acceso', 'predicciones_count', 'trivias_jugadas', 'dias_consecutivos', 'nivel'],
    });

    let actualizados = 0;
    for (const jugador of jugadores) {
      const nuevoNivel = calcularNivelActividad(jugador);
      if (jugador.nivel !== nuevoNivel) {
        await this.jugadorRepo.update(jugador.id, { nivel: nuevoNivel });
        actualizados++;
      }
    }

    if (actualizados > 0) {
      this.logger.log(`Niveles recalculados: ${actualizados} jugadores actualizados`);
    }
  }

  async getByUid(uid: string, email?: string): Promise<Jugador | null> {
    let jugador = await this.jugadorRepo.findOne({ where: { uid } });

    // Si no existe por uid pero sí por email, vincular el nuevo uid al registro existente
    if (!jugador && email) {
      jugador = await this.jugadorRepo.findOne({ where: { email } });
      if (jugador) {
        jugador.uid = uid;
      }
    }

    if (!jugador) return null;

    actualizarRachaDeAcceso(jugador);
    jugador.nivel = calcularNivelActividad(jugador);
    await this.jugadorRepo.save(jugador);

    return jugador;
  }

  async registrar(datos: {
    uid: string;
    email: string;
    nombre: string;
    telefono: string;
    correo: string;
    tipojugador: string;
    relacion_cltiene: string;
    es_referido: number;
    nombre_referidor: string;
    referido_por: string;
  }) {
    const existe = await this.jugadorRepo.findOne({ where: { uid: datos.uid } });
    if (existe) {
      throw new BadRequestException('El jugador ya está registrado');
    }

    // Verificar que el email no esté registrado por otro jugador
    const emailExiste = await this.jugadorRepo.findOne({ where: { email: datos.email } });
    if (emailExiste) {
      throw new BadRequestException('Este correo ya tiene una cuenta registrada. Inicia sesión con tu cuenta existente.');
    }

    // Validar formato de teléfono (colombiano: 10 dígitos, empieza con 3)
    const telLimpio = datos.telefono.replace(/\D/g, '');
    if (!/^3\d{9}$/.test(telLimpio)) {
      throw new BadRequestException('El número de teléfono no es válido. Debe ser un celular colombiano de 10 dígitos.');
    }

    // Verificar que el teléfono no esté registrado por otro jugador
    const telExiste = await this.jugadorRepo.findOne({ where: { telefono: telLimpio } });
    if (telExiste) {
      throw new BadRequestException('Este número de teléfono ya está registrado por otro jugador.');
    }

    // Guardar teléfono limpio (solo dígitos)
    datos.telefono = telLimpio;

    const codigoReferido = datos.uid.substring(0, 8).toUpperCase();
    const bonoRegistro = 100;

    return this.dataSource.transaction(async (manager) => {
      const jugador = manager.create(Jugador, {
        uid: datos.uid,
        email: datos.email,
        nombre: datos.nombre,
        telefono: datos.telefono,
        correo: datos.correo,
        tipojugador: datos.tipojugador || null,
        relacion_cltiene: datos.relacion_cltiene || null,
        es_referido: datos.es_referido,
        nombre_referidor: datos.nombre_referidor,
        codigo_referido: codigoReferido,
        referido_por: datos.referido_por,
        monedas: bonoRegistro,
        monedas_totales_ganadas: bonoRegistro,
        ultimo_acceso: new Date(),
        dias_consecutivos: 1,
        nivel: 'inactivo',
      });

      const saved = await manager.save(jugador);

      await manager.save(Transaccion, {
        jugador_id: saved.id,
        tipo: 'registro',
        monto: bonoRegistro,
        saldo_anterior: 0,
        saldo_nuevo: bonoRegistro,
        descripcion: 'Bono de bienvenida por registro',
      });

      return saved;
    });
  }
}
